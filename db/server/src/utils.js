import max from 'lodash/max';
import { getCurrentChain } from './shared/commonUtils';

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
