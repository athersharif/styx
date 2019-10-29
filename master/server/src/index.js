import express from 'express';
import bodyParser from 'body-parser';
import { adjustChain, performReadOperation } from './utils';

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

  await performReadOperation();

  return res.status(200).send('some response');
});

app.post('/write', async (req, res) => {
  console.log('write operation');

  return res.status(200);
});

app.listen(port, async () => {
  await adjustChain();

  console.log(`Master server listening on port ${port}!`);
});
