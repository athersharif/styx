import Bluebird from 'bluebird';
import consul from 'consul';

const DEFAULT_CONFIG = {
  host: 'styx-consul-control',
  promisify: fn => Bluebird.fromCallback(fn, { multiArgs: true })
};

export const customConsul = config =>
  consul({
    ...DEFAULT_CONFIG,
    ...config
  });

export default consul({ ...DEFAULT_CONFIG });
