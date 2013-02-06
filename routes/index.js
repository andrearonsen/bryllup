var mongo = require('mongodb');

var bryllupDbUri = process.env.MONGOLAB_URI || "mongodb://localhost:27017/bryllup";

function hentInvitasjon(invitasjonskode, behandle_invitasjon) {
  mongo.Db.connect(bryllupDbUri, function (err, db) {
    db.collection('gjesteliste', function(er, collection) {
      if (er) log.warn("Error ved opphenting av gjesteliste.");
      collection.findOne({'invitasjonskode': invitasjonskode}, behandle_invitasjon);  
    });
  });
}

exports.index = function(req, res) {
  res.render('index', {});
};

exports.sjekkinvitasjonskode = function (req, res) {
  var invitasjonskode = req.params.invitasjonskode;
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
  var invitasjonskode = req.params.invitasjonskode;
  hentInvitasjon(invitasjonskode, function(err, item) {
    if (!item) {
      console.warn('Invitasjonskode ' + invitasjonskode + ' ikke funnet.');
      res.status(404).send('Fant dessverre ikke invitasjonskoden [' + invitasjonskode + '] i systemet.' );
    } else if (err) {
      console.warn('Error ved uthenting av invitasjon: ' + err);
      res.status(500).send('Klarte ikke å hente ut invitasjonen dessverre, prøv igjen senere!');  
    } else {
      console.log("Result: " + JSON.stringify(item));
      res.render("hovedside", {title: "Bryllup 24. august 2013", gjester : item}); 
    }
  });
};