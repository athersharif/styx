//import { sleep } from 'sleep';
import crypto from 'crypto';
import createChain from './create';
import consul from './shared/consul';
import logger from './shared/logger';

export const TIMEOUT = 5000;

export const generateHash = value =>
  `${crypto
    .createHash('md5')
    .update(value)
    .digest('hex')}.${Date.now()}`;

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
