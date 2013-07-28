var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 5000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  // app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.cookieSession({ secret: 'Bryllupshemmelighet!', cookie: { maxAge: 60 * 60 * 1000 }}));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/hovedside/:invitasjonskode', routes.hovedside);
app.get('/hauptseite/:invitasjonskode', routes.hauptseite);
app.get('/sjekkinvitasjonskode/:invitasjonskode', routes.sjekkinvitasjonskode);
app.get('/gjestersomkommer', routes.gjestersomkommer);
app.get('/personersomkommer', routes.personersomkommer);
app.get('/gjesteliste', routes.gjesteliste);
app.get('/bildekarusell/:devicewidth', routes.bildekarusell);
app.post('/oppdaterkommer', routes.oppdaterkommer);
app.post('/oppdaterkommentar', routes.oppdaterkommentar);

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});