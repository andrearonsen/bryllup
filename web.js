var express = require('express');

var app = express.createServer(express.logger());

var mongo = require('mongodb');

var mongoUri = process.env.MONGOLAB_URI || "mongodb://heroku_app11537877:1juhi6cu74fau867pjtaab3vna@ds049467.mongolab.com:49467/heroku_app11537877"; 



app.get('/', function(request, response) {
  mongo.Db.connect(mongoUri, function (err, db) {
  db.collection('gjester', function(er, collection) {
    collection.get({'invitasjonsnummer': 'FAR123'}, {safe: true}, function(er, rs) {
      response.sendFile('public/index.html');
    });
  });
});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});