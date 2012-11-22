
/**
 * Module dependencies.
 */
var kue = require('kue')
  , redis = require('redis')
  , feedparser = require('feedparser');

kue.redis.createClient = function() {
  var client = redis.createClient(6379, '127.0.0.1'); //TODO change for production
  return client;
};

var client = kue.redis.createClient();

var jobs = kue.createQueue();
var minute = 10000;

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

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

var update_feed = function(articles, last_updated){
  var last_updated = new Date(Date.parse(last_updated));
  for(i=articles.length-1;i>=0;i--){
    var article_date = new Date(Date.parse(articles[i].pubDate));
    if(article_date > last_updated){
      console.log('New Article');
      console.log(articles[i]);
    }
  }

  // if(error){done(error);}

  // console.log(article.pubDate);

  // client.lrange(job.data.url+'_subscribers', 0, -1, function(error, data){

  //   if(error){done(error);}
  //   //
  //   done();
  // });
};


jobs.promote();

jobs.process('feed', function(job, done){
  try {//this could fly if i validate the url via middleware/client
    feedparser.parseUrl(job.data.url, function(error, meta, articles){

      client.get(job.data.url, function(error, last_updated){
        if(error){done(error);}

        if(!last_updated){ //Set the latest
          client.set(job.data.url, articles[0].pubDate, function(error, data){
            if(error){done(error);}
            jobs.create('feed', job.data).delay(minute).save();
            done();
          });
        }else{
          update_feed(articles, last_updated);
          jobs.create('feed', job.data).delay(minute).save();
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
