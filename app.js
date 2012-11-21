
/**
 * Module dependencies.
 */
var kue = require('kue')
  , redis = require('redis')
  , feedparser = require('feedparser');

kue.redis.createClient = function() {
  var client = redis.createClient(6379, '127.0.0.1');//change this to production data
  return client;
};

var jobs = kue.createQueue();
var minute = 10000;

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(kue.app);
});


app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

app.post('/', routes.feed);

jobs.promote();

jobs.process('feed', function(job, done){
  try {//this could fly if i validate the url via middleware/client
    parser = feedparser.parseUrl(job.data.url, {addmeta:false}, function(error, feed){
      if(error){
        done(error);
      }
      console.log(feed.date);
      jobs.create('feed', job.data).delay(minute).save();
      done();
    });
  }catch(err){
    done(err);
  }
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
