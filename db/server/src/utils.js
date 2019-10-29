import { Pool } from 'pg';
import max from 'lodash/max';
import orderBy from 'lodash/orderBy';
import isArray from 'lodash/isArray';
import {
  deliverJSONRequest,
  getCurrentChain,
  getValueFromConsul,
  splitString
} from './shared/commonUtils';
import consul from './shared/consul';
import logger from './shared/logger';

const getNextInChain = async host => {
  const chain = await getCurrentChain();
  const chainKeys = Object.keys(chain);

  if (chainKeys.length === 2 && chain[chainKeys[0]] === chain[chainKeys[1]]) {
    return null;
  }

  const position = chainKeys.find(k => chain[k] === host);

  if (position === 'tail') {
    return null;
  }

  const highestBeforeTail = max(
    chainKeys.filter(k => k !== 'head' && k !== 'tail').map(k => parseInt(k))
  );

  let nextPosition = null;

  if (position === 'head') {
    nextPosition = chain['2'] || chain['tail'];
  } else if (position === highestBeforeTail.toString()) {
    nextPosition = chain['tail'];
  } else if (position !== 'tail') {
    nextPosition = chain[(parseInt(position) + 1).toString()];
  }

  return nextPosition;
};

export const forwardToNextNodeOrDeliver = async ({ req, request, result }) => {
  try {
    const node = await getNextInChain(req.headers.host);

    if (node) {
      //logger.info(`Found next node in chain: ${node}`);

      //logger.info('Writing to consul');

      await consul.kv.set(
        `req/nodes/${node}/pending/${req.body.hash}`,
        'pending'
      );

      deliverJSONRequest(`http://${node}/write`, req.body, node);
    } else {
      // logger.info('No next node, this is the tail');

      //logger.info(`Updating the hash status on consul for: ${req.body.hash}`);

      await consul.kv.set(
        `req/all/write/${req.body.hash}`,
        JSON.stringify({
          request,
          status: 'completed',
          timestamp: Date.now(),
          result: result.response
        })
      );
    }

    return { status: 200 };
  } catch (err) {
    logger.warn(err);
    return { status: 408 };
  }
};

export const areOtherOperationsInProgress = async ({ hash, host }) => {
  const operations = orderBy(
    (
      (await getValueFromConsul(
        `req/nodes/${host}/pending/`,
        { recurse: true },
        true
      )) || []
    )
      .filter(o => o.Value === 'pending')
      .map(o => {
        const hash = splitString(o.Key);

        return { hash, timestamp: parseFloat(splitString(hash, '.')) };
      }),
    ['timestamp']
  );

  return {
    status: operations.length === 0 || operations[0].hash === hash ? 200 : 400
  };
};

export const makePgCall = async queries => {
  let response = null;
  let result = { response, status: 503 };

  try {
    //logger.info('initializing pg pool');

    const pgPool = new Pool();
    const client = await pgPool.connect();

    try {
      response = [];

      await client.query('BEGIN');

      try {
        queries = JSON.parse(queries);
      } catch (err) {}

      queries = !isArray(queries) ? [queries] : queries;

      await queries.reduce(async (previousPromise, query) => {
        await previousPromise;

        //logger.info(`calling query: ${query}`);

        response = [...response, await client.query(query)];
      }, Promise.resolve());

      await client.query('COMMIT');

      result = { response, status: 200 };
    } catch (err) {
      await client.query('ROLLBACK');

      logger.error(err);

      result = {
        response: err.message,
        status: 400
      };
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error(err);

    result = {
      response: err.message,
      status: 400
    };
  }

  if (response === null) {
    result.response = 'unknown error happened';
  }

  return result;
};

export const performQueuedOperations = async req => {
  //logger.info('Checking for past queued operations');

  const queuedOperations = orderBy(
    (
      (await getValueFromConsul(
        `req/nodes/${req.headers.host}/queued/`,
        { recurse: true },
        true
      )) || []
    )
      .filter(o => o.Value === 'queued' && !o.Key.includes(req.body.hash))
      .map(o => {
        const hash = splitString(o.Key);

        return { hash, timestamp: parseFloat(splitString(hash, '.')) };
      }),
    ['timestamp']
  );

  //logger.info(`Found ${queuedOperations.length} queued operations`);

  await queuedOperations.reduce(async (previousPromise, { hash }) => {
    await previousPromise;

    let value = await getValueFromConsul(`req/all/write/${hash}`);

    if (value) {
      // logger.info(
      //   `Processing past write operation: ${hash}: ${JSON.stringify(
      //     value.request
      //   )}`
      // );

      const query = value.request.request
        ? value.request.request.query
        : value.request.query;

      await makePgCall(query);

      await consul.kv.set(
        `req/nodes/${req.headers.host}/write/${hash}`,
        'completed'
      );

      await consul.kv.del(`req/nodes/${req.headers.host}/queued/${hash}`);
    }
  }, Promise.resolve());
};
