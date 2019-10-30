import express from 'express';
import bodyParser from 'body-parser';
import {
  adjustChain,
  performReadOperation,
  performWriteOperation
} from './utils';

const app = express();
const port = 80;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/adjustchain', async (req, res) => {
  await adjustChain();

  return res.status(200);
});

app.post('/read', async (req, res) => {
  console.log('read operation');

  const response = await performReadOperation(req);

  return res.status(response.status).send(response);
});

app.post('/write', async (req, res) => {
  console.log('write operation');

  const response = await performWriteOperation(req);

  return res.status(response.status).send(response);
});

app.listen(port, () => {
  recheckChain();

  console.log(`Master server listening on port ${port}!`);
});

// because consul keeps throwing this stupid context deadline error
const recheckChain = () => {
  setTimeout(async () => {
    await adjustChain(false);
    recheckChain();
  }, 2000);
};
