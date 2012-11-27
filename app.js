/**
 * Module dependencies.
 */
var kue = require('kue');
var redis = require('redis');
var feedparser = require('feedparser');

var config = require('./config');

kue.redis.createClient = function() {
  var client = redis.createClient(config.db.port, config.db.host);
  if(config.db.auth){
    client.auth(config.db.auth);
  }
  return client;
};

var client = redis.createClient(config.db.port, config.db.host);
if(config.db.auth){
  client.auth(config.db.auth);
}

var jobs = kue.createQueue();
var minute = 5000;

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var request = require('request');

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

var broadcast_feed = function(articles, last_updated, subscribers){

  var updated = new Date(Date.parse(last_updated));

  for(i=articles.length-1;i>=0;i--){
    var article_date = new Date(Date.parse(articles[i].pubDate));
    if(article_date > updated){
      subscribers.map(function(subscriber){
        request.defaults({body:articles[i]}).post(subscriber, {json:true});
      });
    }
  }
};


jobs.promote();

jobs.process('feed', function(job, done){
  try {//this could fly if i validate the url via middleware/client
    feedparser.parseUrl(job.data.url, function(error, meta, articles){

      if(error){done(error);}

      client.get(job.data.url, function(error, last_updated){
        if(error){done(error);}
        console.log(articles[0].pubDate);

        if(!last_updated){ //Set the latest
          client.set(job.data.url, articles[0].pubDate, function(error, data){
            if(error){done(error);}
            jobs.create('feed', job.data).delay(minute).save();
            done();
          });
        }else{
          client.lrange(job.data.url+'_subscribers', 0, 1, function(error, subscribers){
            if(subscribers){
              broadcast_feed(articles, last_updated, subscribers);
            }else{done(error);}
          });
          jobs.create('feed', job.data).delay(minute).save();
          client.set(job.data.url, articles[0].pubDate);
          done();
        }

      });
    });
  }catch(err){
    done(err);
  }
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
