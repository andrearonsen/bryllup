var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 5000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
  
// app.get('/', routes.index);
// app.get('/users', user.list);

// var mongo = require('mongodb');

// var mongoUri = process.env.MONGOLAB_URI || "mongodb://heroku_app11537877:1juhi6cu74fau867pjtaab3vna@ds049467.mongolab.com:49467/heroku_app11537877"; 

// app.get('/', function(req, res) {
//   res.render("test", {title : "Test title", name:"Andre"});
//   // mongo.Db.connect(mongoUri, function (err, db) {
//   // db.collection('gjester', function(er, collection) {
//   //   collection.get({'invitasjonsnummer': 'FAR123'}, {safe: true}, function(er, rs) {
//   //     response.render("index.kiwi", {gjester : rs});
//   //   });
//   // });
// // });
// });

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});