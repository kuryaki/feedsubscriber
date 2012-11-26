var kue = require('kue');
var config = require('../config');
var request = require('request');

var redis = require('redis');
var client = redis.createClient(config.db.port, config.db.host);
if(config.db.auth){
  client.auth(config.db.auth);
}

var minute = 60000;
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', {
    title: 'Subscribe to a feed',
    subtitle: 'The alternative to pubsubhubsub'
  });
};

exports.feed = function(req, response){
  var feed = req.body.feed;
  var subscriber = req.body.callback;

  var data = {
       type: 'feed',
       data: {
         title: ' subscription to ' + feed,
         url: feed
       }
     };

  client.lrange(feed + '_subscribers', 0, -1, function(err, data){
    var notInData = true;

    for(i in data){
      if(data[i] === subscriber){
        notInData = false;
      }
    }

    if(notInData){
      client.lpush(feed+ '_subscribers', subscriber);
    }

  });


  request
    .defaults({body:data})
    .post('http://localhost:3000/job', {json:true}, function(err, res, body){ //TODO change for production
      response.render('index', {
        title: 'Subscribe to a feed',
        subtitle: 'The alternative to pubsubhubsub',
        notice: req.body.callback + ' subscribed to ' + req.body.feed  + ' -> ' + res.body.message
      });
    });

};