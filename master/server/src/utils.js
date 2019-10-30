import consul from './consul';
import range from 'lodash/range';
import max from 'lodash/max';
import uniq from 'lodash/uniq';
import log4js from 'log4js';
import fetch from 'node-fetch';
//import { sleep } from 'sleep';
import crypto from 'crypto';

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } }
});

const logger = log4js.getLogger();

const generateHash = value =>
  `${crypto
    .createHash('md5')
    .update(value)
    .digest('hex')}.${Date.now()}`;

const getCurrentChain = async () => {
  let chain = null;

  try {
    chain = (await consul.kv.get('chain'))[0];
    chain = chain ? JSON.parse(chain.Value) : null;
  } catch (err) {
    logger.error(err);
  }

  return chain;
};

export const adjustChain = async (fromWatcher = true) => {
  const nodes = await getDBNodes();
  const chain = await createChain(nodes, fromWatcher);

  await consul.kv.set('chain', JSON.stringify(chain));

  return chain;
};

export const getDBNodes = async () => {
  let nodes = [];

  try {
    nodes = (await consul.health.checks('db-service'))[0]
      .map(n => ({
        ...n,
        address: n.ServiceID
      }))
      .filter(n => n.Status === 'passing');
  } catch (err) {
    logger.error(err.cause);
  }

  return nodes;
};

export const createChain = async (nodes, fromWatcher) => {
  const currentChain = await getCurrentChain();
  const totalNodes = nodes.length;

  if (totalNodes === 0) {
    if (fromWatcher) {
      logger.warn('All nodes have failed.');
    }

    return {
      head: null,
      tail: null
    };
  }

  if (!currentChain) {
    logger.info('No chain found. Creating chain...');
    const head = nodes.pop();
    const tail = totalNodes > 1 ? nodes.pop() : head;

    let chain = {
      head: head ? head.address : null,
      tail: tail ? tail.address : null
    };

    nodes.forEach((n, i) => {
      chain = {
        ...chain,
        [i + 2]: n.address
      };
    });

    logger.info(`Chain created: ${JSON.stringify(chain)}`);

    return chain;
  } else {
    let chain = {
      head: currentChain.head,
      tail: currentChain.tail
    };

    const currentChainKeys = Object.keys(currentChain);
    const currentChainValues = uniq(Object.values(currentChain).filter(v => v));
    const highestBeforeTail = max(
      currentChainKeys
        .filter(k => k !== 'head' && k !== 'tail')
        .map(k => parseInt(k))
    );
    const hasNodeDied = nodes.length < currentChainValues.length;
    const hasNodeRecovered = nodes.length > currentChainValues.length;

    if (hasNodeDied) {
      let changedNodeKey = currentChainKeys.find(
        k => !nodes.some(n => n.address === currentChain[k])
      );

      const isHead = currentChain[changedNodeKey] === currentChain.head;
      const isTail = currentChain[changedNodeKey] === currentChain.tail;

      if (isHead) {
        changedNodeKey = 2;
        chain.head = currentChain[changedNodeKey] || chain.tail;
        logger.info(`HEAD node failed: ${currentChain['head']}`);
      } else if (isTail) {
        changedNodeKey = highestBeforeTail;
        chain.tail = currentChain[highestBeforeTail] || chain.head;
        logger.info(`TAIL node failed: ${currentChain['tail']}`);
      } else {
        changedNodeKey = parseInt(changedNodeKey);
        logger.info(
          `Node at position ${changedNodeKey} has failed: ${currentChain[changedNodeKey]}`
        );
      }

      range(2, highestBeforeTail).forEach(r => {
        chain = {
          ...chain,
          [r]: r >= changedNodeKey ? currentChain[r + 1] : currentChain[r]
        };

        if (r >= changedNodeKey) {
          logger.info(
            `Node position changed from ${r + 1} to ${r}: ${
              currentChain[r + 1]
            }`
          );
        }
      });
    } else if (hasNodeRecovered) {
      const recoveredNode = nodes.find(
        n => !currentChainValues.some(v => n.address === v)
      );

      chain = currentChain;

      if (chain.tail !== chain.head) {
        chain[(highestBeforeTail || 1) + 1] = chain.tail;
      } else if (chain.head === null) {
        chain.head = recoveredNode.address;
      }

      chain.tail = recoveredNode.address;

      logger.info(`Node recovered: ${recoveredNode.address}`);
      logger.info(`Node added to the TAIL: ${recoveredNode.address}`);
    }

    if (hasNodeDied || hasNodeRecovered) {
      logger.info(`Updated chain: ${JSON.stringify(chain)}`);

      return chain;
    } else {
      if (fromWatcher) {
        logger.info(`Chain not modified: ${JSON.stringify(currentChain)}`);
      }

      return currentChain;
    }
  }
};

export const performReadOperation = async request => {
  let chain = await getCurrentChain();
  let response = {
    error: 'Unknown error occurred',
    status: 500
  };

  if (!chain) {
    chain = await adjustChain();
  }

  logger.info(`Making a read request to: ${chain.tail}`);

  try {
    response = await fetch(`http://${chain.tail}/read`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request.body)
    });

    response = {
      ...(await response.json()),
      status: response.status
    };

    logger.info('Read request response received. Forwarding to client.');
  } catch (err) {
    logger.warn(err);
    response = {
      error: 'Error fetching the response. Please try again.',
      status: 500
    };
  }

  return response;
};

export const performWriteOperation = async request => {
  let chain = await getCurrentChain();
  let response = {
    error: 'Unknown error occurred',
    status: 500
  };

  if (!chain) {
    chain = await adjustChain();
  }

  try {
    const value = JSON.stringify(request.body);
    const hash = `req-${generateHash(value)}`;

    logger.info(`Hash generated for write request: ${hash}`);

    logger.info(`Writing hash and request to consul: ${hash}`);

    await consul.kv.set(
      hash,
      JSON.stringify({
        request: request.body,
        status: 'pending'
      })
    );

    logger.info(`Making a write request to: ${chain.head}`);

    const delivery = await fetch(`http://${chain.head}/write`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...request.body,
        hash
      })
    });

    logger.info(
      `Delivered to HEAD and got response: ${JSON.stringify(
        await delivery.json()
      )}`
    );

    // TODO: keep checking consul for the response
    // TODO: have a timeout setting
  } catch (err) {
    logger.warn(err);
    response = {
      error: 'Error fetching the response. Please try again.',
      status: 500
    };
  }

  return response;
};
