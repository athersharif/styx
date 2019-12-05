import { checkUpdatingChainFlag, generateHash } from './utils';
import {
  deliverJSONRequest,
  getCurrentChain,
  getValueFromConsul
} from './shared/commonUtils';
import consul from './shared/consul';
import logger from './shared/logger';
import timedFunction from './shared/timer';

export default async request => {
  let chain = await getCurrentChain();
  let response = null;

  if (!chain) {
    chain = await adjustChain();
  }

  const value = JSON.stringify(request.body);
  const hash = `${generateHash(value)}`;

  // logger.info(`Hash generated for write request: ${hash}`);

  response = await timedFunction(checkUpdatingChainFlag);

  if (response.status !== 200) {
    return response;
  }

  response = await timedFunction(writeToConsul, { hash, request });

  if (response.status !== 200) {
    return response;
  }

  response = await timedFunction(deliverToHead, { hash, request });

  if (response.status !== 200) {
    return response;
  }

  return await timedFunction(fetchResults, { hash, request });
};

const writeToConsul = async ({ hash, request }) => {
  try {
    const chain = await getCurrentChain();

    //logger.info(`Writing hash and write request to consul: ${hash}`);

    await consul.kv.set(`req/nodes/${chain.head}/write/${hash}`, 'pending');

    await consul.kv.set(
      `req/all/write/${hash}`,
      JSON.stringify({
        request: request.body,
        status: 'pending'
      })
    );
  } catch (err) {
    logger.warn(err);
    return {
      error: 'Unknown error occurred',
      status: 500
    };
  }

  return { status: 200 };
};

const deliverToHead = async ({ hash, request }) => {
  try {
    const chain = await getCurrentChain();

    //logger.info(`Making a write request to: ${chain.head}`);

    deliverJSONRequest(
      `http://${chain.head}/write`,
      {
        ...request.body,
        hash
      },
      'HEAD'
    );

    return { status: 200 };
  } catch (err) {
    logger.error(err);
    return {
      error: 'Error delivering the response. Please try again.',
      status: 500
    };
  }
};

const fetchResults = async ({ hash, request }) => {
  let response = {
    error: 'Unknown error occurred',
    status: 500
  };

  try {
    //logger.info('Fetching results from consul.');

    request = await getValueFromConsul(`req/all/write/${hash}`);

    if (request && request.status === 'completed' && request.result) {
      //logger.info(`Request response received for: ${hash}`);

      response = {
        message: request.result,
        status: 200
      };
    } else {
      //logger.warn('Operation in progress.');
    }
  } catch (err) {
    logger.error(err);
    response = {
      error: 'Error fetching the response. Please try again.',
      status: 500
    };
  }

  return response;
};
