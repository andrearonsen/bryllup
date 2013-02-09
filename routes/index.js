var mongo = require('mongodb');
var fn = require('underscore');
var fn_s = require('underscore.string');

var db_options = {w: 1, native_parser: true};
var mongolab_username = "nodejitsu_andrearonsen";
var mongolab_pw = "5kn803s0rp2nrpt3r4cplahs7u";
var mongolab_bryllupDbNavn = "nodejitsu_andrearonsen_nodejitsudb7379247420";

var local_server = new mongo.Server("127.0.0.1", 27017, {});
var local_bryllupDbNavn = "bryllup";
var local_db = new mongo.Db(local_bryllupDbNavn, local_server,  db_options);

function mongolab_db() {
  return new mongo.Db(mongolab_bryllupDbNavn, new mongo.Server("ds049537.mongolab.com", 49537), db_options);
}

function openDbWithAuth(callback) {
  var db = mongolab_db();
  db.open(function (error, p_client) {
    db.authenticate(mongolab_username, mongolab_pw, function(err, p_client) { 
      callback(error, db);
    }); 
  });
}

function doWithGjestelisteCollection(callback) {
  openDbWithAuth(function (err, db) {
    db.collection('gjesteliste', function(err, collection) {
      if (err) log.warn("Error ved opphenting av gjesteliste.");
      callback(err, collection);  
    });
  });
}

function hentInvitasjon(invitasjonskode, behandle_invitasjon) {
  doWithGjestelisteCollection(function (err, collection) {
    collection.findOne({'invitasjonskode': invitasjonskode}, behandle_invitasjon);  
  });
}

function eksistererInvitasjon(invitasjonskode, callback) {
  doWithGjestelisteCollection(function (err, gjesteliste) {
    gjesteliste.count({invitasjonskode: invitasjonskode}, {}, function (err, count) {
      return callback(err, (count === 1));
    });  
  });
}

function berikInvitasjon(invitasjon) {
  invitasjon.tiltale = function () {
    var fornavn = function (gjest) {return gjest.fornavn};
    var gjester = fn.compact([this.gjest1, this.gjest2, this.gjest3]).map(fornavn);
    console.log('Gjester: ' + gjester[0]);
    return fn_s.toSentence(gjester, ", ", " og ");
  };
}

exports.index = function(req, res) {
  res.sendfile('index.html');
};

exports.sjekkinvitasjonskode = function (req, res) {
  var invitasjonskode = req.params.invitasjonskode.toUpperCase();
  console.log("Sjekk invitasjonskode: " + invitasjonskode);
  eksistererInvitasjon(invitasjonskode, function(err, eksisterer) {
    if (err) {
      console.warn('Error ved uthenting av invitasjon: ' + err);
      res.status(500).send('Klarte ikke å hente ut invitasjonen dessverre, prøv igjen senere!');   
    } else if (!eksisterer) {
      console.warn('Invitasjonskode ' + invitasjonskode + ' ikke funnet.');
      res.status(404).send('Fant dessverre ikke invitasjonskoden [' + invitasjonskode + '] i systemet.' ); 
    } else {
      console.log("Invitasjonskode " + invitasjonskode + " funnet.");
      res.send(invitasjonskode);
    }
  });
};

exports.hovedside = function(req, res) {
  var invitasjonskode = req.params.invitasjonskode.toUpperCase();
  hentInvitasjon(invitasjonskode, function(err, item) {
    if (!item) {
      console.warn('Invitasjonskode ' + invitasjonskode + ' ikke funnet.');
      res.status(404).send('Fant dessverre ikke invitasjonskoden [' + invitasjonskode + '] i systemet.' );
    } else if (err) {
      console.warn('Error ved uthenting av invitasjon: ' + err);
      res.status(500).send('Klarte ikke å hente ut invitasjonen dessverre, prøv igjen senere!');  
    } else {
      console.log("Result: " + JSON.stringify(item));
      berikInvitasjon(item);
      res.render("hovedside", {title: "Bryllup 24. august 2013", invitasjon : item}); 
    }
  });
};