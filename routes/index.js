var kue = require('kue');
var config = require('../config');
var request = require('request');

var redis = require('redis');
var client = redis.createClient(config.db.port, config.db.host);
if(config.db.auth){
  client.auth(config.db.auth);
}

/*
 * GET home page.
 */

exports.index = function(req, res){
  console.log(req.headers.host);
  res.render('index', {
    title: 'Subscribe to a feed',
    subtitle: 'The alternative to pubsubhubsub'
  });
};

exports.feed = function(req, response){
  var feed = req.body.feed;
  var subscriber = req.body.callback;

  var job = {
       type: 'feed',
       data: {
         title: ' subscription to ' + feed,
         url: feed
       }
     };

  client.lrange(feed + '_subscribers', 0, -1, function(error, data){
    var notInData = true;

    if(error){
      response.send(error);
    }else{

      for(var i in data){
        if(data[i] === subscriber){
          notInData = false;
          break;
        }
      }

      if(notInData && subscriber){
        client.lpush(feed+'_subscribers', subscriber);
      }

      request
        .defaults({body:job})
        .post(config.appurl+'/job', {json:true}, function(err, res, body){
          response.render('index', {
            title: 'Subscribe to a feed',
            subtitle: 'The alternative to pubsubhubsub',
            notice: req.body.callback + ' subscribed to ' + req.body.feed  + ' -> ' + res.body.message
          });
        });

    }

  });



};