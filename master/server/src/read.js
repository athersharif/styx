import fetch from 'node-fetch';
import { generateHash } from './utils';
import { getCurrentChain } from './shared/commonUtils';
import consul from './shared/consul';
import logger from './shared/logger';

export default async request => {
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
    const hash = `${generateHash(value)}`;

    logger.info(`Hash generated for write request: ${hash}`);

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

    let delivery = await fetch(`http://${chain.tail}/read`, {
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

    delivery = await delivery.json();

    logger.info(
      `Delivered to TAIL and got response: ${JSON.stringify(delivery)}`
    );

    response = {
      ...delivery,
      status: response.status
    };
  } catch (err) {
    logger.warn(err);
    response = {
      error: 'Error fetching the response. Please try again.',
      status: 500
    };
  }

  return response;
};
