import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 80;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.post('/read', async (req, res) => {
  const response = await fetch('http://styx-controller/read', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });

  return res.status(response.status).send(await response.json());
});

app.post('/write', async (req, res) => {
  const response = await fetch('http://styx-controller/write', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });

  return res.status(response.status).send(await response.json());
});

app.listen(port, () => {
  console.log(`Styx example server listening on port ${port}!`);
});
