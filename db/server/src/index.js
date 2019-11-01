import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import sleep from 'sleep';
import { getNextInChain } from './utils';
import consul from './shared/consul';
import logger from './shared/logger';

const app = express();
const port = 80;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/read', async (req, res) => {
  logger.info(`Read operation request received: ${JSON.stringify(req.body)}`);

  logger.info('Fetching request from consul.');

  let request = null;

  try {
    const hashValue = (await consul.kv.get(req.body.hash))[0];
    request = hashValue ? JSON.parse(hashValue.Value).request : null;
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
    const hashValue = (await consul.kv.get(req.body.hash))[0];
    request = hashValue ? JSON.parse(hashValue.Value).request : null;
  } catch (err) {
    logger.error(err);
  }

  // TODO: check for other pending operations

  logger.info(`Processing write operation: ${JSON.stringify(request)}`);

  // TODO: perform the write operation

  await consul.kv.set(
    `req/nodes/${req.headers.host}/write/${req.body.hash}`,
    'completed'
  );

  logger.info('Processed write operation. Fetching chain.');

  const node = await getNextInChain(req.headers.host);

  if (node) {
    logger.info(`Found next node in chain: ${node}`);

    logger.info('Writing to consul');

    await consul.kv.set(`req/nodes/${node}/write/${req.body.hash}`, 'pending');

    const delivery = await fetch(`http://${node}/write`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    logger.info(
      `Delivered to ${node} and got response: ${JSON.stringify(
        await delivery.json()
      )}`
    );
  } else {
    logger.info('No next node, this is the tail');

    logger.info(`Updating the hash status on consul for: ${req.body.hash}`);

    await consul.kv.set(
      `req/all/write/${req.body.hash}`,
      JSON.stringify({
        request,
        status: 'completed',
        timestamp: Date.now(),
        // TODO: result from the write operation
        result: 'success'
      })
    );
  }

  return res.status(200).send({
    message: 'write response received and processed'
  });
});

app.listen(port, async () => {
  console.log(`DB server listening on port ${port}!`);
});
