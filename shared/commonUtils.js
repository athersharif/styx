import fetch from 'node-fetch';
import consul from './consul';
import logger from './logger';

export const getCurrentChain = async () => {
  let chain = null;

  try {
    chain = (await consul.kv.get('chain'))[0];
    chain = chain ? JSON.parse(chain.Value) : null;
  } catch (err) {
    logger.error(err);
  }

  return chain;
};

export const splitString = (value, character = '/', positionFromEnd = 0) => {
  const splitValue = value.split(character);

  return splitValue[splitValue.length - 1 - positionFromEnd];
};

export const getValueFromConsul = async key => {
  const value = (await consul.kv.get(key))[0];

  return value ? JSON.parse(value.Value) : null;
};

export const deliverJSONRequest = async (url, body, to) => {
  const delivery = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (delivery.status === 200) {
    logger.info(
      `Delivered to ${to} and got response: ${JSON.stringify(
        await delivery.json()
      )}`
    );
  } else {
    logger.warn(`Delivery to ${url} failed`);
    throw new Error(`Could not make a call to ${url}. Please check the url.`);
  }

  return delivery;
};
