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
