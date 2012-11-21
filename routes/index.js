var kue = require('kue');
var request = require('request');
var minute = 10000;
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
  var data = {
       type: 'feed',
       data: {
         title: ' subscription to ' + req.body.feed,
         url: req.body.feed
       },
       options: {
          _delay: minute
       }
     };

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