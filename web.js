var express = require('express');

var app = express();

app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});

app.set('view engine', 'kiwi');

var mongo = require('mongodb');

var mongoUri = process.env.MONGOLAB_URI || "mongodb://heroku_app11537877:1juhi6cu74fau867pjtaab3vna@ds049467.mongolab.com:49467/heroku_app11537877"; 

app.get('/', function(request, response) {
  response.render("index", {gjester : "hei sveis"});
  // mongo.Db.connect(mongoUri, function (err, db) {
  // db.collection('gjester', function(er, collection) {
  //   collection.get({'invitasjonsnummer': 'FAR123'}, {safe: true}, function(er, rs) {
  //     response.render("index.kiwi", {gjester : rs});
  //   });
  // });
// });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});