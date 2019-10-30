import Bluebird from 'bluebird';

export default require('consul')({
  host: 'styx-consul-control',
  promisify: fn => Bluebird.fromCallback(fn, { multiArgs: true })
});
