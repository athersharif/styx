import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = 80;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/read', async (req, res) => {
  const response = {};

  return res.status(200).send(response);
});

app.post('/write', async (req, res) => {
  const response = {};

  return res.status(200).send(response);
});

app.listen(port, () => {
  console.log(`Benchmark server listening on port ${port}!`);
});
