export default {
  benchmark: {
    read: {
      url: 'http://localhost:4001/read',
      data: JSON.stringify({
        query: 'SELECT * FROM styx_test_table;',
        direct: true
      }),
      params: {
        headers: { 'Content-Type': 'application/json' }
      }
    },
    write: {
      url: 'http://localhost:4001/write',
      data: JSON.stringify({
        query: 'INSERT INTO styx_test_table(some_num) VALUES(1);',
        direct: true
      }),
      params: {
        headers: { 'Content-Type': 'application/json' }
      }
    }
  },
  styx: {
    read: {
      url: 'http://localhost:4002/read',
      data: JSON.stringify({
        query: 'SELECT * FROM styx_test_table;'
      }),
      params: {
        headers: { 'Content-Type': 'application/json' }
      }
    },
    write: {
      url: 'http://localhost:4002/write',
      data: JSON.stringify({
        query: 'INSERT INTO styx_test_table(some_num) VALUES(1);'
      }),
      params: {
        headers: { 'Content-Type': 'application/json' }
      }
    }
  },
  options: {
    vus: 10,
    iterations: 1000
  }
};
