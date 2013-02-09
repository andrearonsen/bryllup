var mongo = require('mongodb');
var fn = require('underscore');
var fn_s = require('underscore.string');

var bryllupDbUri_local = "mongodb://localhost:27017/bryllup";
var bryllupDbUri = "mongodb://nodejitsu_andrearonsen:5kn803s0rp2nrpt3r4cplahs7u@ds049537.mongolab.com:49537/nodejitsu_andrearonsen_nodejitsudb7379247420";

function hentInvitasjon(invitasjonskode, behandle_invitasjon) {
  mongo.Db.connect(bryllupDbUri, function (err, db) {
    db.collection('gjesteliste', function(er, collection) {
      if (er) log.warn("Error ved opphenting av gjesteliste.");
      collection.findOne({'invitasjonskode': invitasjonskode}, behandle_invitasjon);  
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
  hentInvitasjon(invitasjonskode, function(err, item) {
    if (!item) {
      console.warn('Invitasjonskode ' + invitasjonskode + ' ikke funnet.');
      res.status(404).send('Fant dessverre ikke invitasjonskoden [' + invitasjonskode + '] i systemet.' );
    } else if (err) {
      console.warn('Error ved uthenting av invitasjon: ' + err);
      res.status(500).send('Klarte ikke å hente ut invitasjonen dessverre, prøv igjen senere!');  
    } else {
      console.log("Result: " + JSON.stringify(item));
      res.send(item);
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