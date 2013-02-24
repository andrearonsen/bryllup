//////////////////////////
var use_local_db = true;
//////////////////////////
var http = require('http');
var fs = require('fs');
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

function mongolab_db_client() {
  return new mongo.Db(mongolab_bryllupDbNavn, new mongo.Server("ds049537.mongolab.com", 49537), db_options); 
}

function local_db_client() {
  return new mongo.Db(local_bryllupDbNavn, new mongo.Server("127.0.0.1", 27017), db_options); 
}

function db_client() {
  return use_local_db ? local_db_client() : mongolab_db_client(); 
}

function openDbWithAuth(callback) {
  var db = db_client();
  db.open(function (error, p_client) {
    if (use_local_db) {
      setTimeout(function() {
        callback(error, db);  
      }, 1000);
      
    } else {
      db.authenticate(mongolab_username, mongolab_pw, function(err, p_client) { 
        callback(error, db);
      }); 
    }
  });
}

function doWithGjestelisteCollection(callback) {
  openDbWithAuth(function (err, db) {
    if (err) throw err;
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
      callback(err, (count === 1));
    });  
  });
}

function gjester(invitasjon) {
  return fn.compact([invitasjon.gjest1, invitasjon.gjest2, invitasjon.gjest3]);
}

function gjestKommer(gjest) {
  return gjest.kommer === 'Ja'; 
}

function harMinstEnGjestSomKommer(invitasjon) {
  return fn.any(gjester(invitasjon), gjestKommer);
}

function printGjest(gjest) {
  return fn_s.toSentence(fn.compact([gjest.fornavn, gjest.mellomnavn, gjest.etternavn]), " ", " ");
}

function gjester_til_tekst(invitasjon) {
  return fn_s.toSentence(fn.filter(gjester(invitasjon), gjestKommer).map(printGjest), ", ", " og ");
}

function hentAlleGjesterSomKommer(callback) {
  console.log("Test har minst en: " + harMinstEnGjestSomKommer({gjest1: {kommer : 'Nei'}, gjest2: {kommer : 'Ja'}}));
  doWithGjestelisteCollection(function (err, gjesteliste) {
    if (err) throw err;
    gjesteliste.find().toArray(function (err, alle_invitasjoner) {
      if (err) throw err;
      console.log("Alle invitasjoner: " + alle_invitasjoner.length);
      var invitasjoner = fn.filter(alle_invitasjoner, harMinstEnGjestSomKommer).map(gjester_til_tekst); 
      callback(err, invitasjoner);
    });  
  });
}

function berikInvitasjon(invitasjon) {
  invitasjon.tiltale = function () {
    var fornavn = function (gjest) {return gjest.fornavn};
    return fn_s.toSentence(gjester(invitasjon).map(fornavn), ", ", " og ");
  }();

  invitasjon.gjester = gjester(invitasjon).map(function (gjest) {
    gjest.fulltNavn = printGjest(gjest);
    return gjest;
  });
}

exports.gjestersomkommer = function (req, res) {
  console.log("Henter alle gjester som kommer.");
  hentAlleGjesterSomKommer(function (err, invitasjoner_navn) {
    if (err) {
      console.warn('Feil ved lesing fra databasen: ' + err);
      res.status(500).send('Klarte ikke å hente ut gjestelisten.');   
    } else {
      console.log("Fant " + invitasjoner_navn.length + " invitasjoner.");
      res.send(invitasjoner_navn);
    }
  });
};

exports.gjesteliste = function (req, res) {
  console.log("Henter gjesteliste");
  hentAlleGjesterSomKommer(function (err, invitasjoner_navn) {
    if (err) {
      console.warn('Feil ved lesing fra databasen: ' + err);
      res.status(500).send('Klarte ikke å hente ut gjestelisten.');   
    } else {
      console.log("Fant " + invitasjoner_navn.length + " invitasjoner.");
      res.render("gjesteliste", {gjesteliste: invitasjoner_navn});
    }
  });
}; 

