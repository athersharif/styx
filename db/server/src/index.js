import express from 'express';
import bodyParser from 'body-parser';
import sleep from 'sleep';
import { forwardToNextNodeOrDeliver } from './utils';
import { getValueFromConsul, splitString } from './shared/commonUtils';
import consul from './shared/consul';
import logger from './shared/logger';
import timedFunction from './shared/timer';

const app = express();
const port = 80;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/read', async (req, res) => {
  logger.info(`Read operation request received: ${JSON.stringify(req.body)}`);

  logger.info('Fetching request from consul.');

  let request = null;

  try {
    request = await getValueFromConsul(`req/all/write/${req.body.hash}`);
  } catch (err) {
    logger.error(err);
  }

  // TODO: check for other pending operations

  logger.info(`Processing read operation: ${JSON.stringify(request)}`);

  // TODO: perform the read operation

  await consul.kv.set(
    `req/nodes/${req.headers.host}/read/${req.body.hash}`,
    'completed'
  );

  logger.info('Processed read operation.');

  logger.info(`Updating the hash status on consul for: ${req.body.hash}`);

  await consul.kv.set(
    `req/all/read/${req.body.hash}`,
    JSON.stringify({
      request,
      status: 'completed',
      timestamp: Date.now(),
      // TODO: result from the write operation
      result: 'success'
    })
  );

  return res.status(200).send({
    message: 'read response received and processed'
  });
});

app.post('/write', async (req, res) => {
  logger.info(`Write operation request received: ${JSON.stringify(req.body)}`);

  logger.info('Fetching request from consul.');

  let request = null;

  try {
    request = await getValueFromConsul(`req/all/write/${req.body.hash}`);
  } catch (err) {
    logger.error(err);
  }

  // TODO: check for other pending operations

  logger.info('Checking for past pending operations');

  const pendingOperations = (
    (await consul.kv.get({
      key: `req/nodes/${req.headers.host}/write/`,
      recurse: true
    }))[0] || []
  )
    .filter(o => o.Value === 'pending' && !o.Key.includes(req.body.hash))
    .map(o => splitString(o.Key))
    .sort();

  logger.info(`Found ${pendingOperations.length} pending operations`);

  pendingOperations.forEach(async o => {
    logger.info(`Processing past write operation: ${o}`);

    // TODO: perform the write operations

    await consul.kv.set(
      `req/nodes/${req.headers.host}/write/${o}`,
      'completed'
    );
  });

  logger.info(`Processing write operation: ${JSON.stringify(request)}`);

  // TODO: perform the write operation

  await consul.kv.set(
    `req/nodes/${req.headers.host}/write/${req.body.hash}`,
    'completed'
  );

  logger.info('Processed write operation. Fetching chain.');

  await timedFunction(forwardToNextNodeOrDeliver, { req, request });

  return res.status(200).send({
    message: 'write response received and processed'
  });
});

app.listen(port, async () => {
  console.log(`DB server listening on port ${port}!`);
});
