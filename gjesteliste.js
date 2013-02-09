var mongodb = require('mongodb');

var mongolabs_username = "heroku_app11537877";
var mongolabs_pw = "1juhi6cu74fau867pjtaab3vna";
var mongolabs_server = new mongodb.Server("ds049467.mongolab.com", 49467);
var mongolabs_bryllupDbNavn = "heroku_app11537877";

var server = new mongodb.Server("127.0.0.1", 27017, {});
var bryllupDbNavn = "bryllup";

var fn = require('underscore');
var fn_s = require('underscore.string');

var template = {
    invitasjonsnummer: 'initialer + random(100-999) = AKASEF765',
    gjest1 : {
      fornavn: 'André Kvist',
      etternavn: 'Aronsen',
      kommer : false,
      kommentar: ''
    },
    gjest2 : {
      fornavn: 'Sarah Elise Fagerlie',
      etternavn: 'Hansen',
      kommer : false,
      kommentar: '' 
    }
};

function initialer(gjest) {
  var i = [];
  if (gjest.fornavn && gjest.fornavn.length > 0) {
    i.push(gjest.fornavn.charAt(0));
  }
  if (gjest.mellomnavn && gjest.mellomnavn.length > 0) {
    i.push(gjest.mellomnavn.charAt(0));
  }
  if (gjest.etternavn && gjest.etternavn.length > 0) {
    i.push(gjest.etternavn.charAt(0));
  }
  return i;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function lagInvitasjonskode(initialer) {
  var initialer_str = fn.reduce(fn.flatten(initialer), function (memo, i) {
    return memo + i;
  }, '');
  return initialer_str.toUpperCase() + rand(100, 999);
}

function settDefaultVerdierForGjest(gjest) {
  gjest.kommer = gjest.kommer || 'ikke_svart';
  gjest.kommentar = gjest.kommentar || '';  
}

function lagInvitasjonForDB(invitasjon) {
    var kode = [];
    if (invitasjon.gjest1) {
      kode.push(initialer(invitasjon.gjest1));
      settDefaultVerdierForGjest(invitasjon.gjest1);
    }
    if (invitasjon.gjest2) {
      kode.push(initialer(invitasjon.gjest2));
      settDefaultVerdierForGjest(invitasjon.gjest2);
    }
    if (invitasjon.gjest3) {
      kode.push(initialer(invitasjon.gjest3));
      settDefaultVerdierForGjest(invitasjon.gjest3);
    }
    invitasjon.invitasjonskode = lagInvitasjonskode(kode);
    return invitasjon;  
}


function lagInvitasjonslisteForDB(invitasjonsliste) {
  return fn.map(invitasjonsliste, lagInvitasjonForDB);
}

function printGjest(gjest) {
  return fn_s.toSentence(fn.compact([gjest.fornavn, gjest.mellomnavn, gjest.etternavn]), " ", " ") + ' kommer[' + gjest.kommer + ']';
}

function printInvitasjonsliste(liste) {
  liste.forEach(function (invitasjon) {
    var gjester = fn.compact([invitasjon.gjest1, invitasjon.gjest2, invitasjon.gjest3]);
    console.log(fn_s.toSentence(gjester.map(printGjest), ", ", " og "));
  });
}

function printDatabaseListe(liste) {
  liste.map(lagInvitasjonForDB).forEach(function (invitasjon) {
    var gjester = fn.compact([invitasjon.gjest1, invitasjon.gjest2, invitasjon.gjest3]);
    console.log('[' + invitasjon.invitasjonskode + ']: ' + fn_s.toSentence(gjester.map(printGjest), ", ", " og "));
  });
}

function leggInnInvitasjonslisteIDB(error, client) {
  if (error) throw error;
  var gjesteliste = new mongodb.Collection(client, 'gjesteliste');

  gjesteliste.insert(invitasjonsliste.map(lagInvitasjonForDB), function(err, docs) {
    if (err) console.warn(err.message);
    else console.log('Lagt inn ' + invitasjonsliste.length + ' invitasjoner.');
    client.close();
  });
}

function skrivInvitasjonslisteTilDB(invitasjonsliste) {
  new mongodb.Db(bryllupDbNavn, server, {w: 1}).open(function (error, client) {
    leggInnInvitasjonslisteIDB(error, client);
  });
}


function skrivInvitasjonslisteTilDB_MongoLabs(invitasjonsliste) {
  var client = new mongodb.Db(mongolabs_bryllupDbNavn, mongolabs_server, {w: 1});
  client.open(function (error, p_client) {
    client.authenticate(mongolabs_username, mongolabs_pw, function(err, p_client) { 
      leggInnInvitasjonslisteIDB(error, client); 
    }); 
  });
}

var invitasjonsliste = [
  // FORELDRE:
  {
    gjest1 : {
      fornavn: 'Berit',
      etternavn: 'Løvig',
      kommer: 'Ja'
    }
  },

  {
    gjest1 : {
      fornavn: 'Jan Egil',
      etternavn: 'Aronsen',
      kommer: 'Ja'
    },
    gjest2 : {
      fornavn: 'Vigdis',
      etternavn: 'Aronsen',
      kommer: 'Ja'
    }
  },

  {
    gjest1 : {
      fornavn: 'Sverre',
      mellomnavn: 'Juul',
      etternavn: 'Hansen',
      kommer: 'Ja'
    },
    gjest2 : {
      fornavn: 'Kathrine',
      etternavn: 'Holene',
      kommer: 'Ja'
    }
  },

  // BESTEFORELDRE:
  {
    gjest1 : {
      fornavn: 'Åse',
      etternavn: 'Johansen',
    }
  },

  {
    gjest1 : {
      fornavn: 'Solfrid',
      etternavn: 'Aronsen',
    }
  }, 

  // SØSKEN
  {
    gjest1 : {
      fornavn: 'Jesper',
      mellomnavn: 'Juul',
      etternavn: 'Hansen'
    },
    gjest2 : {
      fornavn: 'Maren Kathrine',
      etternavn: 'Raiby'
    }
  },

  {
    gjest1 : {
      fornavn: 'Aleksander',
      mellomnavn: 'Kvist',
      etternavn: 'Aronsen'
    },
    gjest2 : {
      fornavn: 'Lise Katrine',
      etternavn: 'Kähler'
    }
  },

  {
    gjest1 : {
      fornavn: 'Silje Konstanse',
      mellomnavn: 'Fagerlie',
      etternavn: 'Hansen'
    },
    gjest2 : {
      fornavn: 'Stein Rino',
      etternavn: 'Hansen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Tanja',
      etternavn: 'Huse-Fagerlie'
    },
    gjest2 : {
      fornavn: 'Sverre',
      etternavn: 'Huse-Fagerlie'
    }
  },

  // ONKLER OG TANTER
  {
    gjest1 : {
      fornavn: 'Frode',
      etternavn: 'Johansen'
    },
    gjest2 : {
      fornavn: 'Astrid',
      etternavn: 'Halmøy'
    }
  },
 
  {
    gjest1 : {
      fornavn: 'Ivar',
      etternavn: 'Goplen'
    },
    gjest2 : {
      fornavn: 'Trine Lise',
      etternavn: 'Aronsen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Kjell',
      etternavn: 'Aronsen'
    },
    gjest2 : {
      fornavn: 'Solfrid',
      mellomnavn: 'Midtvik',
      etternavn: 'Aronsen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Bjørg',
      etternavn: 'Brandt'
    },
    gjest2 : {
      fornavn: 'Odd',
      etternavn: 'Brandt'
    }
  },

  {
    gjest1 : {
      fornavn: 'Jorunn',
      etternavn: 'Fagerlie'
    },
    gjest2 : {
      fornavn: 'Bengt',
      etternavn: 'Fagerlie'
    }
  },

  {
    gjest1 : {
      fornavn: 'Bjørn',
      etternavn: 'Fagerlie'
    },
    gjest2 : {
      fornavn: 'Judith',
      etternavn: 'Bjørkli'
    }
  },

  // SØSKENBARN

  {
    gjest1 : {
      fornavn: 'Marie-Jeanette',
      etternavn: 'Dalberg'
    },
    gjest2 : {
      fornavn: 'Anders',
      etternavn: 'Berg'
    }
  },

  {
    gjest1 : {
      fornavn: 'Linn-Therese',
      mellomnavn: 'Dalberg',
      etternavn: 'Johansen'
    },
    gjest2 : {
      fornavn: 'Steinar',
      etternavn: 'Ognedal'
    }
  },

  {
    gjest1 : {
      fornavn: 'Mats',
      etternavn: 'Goplen'
    },
    gjest2 : {
      fornavn: 'Toril',
      etternavn: 'Midttun'
    }
  },

  {
    gjest1 : {
      fornavn: 'Simen',
      etternavn: 'Goplen'
    },
    gjest2 : {
      fornavn: 'Helene',
      etternavn: 'Pedersen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Christoffer',
      mellomnavn: 'Narten',
      etternavn: 'Johansen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Cecilie',
      etternavn: 'Narten'
    },
    gjest2 : {
      fornavn: 'Anders',
      mellomnavn: 'Hareide',
      etternavn: 'Holt'
    }
  },

  {
    gjest1 : {
      fornavn: 'Kenneth',
      mellomnavn: 'Narten',
      etternavn: 'Johansen'
    },
    gjest2 : {
      fornavn: 'Kjersti',
      etternavn: 'Dahl'
    }
  },

  {
    gjest1 : {
      fornavn: 'Kim Halvard',
      mellomnavn: 'Midtvik',
      etternavn: 'Aronsen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Kristina',
      mellomnavn: 'Midtvik',
      etternavn: 'Aronsen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Anne-Cecilie',
      etternavn: 'Fagerlie'
    },
    gjest2 : {
      fornavn: 'Odd Morten',
      etternavn: 'Degnæs'
    }
  },

  {
    gjest1 : {
      fornavn: 'Eva',
      etternavn: 'Brandt'
    },
    gjest2 : {
      fornavn: 'Lars',
      etternavn: 'Berntzen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Morten',
      etternavn: 'Brandt'
    },
    gjest2 : {
      fornavn: 'Hanne',
      etternavn: 'Brandt'
    }
  },

  {
    gjest1 : {
      fornavn: 'Morten',
      etternavn: 'Brandt'
    },
    gjest2 : {
      fornavn: 'Hanne',
      etternavn: 'Brandt'
    }
  },

  {
    gjest1 : {
      fornavn: 'Øyvind',
      etternavn: 'Fagerlie'
    },
    gjest2 : {
      fornavn: 'Hanne',
      etternavn: 'Fagerlie'
    }
  },

  {
    gjest1 : {
      fornavn: 'Ole',
      etternavn: 'Fagerlie'
    },
    gjest2 : {
      fornavn: 'Gro',
      etternavn: 'Fagerlie'
    }
  },

  // VENNER

  {
    gjest1 : {
      fornavn: 'Mie',
      mellomnavn: 'Molin',
      etternavn: 'Lafjell'
    },
    gjest2 : {
      fornavn: 'Martin',
      etternavn: 'Weydahl'
    }
  },

  {
    gjest1 : {
      fornavn: 'Renate',
      etternavn: 'Nordahl'
    },
    gjest2 : {
      fornavn: 'Sindre Alexander',
      etternavn: 'Andresen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Tonje',
      mellomnavn: 'Fjell',
      etternavn: 'Olufsen'
    },
    gjest2 : {
      fornavn: 'Clas',
      etternavn: 'Fischer'
    }
  },

  {
    gjest1 : {
      fornavn: 'Ingrid',
      etternavn: 'Martinsen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Berit Kaspara',
      mellomnavn: 'Signete',
      etternavn: 'Fredheim'
    }
  },

  {
    gjest1 : {
      fornavn: 'Marianne',
      etternavn: 'Wilhelmsen'
    },
    gjest2 : {
      fornavn: 'Johan',
      etternavn: '???etternavn'
    }
  },

  {
    gjest1 : {
      fornavn: 'Michal',
      etternavn: 'Bienkunski'
    },
    gjest2 : {
      fornavn: 'Gabriela',
      etternavn: 'Bienkunska'
    }
  },

  {
    gjest1 : {
      fornavn: 'Julia',
      etternavn: 'Zeiger'
    },
    gjest2 : {
      fornavn: 'Christian',
      etternavn: 'Zeiger'
    }
  },

  {
    gjest1 : {
      fornavn: 'Christoph',
      etternavn: 'Perner'
    },
    gjest2 : {
      fornavn: 'Teresa',
      etternavn: 'Perner'
    }
  },

  {
    gjest1 : {
      fornavn: 'Isabella',
      etternavn: 'Thørn',
      kommentar: 'Vegetarmat.'
    },
    gjest2 : {
      fornavn: 'Glenn',
      etternavn: 'Thørn'
    }
  },

  {
    gjest1 : {
      fornavn: 'Ingvild',
      mellomnavn: 'Solbakken',
      etternavn: 'Barli'
    },
    gjest2 : {
      fornavn: 'Andreas',
      mellomnavn: 'Solbakken',
      etternavn: 'Barli'
    }
  },

  {
    gjest1 : {
      fornavn: 'Karen Margrethe',
      etternavn: 'Alkanger'
    },
    gjest2 : {
      fornavn: 'Jørn Erik',
      etternavn: 'Ahlsen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Anne-Helene',
      etternavn: 'Kulia'
    }
  },

  {
    gjest1 : {
      fornavn: 'Siv Elizabeth',
      etternavn: 'Ulstein'
    },
    gjest2 : {
      fornavn: '???fornavn',
      mellomnavn: 'Kimaro',
      etternavn: 'Ulstein'
    }
  },

  {
    gjest1 : {
      fornavn: 'Eivind',
      etternavn: 'Modalsli'
    },
    gjest2 : {
      fornavn: 'Toril',
      etternavn: 'Sande'
    }
  },

  {
    gjest1 : {
      fornavn: 'Trond Einar',
      etternavn: 'Edvardsen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Atle',
      etternavn: 'Bakkevik'
    },
    gjest2 : {
      fornavn: 'Trine',
      mellomnavn: 'Frestad',
      etternavn: 'Bakkevik'
    }
  },

  {
    gjest1 : {
      fornavn: 'Hilde',
      mellomnavn: 'Sand',
      etternavn: 'Dagfinrud'
    },
    gjest2 : {
      fornavn: 'Tommy',
      etternavn: 'Pedersen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Camilla',
      mellomnavn: 'Faye-Schjøll',
      etternavn: 'Bjøntegaard'
    },
    gjest2 : {
      fornavn: 'Laila',
      etternavn: 'Tønder'
    }
  },

  {
    gjest1 : {
      fornavn: 'Kim Erik',
      etternavn: 'Hang'
    }
  },

  {
    gjest1 : {
      fornavn: 'Anders',
      etternavn: 'Torgersen'
    },
    gjest2 : {
      fornavn: 'Lizzy',
      etternavn: 'Sommer'
    }
  },

  {
    gjest1 : {
      fornavn: 'Camilla',
      etternavn: 'Bergström'
    },
    gjest2 : {
      fornavn: 'Tormod',
      etternavn: 'Bergström'
    }
  },

  {
    gjest1 : {
      fornavn: 'Christer',
      mellomnavn: 'Stewart',
      etternavn: 'Aarbø'
    },
    gjest2 : {
      fornavn: 'Synne',
      mellomnavn: 'Ødegaarden',
      etternavn: 'Aarbø'
    }
  },

  {
    gjest1 : {
      fornavn: 'Britta',
      mellomnavn: 'Waagan',
      etternavn: 'Friis'
    },
    gjest2 : {
      fornavn: 'Henning',
      etternavn: 'Friis'
    },
    gjest3 : {
      fornavn: 'Herman',
      etternavn: 'Friis'
    }
  },

  {
    gjest1 : {
      fornavn: 'Birgitte',
      etternavn: 'Friis'
    },
    gjest2 : {
      fornavn: 'Fredrik',
      etternavn: 'Dahl'
    }
  },

  {
    gjest1 : {
      fornavn: 'Helene',
      etternavn: 'Friis'
    },
    gjest2 : {
      fornavn: 'Einar',
      mellomnavn: 'Aaby',
      etternavn: 'Hirsch'
    }
  }
 
];

printDatabaseListe(invitasjonsliste);
// skrivInvitasjonslisteTilDB(invitasjonsliste);
skrivInvitasjonslisteTilDB_MongoLabs(invitasjonsliste);


