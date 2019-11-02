import max from 'lodash/max';
import { deliverJSONRequest, getCurrentChain } from './shared/commonUtils';
import consul from './shared/consul';
import logger from './shared/logger';

const getNextInChain = async host => {
  const chain = await getCurrentChain();
  const chainKeys = Object.keys(chain);
  const position = chainKeys.find(k => chain[k] === host);
  const highestBeforeTail = max(
    chainKeys.filter(k => k !== 'head' && k !== 'tail').map(k => parseInt(k))
  );

  if (position === 'tail') {
    return null;
  }

  let nextPosition = null;

  if (position === 'head') {
    nextPosition = chain['2'];
  } else if (position === highestBeforeTail.toString()) {
    nextPosition = chain['tail'];
  } else if (position !== 'tail') {
    nextPosition = chain[(parseInt(position) + 1).toString()];
  }

  return nextPosition;
};

export const forwardToNextNodeOrDeliver = async ({ req, request }) => {
  try {
    const node = await getNextInChain(req.headers.host);

    if (node) {
      logger.info(`Found next node in chain: ${node}`);

      logger.info('Writing to consul');

      await consul.kv.set(
        `req/nodes/${node}/write/${req.body.hash}`,
        'pending'
      );

      return await deliverJSONRequest(`http://${node}/write`, req.body, node);
    } else {
      logger.info('No next node, this is the tail');

      logger.info(`Updating the hash status on consul for: ${req.body.hash}`);

      await consul.kv.set(
        `req/all/write/${req.body.hash}`,
        JSON.stringify({
          request,
          status: 'completed',
          timestamp: Date.now(),
          // TODO: result from the write operation
          result: 'success'
        })
      );

      return { status: 200 };
    }
  } catch (err) {
    logger.warn(err);
    return { status: 408 };
  }
};
