import express from 'express';
import bodyParser from 'body-parser';
import {
  forwardToNextNodeOrDeliver,
  makePgCall,
  performPendingOperations
} from './utils';
import { getValueFromConsul } from './shared/commonUtils';
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
  let result = null;

  const directQuery = req.body.direct || false;

  if (directQuery) {
    logger.info('Direct query. Skipping Styx things ...');

    result = await makePgCall(req.body.query);
  } else {
    try {
      request = await getValueFromConsul(`req/all/read/${req.body.hash}`);
    } catch (err) {
      logger.error(err);
    }

    await performPendingOperations(req);

    logger.info(`Processing read operation: ${JSON.stringify(request)}`);

    result = await makePgCall(request.request.query);

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
        result: result.response
      })
    );
  }

  return res.status(200).send(result);
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

  await performPendingOperations(req);

  logger.info(`Processing write operation: ${JSON.stringify(request)}`);

  const result = await makePgCall(request.request.query);

  await consul.kv.set(
    `req/nodes/${req.headers.host}/write/${req.body.hash}`,
    'completed'
  );

  logger.info('Processed write operation. Fetching chain.');

  await timedFunction(forwardToNextNodeOrDeliver, { req, request, result });

  return res.status(200).send(result);
});

app.listen(port, async () => {
  console.log(`DB server listening on port ${port}!`);
});
