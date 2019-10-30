import consul from './consul';
import log4js from 'log4js';
import max from 'lodash/max';

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } }
});

const logger = log4js.getLogger();

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

export const getNextInChain = async host => {
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
