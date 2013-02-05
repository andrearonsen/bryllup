
/*
 * GET home page.
 */
var mongo = require('mongodb');

var mongoUri = process.env.MONGOLAB_URI || "mongodb://localhost:27017/bryllup"; 

exports.index = function(req, res) {
  mongo.Db.connect(mongoUri, function (err, db) {
    db.collection('gjesteliste', function(er, collection) {
      if (er) log.warn("Gjester finnes ikke.");
      collection.findOne({'invitasjonskode': 'SJHKH992'}, function(err, item) {
        console.log("Result: " + JSON.stringify(item));
        res.render("index", {title: "Bryllup 24. august 2013", gjester : item});
      });  
    });
  });
};