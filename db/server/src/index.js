import express from 'express';
import bodyParser from 'body-parser';
import log4js from 'log4js';
import fetch from 'node-fetch';
import consul from './consul';
import { getNextInChain } from './utils';

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } }
});

const app = express();
const port = 80;
const logger = log4js.getLogger();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/read', async (req, res) => {
  logger.info('Read operation request received.');

  return res.status(200).send({
    message: 'read response received'
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

  logger.info(`Processing write operation: ${JSON.stringify(request)}`);

  // TODO: perform the write operation

  logger.info('Processed write operation. Fetching chain.');

  const node = await getNextInChain(req.headers.host);

  if (node) {
    logger.info(`Found next node in chain: ${node}`);

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
      req.body.hash,
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
