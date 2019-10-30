import express from 'express';
import bodyParser from 'body-parser';
import log4js from 'log4js';

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

  return res.json({
    message: 'read response received'
  });
});

app.post('/write', async (req, res) => {
  console.log('write operation');

  return res.status(200);
});

app.listen(port, async () => {
  console.log(`DB server listening on port ${port}!`);
});
