import express from 'express';
import bodyParser from 'body-parser';
import handleReadRequest from './read';
import handleWriteRequest from './write';
import { adjustChain } from './utils';

const app = express();
const port = 80;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/adjustchain', async (req, res) => {
  await adjustChain();

  return res.status(200);
});

app.post('/read', async (req, res) => {
  const response = await handleReadRequest(req);

  return res.status(response.status).send(response);
});

app.post('/write', async (req, res) => {
  const response = await handleWriteRequest(req);

  return res.status(response.status).send(response);
});

app.listen(port, async () => {
  //recheckChain();
  await adjustChain(false);

  console.log(`controller server listening on port ${port}!`);
});

// because consul keeps throwing this stupid context deadline error
const recheckChain = () => {
  setTimeout(async () => {
    await adjustChain(false);
    recheckChain();
  }, 2000);
};
