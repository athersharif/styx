import { checkUpdatingChainFlag, generateHash } from './utils';
import { deliverJSONRequest, getCurrentChain } from './shared/commonUtils';
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

  logger.info(`Hash generated for write request: ${hash}`);

  response = await timedFunction(checkUpdatingChainFlag);

  if (response.status !== 200) {
    return response;
  }

  return await timedFunction(fetchResults, { hash, request });
};

const fetchResults = async ({ hash, request }) => {
  const chain = await getCurrentChain();

  let response = {
    error: 'Unknown error occurred',
    status: 500
  };

  try {
    logger.info(`Writing hash and read request to consul: ${hash}`);

    await consul.kv.set(`req/nodes/${chain.tail}/read/${hash}`, 'pending');

    await consul.kv.set(
      `req/all/read/${hash}`,
      JSON.stringify({
        request: request.body,
        status: 'pending'
      })
    );

    logger.info(`Making a read request to: ${chain.tail}`);

    return await deliverJSONRequest(
      `http://${chain.tail}/read`,
      {
        ...request.body,
        hash
      },
      'TAIL'
    );
  } catch (err) {
    logger.warn(err);
    response = {
      error: 'Error fetching the response. Please try again.',
      status: 500
    };
  }

  return response;
};
