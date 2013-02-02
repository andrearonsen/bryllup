var mongoose = require ("mongoose");

// Connect to db, localhost if no ENV vars set
var uristring = 
  process.env.MONGODB_URI || 
  process.env.MONGOLAB_URI || 
  'mongodb://localhost/HelloMongoose';

// Ensure safe writes
var mongoOptions = { db: { safe: true }};

// Connect
mongoose.connect(uristring, mongoOptions, function (err, res) {
  if (err) { 
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + uristring);
  }
});