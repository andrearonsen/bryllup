var mongo = require('mongodb');

//mongo localhost:27017/bryllup
//mongo ds049537.mongolab.com:49537/nodejitsu_andrearonsen_nodejitsudb7379247420 -u nodejitsu_andrearonsen -p 5kn803s0rp2nrpt3r4cplahs7u

var db_options = {w: 1, native_parser: true};
var mongolab_username = "nodejitsu_andrearonsen";
var mongolab_pw = "5kn803s0rp2nrpt3r4cplahs7u";
var mongolab_server = new mongo.Server("ds049537.mongolab.com", 49537);
var mongolab_bryllupDbNavn = "nodejitsu_andrearonsen_nodejitsudb7379247420";
var mongolab_db = new mongo.Db(mongolab_bryllupDbNavn, mongolab_server, db_options);

var local_server = new mongo.Server("127.0.0.1", 27017, {});
var local_bryllupDbNavn = "bryllup";
var local_db = new mongo.Db(local_bryllupDbNavn, local_server,  db_options);

var fn = require('underscore');
var fn_s = require('underscore.string');

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
    
    var inv_kode = invitasjon.invitasjonskode || lagInvitasjonskode(kode);
    
    invitasjon.invitasjonskode = inv_kode.toUpperCase();

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
    console.log('[' + invitasjon.invitasjonskode + ']: ' + fn_s.toSentence(gjester.map(printGjest), ", ", " og ") + " Adresse[" + fn_s.toSentence(invitasjon.adresse, ', ', ', ') + ']');
  });
}

function leggInnInvitasjonslisteIDB(error, client, invitasjonsliste) {
  if (error) throw error;
    var gjesteliste = new mongo.Collection(client, 'gjesteliste');
    
    gjesteliste.ensureIndex({"invitasjonskode" : 1}, {unique : true, dropDups: true}, function (err, res) {
      if (err) throw err;
    });
    
    gjesteliste.insert(invitasjonsliste, function(err, docs) {
      if (err) console.warn(err.message);
      else console.log('Lagt inn ' + invitasjonsliste.length + ' invitasjoner.');
      client.close();
    });     
}

function skrivInvitasjonslisteTilDB_Local(invitasjonsliste) {
  console.log('Skriver gjesteliste til lokal DB...');
  local_db.open(function (error, client) {
    leggInnInvitasjonslisteIDB(error, client, invitasjonsliste);
  });
}


function skrivInvitasjonslisteTilDB_MongoLabs(invitasjonsliste) {
  console.log('Skriver gjesteliste til Mongolabs DB...');
  mongolab_db.open(function (error, p_client) {
    mongolab_db.authenticate(mongolab_username, mongolab_pw, function(err, p_client) { 
      leggInnInvitasjonslisteIDB(error, mongolab_db, invitasjonsliste);
    }); 
  });
}

function brudepar() {
  return [{
    gjest1 : {
        fornavn: 'André',
        mellomnavn: 'Kvist',
        etternavn: 'Aronsen',
        kommer: 'Ja',
        kommentar: 'Brudgommen.'
      },
    gjest2 : {
      fornavn: 'Sarah Elise',
      mellomnavn: 'Fagerlie',
      etternavn: 'Hansen',
      kommer: 'Ja',
      kommentar: 'Brura.'
    },
    adresse: [
      'Stubs vei 3',
      '1440 Drøbak'
    ],
    invitasjonskode: 'HYMENSLENKER'  
  }];
}  

