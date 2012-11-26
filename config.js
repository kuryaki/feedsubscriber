var config = {
  development: {
    db: {
      host: '127.0.0.1',
      port: 6379
    },
    protocol: 'http',
    host: 'localhost',
    port: 3000
  },

  production: {
    db: {
      host: 'nodejitsudb4906573230.redis.irstack.com',
      port: 6379,
      auth: 'nodejitsudb4906573230.redis.irstack.com:f327cfe980c971946e80b8e975fbebb4'
    },
    protocol: 'http',
    host: 'feedscriber.jit.su',
    port: 80
  }
};

var env = process.env.NODE_ENV || 'development';
config[env].appurl = config[env].protocol+'://'+config[env].host+':'+config[env].port;

module.exports = config[env];
