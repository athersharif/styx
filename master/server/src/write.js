import fetch from 'node-fetch';
import { generateHash, TIMEOUT } from './utils';
import { getCurrentChain } from './shared/commonUtils';
import consul from './shared/consul';
import logger from './shared/logger';

export default async (request, time) => {
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
    const hash = `${generateHash(value, time)}`;

    logger.info(`Hash generated for write request: ${hash}`);

    logger.info(`Writing hash and write request to consul: ${hash}`);

    await consul.kv.set(`req/nodes/${chain.head}/write/${hash}`, 'pending');

    await consul.kv.set(
      `req/all/write/${hash}`,
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

    logger.info('Fetching results from consul.');

    const hashValue = (await consul.kv.get(`req/all/write/${hash}`))[0];
    request = hashValue ? JSON.parse(hashValue.Value) : null;

    if (request && request.status === 'completed' && request.result) {
      logger.info(`Request response received for: ${hash}`);

      response = {
        message: request.result,
        status: 200
      };
    } else {
      throw new Error('Operation in progress.');
    }
  } catch (err) {
    logger.warn(err);
    response = {
      error: 'Error fetching the response. Please try again.',
      status: 500
    };
  }

  return response;
};