function invitasjonsliste_gjester() {
  return [
  // FORELDRE:
  {
    gjest1 : {
      fornavn: 'Berit',
      etternavn: 'Løvig',
      kommer: 'Ja'
    },
    gjest2: {
      fornavn: 'Carsten',
      etternavn: 'Gnutzmann'
    },
    adresse: [
      'Vestsolveien 4',
      '1555 Son'
    ]
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
    },
    adresse: [
      'Tamburvegen 4',
      '3911 Porsgrunn'
    ]
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
    },
    adresse: [
      'Oscarsgt. 16',
      '1776 Halden'
    ]
  },

  // BESTEFORELDRE:
  {
    gjest1 : {
      fornavn: 'Åse',
      etternavn: 'Johansen',
    },
    adresse: [
      'Yngves vei 19',
      '3913 Porsgrunn'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Solfrid',
      etternavn: 'Aronsen',
    },
    adresse: [
      'Thor Heyerdahls gate 64',
      '3259 Larvik'
    ]
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
    },
    adresse: [
      'Oscarsgt. 16',
      '1776 Halden'
    ]
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
    },
    adresse: [
      'Mellomila 34',
      '7018 Trondheim'
    ]
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
    },
    adresse: [
      'Gneisveien 10',
      '1784 Halden'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Tanja',
      etternavn: 'Huse-Fagerlie'
    },
    gjest2 : {
      fornavn: 'Sverre',
      etternavn: 'Huse-Fagerlie'
    },
    adresse: [
      'Orredalen 2',
      '1920 Sørumsand'
    ]
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
    },
    adresse: [
      'Badehusgata 6',
      '1440 Drøbak'
    ]
  },
 
  {
    gjest1 : {
      fornavn: 'Ivar',
      etternavn: 'Goplen'
    },
    gjest2 : {
      fornavn: 'Trine Lise',
      etternavn: 'Aronsen'
    },
    adresse: [
      'Kastanjeveien 9',
      '3151 Tolvsrød'
    ]
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
    },
    adresse: [
      'Torstvedtbakken 1',
      '3271 Larvik'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Bjørg',
      etternavn: 'Brandt'
    },
    gjest2 : {
      fornavn: 'Odd',
      etternavn: 'Brandt'
    },
    adresse: [
      'Kringsjå terrasse 2 B',
      '1777 Halden'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Jorunn',
      etternavn: 'Fagerlie'
    },
    gjest2 : {
      fornavn: 'Bengt',
      etternavn: 'Fagerlie'
    },
    adresse: [
      'Grønlia',
      '1782 Halden'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Bjørn',
      etternavn: 'Fagerlie'
    },
    gjest2 : {
      fornavn: 'Judith',
      etternavn: 'Bjørkli'
    },
    adresse: [
      'Grønlia',
      '1784 Halden'
    ]
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
    },
    adresse: [
      'Sjællandsgade 3b 1tv',
      '9800 Hjørring',
      'Danmark'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Linn Therese',
      mellomnavn: 'Dalberg',
      etternavn: 'Johansen'
    },
    gjest2 : {
      fornavn: 'Steinar',
      etternavn: 'Ognedal'
    },
    adresse: [
      'Storhaug allé 19',
      '4015 Stavanger'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Mats',
      etternavn: 'Goplen'
    },
    gjest2 : {
      fornavn: 'Toril',
      etternavn: 'Midttun'
    },
    adresse: [
      'Duevegen 12',
      '9015 Tromsø'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Simen',
      etternavn: 'Goplen'
    },
    gjest2 : {
      fornavn: 'Helene',
      etternavn: 'Pedersen'
    },
    adresse: [
      'Sofies gate 65 B',
      '0168 Oslo'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Christoffer',
      mellomnavn: 'Narten',
      etternavn: 'Johansen'
    },
    adresse: [
      'Gardeveien 2A',
      '0363 Oslo'
    ]
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
    },
    adresse: [
      'Smedsrudveien 24 C',
      '1405 Langhus'
    ]
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
    },
    adresse: [
      'Husebyveien 10 A',
      '2020 Skedsmokorset'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Kim Halvard',
      mellomnavn: 'Midtvik',
      etternavn: 'Aronsen'
    },
    adresse: [
      'Sofies gate 65 B',
      '0168 Oslo'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Kristina',
      mellomnavn: 'Midtvik',
      etternavn: 'Aronsen'
    },
    adresse: [
      'Fastings gate 1 A',
      '0358 Oslo'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Anne-Cecilie',
      etternavn: 'Fagerlie'
    },
    gjest2 : {
      fornavn: 'Odd Morten',
      etternavn: 'Degnæs'
    },
    adresse: [
      'Maridalsveien 33',
      '0175 Oslo'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Eva',
      etternavn: 'Brandt'
    },
    gjest2 : {
      fornavn: 'Lars',
      etternavn: 'Berntzen'
    },
    adresse: [
      'Birkebeinerveien 11',
      '1532 Moss'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Morten',
      etternavn: 'Brandt'
    },
    gjest2 : {
      fornavn: 'Hanne',
      etternavn: 'Brandt'
    },
    adresse: [
      'Gimleveien 58',
      '1786 Halden'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Øyvind',
      etternavn: 'Fagerlie'
    },
    gjest2 : {
      fornavn: 'Anita',
      etternavn: 'Fagerlie'
    },
    adresse: [
      'Fjordgløttveien 13',
      '1765 Halden'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Ole',
      etternavn: 'Fagerlie'
    },
    gjest2 : {
      fornavn: 'Gro',
      etternavn: 'Fagerlie'
    },
    adresse: [
      'Snarveien 3',
      '1791 Tistedal'
    ]
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
    },
    adresse: [
      'Skorkeberg allé 20 A',
      '1440 Drøbak'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Renate',
      etternavn: 'Nordahl'
    },
    gjest2 : {
      fornavn: 'Sindre Alexander',
      etternavn: 'Andresen'
    },
    adresse: [
      'Ullerudfaret 19',
      '1447 Drøbak'
    ]
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
    },
    adresse: [
      'Bergkrystallen 3 A',
      '1155 Oslo'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Ingrid',
      etternavn: 'Martinsen'
    },
    adresse: [
      'Pilestredet Park 5',
      '0176 Oslo'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Berit Kaspara',
      mellomnavn: 'Signete',
      etternavn: 'Fredheim'
    },
    adresse: [
      'Gylteveien 16',
      '1443 Drøbak'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Marianne',
      etternavn: 'Wilhelmsen'
    },
    gjest2 : {
      fornavn: 'Johan',
      etternavn: 'Lundh'
    },
    adresse: [
      'Krusebyveien 70',
      '1540 Vestby'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Michal',
      etternavn: 'Bienkunski'
    },
    gjest2 : {
      fornavn: 'Gabriela',
      etternavn: 'Bienkunska'
    },
    adresse: [
      'Jordstjerneveien 27 D',
      '1283 Oslo'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Julia',
      etternavn: 'Zeiger'
    },
    gjest2 : {
      fornavn: 'Christian',
      etternavn: 'Zeiger'
    },
    adresse: [
      'Rotermundstraße 6',
      'DE-30165 Hannover',
      'Germany'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Christoph',
      etternavn: 'Perner'
    },
    gjest2 : {
      fornavn: 'Teresa',
      etternavn: 'Perner'
    },
    adresse: [
      'Dahlemstraße 26',
      'DE-63741 Aschaffenburg-Damm',
      'Germany'
    ]
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
    },
    adresse: [
      'Skogsegglia 9',
      '2019 Skedsmokorset'
    ]
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
    },
    adresse: [
      'pinnerudvegen 51',
      '2390 Moelv'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Karen Margrethe',
      etternavn: 'Alkanger'
    },
    gjest2 : {
      fornavn: 'Jørn Erik',
      etternavn: 'Ahlsen'
    },
    adresse: [
      'Liljeveien 3',
      '1450 Nesoddtangen'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Anne-Helene',
      etternavn: 'Kulia'
    },
    adresse: [
      'St Olavs vei 19 B',
      '4631 Kristiansand S'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Siv Elizabeth',
      etternavn: 'Ulstein'
    },
    gjest2 : {
      fornavn: 'Keneth Rafaeli',
      etternavn: 'Kimaro'
    },
    adresse: [
      'Dynekilgt. 9E',
      '0569 Oslo'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Eivind',
      etternavn: 'Modalsli'
    },
    gjest2 : {
      fornavn: 'Toril',
      etternavn: 'Sande'
    },
    adresse: [
      'Rugdevegen 25 C',
      '2609 Lillehammer'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Trond Einar',
      etternavn: 'Edvardsen'
    },
    adresse: [
      'Bakken 14',
      '9017 Tromsø'
    ]
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
    },
    adresse: [
      'Røyskattveien 16',
      '1615 Fredrikstad'
    ]
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
    },
    adresse: [
      'Båtstangveien 63 C',
      '3230 Sandefjord'
    ]
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
    },
    adresse: [
      'Helgesens gate 84 D',
      '0563 Oslo'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Kim Erik',
      etternavn: 'Hang'
    },
    adresse: [
      'Nord Norges Ortopediske Verksted',
      'v/Kim Erik Hang',
      'Mellomvn. 23',
      '9009 Tromsø'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Anders',
      etternavn: 'Torgersen'
    },
    gjest2 : {
      fornavn: 'Lissy',
      etternavn: 'Sommer'
    },
    adresse: [
      'Veksthusfløtten 24',
      '0594 Oslo'
    ]
  },

  {
    gjest1 : {
      fornavn: 'Camilla',
      etternavn: 'Bergström'
    },
    gjest2 : {
      fornavn: 'Tormod',
      etternavn: 'Bergström'
    },
    adresse: [
      'Frydenlundveien 24',
      '1784 Halden'
    ]
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
    },
    adresse: [
      'Nordstrandveien 81',
      '1164 Oslo'
    ]
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
    adresse: [
      'Kringkollen 20 C',
      '0690 Oslo'
    ]
  }

  ];
}

// printDatabaseListe(invitasjonsliste);
// skrivInvitasjonslisteTilDB(invitasjonsliste);
// skrivInvitasjonslisteTilDB_MongoLabs(invitasjonsliste_gjester);

// skrivInvitasjonslisteTilDB_MongoLabs(brudepar());
var liste_db = brudepar().concat(invitasjonsliste_gjester()).map(lagInvitasjonForDB);
printDatabaseListe(liste_db);

// skrivInvitasjonslisteTilDB_MongoLabs(liste_db);
// skrivInvitasjonslisteTilDB_Local(liste_db);
