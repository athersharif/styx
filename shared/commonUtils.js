import fetch from 'node-fetch';
import consul from './consul';
import logger from './logger';

export const getCurrentChain = async () => {
  let chain = null;

  try {
    chain = await getValueFromConsul('chain');
  } catch (err) {
    logger.error(err);
  }

  return chain;
};

export const splitString = (value, character = '/', positionFromEnd = 0) => {
  const splitValue = value.split(character);

  return splitValue[splitValue.length - 1 - positionFromEnd];
};

export const getValueFromConsul = async (key, options = {}, raw = false) => {
  const value = (await consul.kv.get({ key, ...options }))[0];

  if (value) {
    return raw ? value : JSON.parse(value.Value);
  } else {
    return null;
  }
};

export const deliverJSONRequest = async (url, body, to) => {
  let response = { status: 500 };

  const delivery = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (delivery.status === 200) {
    const deliveryJson = await delivery.json();
    response.status = delivery.status;

    response = {
      ...deliveryJson,
      responseStatus: deliveryJson.status,
      status: response.status
    };

    // logger.info(
    //   `Delivered to ${to} and got response: ${JSON.stringify(response)}`
    // );
  } else {
    logger.error(`Delivery to ${url} failed`);
    throw new Error(`Could not make a call to ${url}. Please check the url.`);
  }

  return response;
};
