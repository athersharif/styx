import crypto from 'crypto';
import createChain from './create';
import { getValueFromConsul } from './shared/commonUtils';
import consul from './shared/consul';
import logger from './shared/logger';

export const generateHash = (value, time = Date.now()) =>
  `${crypto
    .createHash('md5')
    .update(value)
    .digest('hex')}.${time}`;

export const adjustChain = async (fromWatcher = true) => {
  let updatingChainFlag = true;
  let chain = null;

  try {
    const nodes = await getDBNodes();
    chain = await createChain(nodes, fromWatcher);

    await consul.kv.set('chain', JSON.stringify(chain));

    updatingChainFlag = await getValueFromConsul('updatingChain');
  } catch (err) {
    logger.warn(err);
  }

  if (updatingChainFlag) {
    await consul.kv.set('updatingChain', 'false');

    logger.info('Queuing incoming requests turned off.');
  }

  return chain;
};

export const getDBNodes = async () => {
  let nodes = [];

  try {
    const serverNodes = (await consul.health.service('db-server'))[0]
      .filter(n => n.Checks.every(c => c.Status === 'passing'))
      .map(n => ({
        ...n,
        address: n.Service.ID.replace('server', 'styx')
      }));

    const serviceNodes = (await consul.health.service('db-service'))[0]
      .filter(n => n.Checks.every(c => c.Status === 'passing'))
      .map(n => ({
        ...n,
        address: n.Service.ID.replace('service', 'styx')
      }));

    nodes = serverNodes.filter(n =>
      serviceNodes.some(a => a.address === n.address)
    );
  } catch (err) {
    logger.error(err.cause);
  }

  return nodes;
};

export const checkUpdatingChainFlag = async () => {
  const flag = await getValueFromConsul('updatingChain');

  return flag
    ? {
        status: 503,
        message: 'Operation in progress'
      }
    : {
        status: 200,
        message: 'No chain update in progress'
      };
};
