import isNil from 'lodash/isNil';
import logger from './logger';

const TIMEOUT = 60000;
const INTERVAL = 3000;

export default async (fn, args, timeout = TIMEOUT) => {
  let response = {
    error: 'Request timed out. Please try again later.',
    status: 408
  };
  const startTime = Date.now();

  const timedFunction = async () => {
    if (Date.now() - startTime >= timeout) {
      logger.warn('Timeout reached');
    } else {
      try {
        response = await fn(args, startTime);

        if (isNil(response) || response.status !== 200) {
          await timedFunction();
        } else if (response.responseStatus) {
          response.status = response.responseStatus;
          delete response.responseStatus;
        }
      } catch (err) {
        logger.error(err);
        await timedFunction();
      }
    }
  };

  await timedFunction();

  return response;
};

export const sleep = (ms = INTERVAL) =>
  new Promise(resolve => setTimeout(resolve, ms));
