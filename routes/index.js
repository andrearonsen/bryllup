var mongo = require('mongodb');

// var mongoUri = process.env.MONGOLAB_URI || "mongodb://localhost:27017/bryllup"; 

var bryllupDbUri = "mongodb://localhost:27017/bryllup";

exports.index = function(req, res) {
  mongo.Db.connect(bryllupDbUri, function (err, db) {
    db.collection('gjesteliste', function(er, collection) {
      if (er) log.warn("Error ved opphenting av gjesteliste.");
      collection.findOne({'invitasjonskode': 'AFOD435'}, function(err, item) {
        console.log("Result: " + JSON.stringify(item));
        res.render("index", {title: "Bryllup 24. august 2013", gjester : item});
      });  
    });
  });
};

exports.hovedside = function(req, res) {
  var invitasjonskode = req.params.invitasjonskode;
  if (!invitasjonskode) {
    res.send("Fant ikke invitasjonskode.");
    return;
  }
  mongo.Db.connect(bryllupDbUri, function (err, db) {
    db.collection('gjesteliste', function(er, collection) {
      if (er) log.warn("Error ved opphenting av gjesteliste.");
      collection.findOne({'invitasjonskode': invitasjonskode}, function(err, item) {
        console.log("Result: " + JSON.stringify(item));
        res.render("index", {title: "Bryllup 24. august 2013", gjester : item});
      });  
    });
  });
};