function lesBilderJson(callbackBilderErLest) {
  // http.get("http://www.fagerliearonsen.com/bilder.json", function(res) {
  //   console.log("Got response: " + res.statusCode);
  //   res.on('data', function (chunk) {
  //     console.log('BODY: ' + chunk);
  //     callback(chunk);
  //   });
  // }).on('error', function(e) {
  //   console.log("Klarte ikke å lese bilder.json: " + e.message);
  //   // Fallback lokal fil:
  //   fs.readFile('bilder.json', 'utf8', function (err, data) {
  //     if (err) {
  //       return console.log(err);
  //     }
  //     console.log(data);
  //   });
  // }); 

  var options = {
    host: 'www.fagerliearonsen.com',
    path: '/bilder.json'
  };

  var callback = function(response) {
    var str = '';

    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
      str += chunk;
    });

    //the whole response has been recieved, so we just print it out here
    response.on('end', function () {
      console.log(str);
      callbackBilderErLest(str);
    });
  }

  http.request(options, callback).on('error', function(e) {
    console.log("Klarte ikke å lese bilder.json fra danmark: " + e.message);
    // Fallback lokal fil:
    fs.readFile('bilder.json', 'utf8', function (err, data) {
      if (err) {
        console.log(err);
      }
      console.log(data);
    });
  }).end();
}

exports.bildekarusell = function (req, res) {
  console.log("Henter bildekarusell");
  if (!req.params.devicewidth) {
    res.status(500).send("Devicewidth er påkrevd.");
    return;
  }
  var devicewidth = parseInt(req.params.devicewidth);
  console.log("Bildekarusell: " + devicewidth)

  var widthMap = [
    { p: function (w) {return w <= 800;}, imageWidth: '800' },                // iPhone
    { p: function (w) {return w > 800 && w <= 1200;}, imageWidth: '1200' },   // LowRes/iPad
    { p: function (w) {return w > 1200 && w <= 1600;}, imageWidth: '1600' },  // Highres
    { p: function (w) {return w > 1600;}, imageWidth: '3000' }                // MB Retina
  ];

  var matchingWidth = fn.find(widthMap, function (kategory) { return kategory.p(devicewidth); });
  var baseurl = "http://www.fagerliearonsen.com/" + matchingWidth.imageWidth + "/";
  
  lesBilderJson(function (bilderJson) {
    console.log("Bilder: " + bilderJson);
    var bilder = fn.map(JSON.parse(bilderJson).bilder, function (bilde) {
      bilde.url = baseurl + bilde.navn;
      return bilde;
    });
    res.render('bildekarusell.jade', {bilder : bilder});
  });
};


exports.index = function(req, res) {
  res.render("index.jade", {});
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

function oppdaterGjestFelt(req, res, felt) {
  var invitasjonskode = req.body.invitasjonskode;
  var gjest_key = req.body.gjest_key;
  var felt_verdi = req.body[felt];
  if (!invitasjonskode || !gjest_key || !felt_verdi) {
    throw {msg: "Ugyldige parameter: ", parameter: [invitasjonskode, gjest_key, felt_verdi]};
  }

  var gjest_felt_key = gjest_key + '.' + felt;
  var set_felt = {};
  set_felt[gjest_felt_key] = felt_verdi;
  doWithGjestelisteCollection(function (err, gjesteliste) {
    if (err) throw err;
    gjesteliste.update({invitasjonskode: invitasjonskode}, {$set: set_felt}, {safe: true}, function (err) {
      if (err) throw err;
      console.log("Oppdatert invitasjon " + invitasjonskode + " -> " + gjest_key + ' felt [' + felt + "] = " + felt_verdi);
      res.status(200).send("OK");
    });  
  });   
}

exports.oppdaterkommer = function (req, res) {
  var invitasjonskode = req.body.invitasjonskode;
  var gjest_key = req.body.gjest_key;
  var kommer = req.body.kommer;
  if (!invitasjonskode || !gjest_key || !kommer) {
    throw {msg: "Ugyldige parameter: ", parameter: [invitasjonskode, gjest_key, kommer]};
  }

  var gjest_kommer = gjest_key + '.kommer';
  var set_kommer = {};
  set_kommer[gjest_key + '.kommer'] = kommer;
  doWithGjestelisteCollection(function (err, gjesteliste) {
    if (err) throw err;
    gjesteliste.update({invitasjonskode: invitasjonskode}, {$set: set_kommer} ,{safe: true}, function (err) {
      if (err) throw err;
      console.log("Oppdatert invitasjon " + invitasjonskode + " -> " + gjest_key + ' kommer: ' + kommer);
      res.status(200).send("OK");
    });  
  }); 
};

exports.oppdaterkommentar = function (req, res) {
  oppdaterGjestFelt(req, res, 'kommentar');
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