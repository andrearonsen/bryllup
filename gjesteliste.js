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
  var fn = require('underscore');
  var fn_s = require('underscore.string');
  var initialer_str = fn.reduce(fn.flatten(initialer), function (memo, i) {
    return memo + i;
  }, '');
  return initialer_str.toUpperCase() + rand(100, 999);
}

function lagInvitasjonForDB(invitasjon) {
    var kode = [];
    if (invitasjon.gjest1) {
      kode.push(initialer(invitasjon.gjest1));
      invitasjon.gjest1.kommer = false;
      invitasjon.gjest1.kommentar = '';
    }
    if (invitasjon.gjest2) {
      kode.push(initialer(invitasjon.gjest2));
      invitasjon.gjest2.kommer = false;
      invitasjon.gjest2.kommentar = '';
    }
    if (invitasjon.gjest3) {
      kode.push(initialer(invitasjon.gjest3));
      invitasjon.gjest3.kommer = false;
      invitasjon.gjest3.kommentar = '';
    }
    invitasjon.invitasjonskode = lagInvitasjonskode(kode);
    return invitasjon;  
}


function lagInvitasjonslisteForDB(invitasjonsliste) {
  var fn = require('underscore');
  return fn.map(invitasjonsliste, lagInvitasjonForDB);
}

function printGjest(gjest) {
  var fn = require('underscore');
  var fn_s = require('underscore.string');
  return fn_s.toSentence(fn.compact([gjest.fornavn, gjest.mellomnavn, gjest.etternavn]), " ", " ");
}

function printInvitasjonsliste(liste) {
  var fn = require('underscore');
  var fn_s = require('underscore.string');
  liste.forEach(function (invitasjon) {
    var gjester = fn.compact([invitasjon.gjest1, invitasjon.gjest2, invitasjon.gjest3]);
    console.log(fn_s.toSentence(gjester.map(printGjest), ", ", " og "));
  });
}

function printDatabaseListe(liste) {
  var fn = require('underscore');
  var fn_s = require('underscore.string');
  liste.map(lagInvitasjonForDB).forEach(function (invitasjon) {
    var gjester = fn.compact([invitasjon.gjest1, invitasjon.gjest2, invitasjon.gjest3]);
    console.log('Invitasjonskode: ' + invitasjon.invitasjonskode);
    console.log(fn_s.toSentence(gjester.map(printGjest), ", ", " og "));
  });
}

var invitasjonsliste = [
  {
    gjest1 : {
      fornavn: 'Berit',
      etternavn: 'Løvig'
    }
  },

  {
    gjest1 : {
      fornavn: 'Jan Egil',
      etternavn: 'Aronsen'
    },
    gjest2 : {
      fornavn: 'Vigdis',
      etternavn: 'Aronsen'
    }
  },

  {
    gjest1 : {
      fornavn: 'Sverre',
      mellomnavn: 'Juul',
      etternavn: 'Hansen'
    },
    gjest2 : {
      fornavn: 'Kathrine',
      etternavn: 'Holene'
    }
  }
];

printDatabaseListe(invitasjonsliste);