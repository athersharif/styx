import http from 'k6/http';
import { check, sleep } from 'k6';
import config from './config.js';

const { data, params, url } = config.styx.read;

export const options = config.options;

export default function() {
  const res = http.post(url, data, params);
  check(res, {
    'status was 200': r => r.status == 200
  });
  sleep(1);
}
