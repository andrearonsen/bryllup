var BRYLLUP = this.BRYLLUP || {};

(function (win, $, _, Modernizr, B) {
  "use strict";

  var meldingTemplate = '<div id="melding" class="alert">{{tekst}}</div>';
  var fantIkkeKodeTekst = 'Fant dessverre ikke invitasjonskoden.';
  var serverFeilTekst = 'Det har oppstått en feil på serveren, beklager!';

  B.meldinger = {};

  function konfigurer() {
    _.templateSettings = {
      interpolate : /\{\{(.+?)\}\}/g
    };

    var meldingContainer = $('#meldingContainer');
    var fantIkkeKodeMelding = $(_.template(meldingTemplate, {tekst: fantIkkeKodeTekst}));
    var serverFeilMelding = $(_.template(meldingTemplate, {tekst: serverFeilTekst}));

    var loadingScreen = $("#loadingScreen").modal({show: false});

    B.meldinger.fantIkkeKode = function () {
      meldingContainer.empty();
      fantIkkeKodeMelding.appendTo(meldingContainer);
    };
    B.meldinger.serverFeil = function () {
      meldingContainer.empty();
      serverFeilMelding.appendTo(meldingContainer);
    };

    B.invitasjonskodeInput = $("#invitasjonskodeInput");
    B.sjekkInvitasjonskodeKnapp = $("#sjekkInvitasjonskodeKnapp");
    B.pacman = $("#pacman");

    B.fokusInvitasjonskodeInput = function () {
      B.invitasjonskodeInput.focus();
    };

    B.hentVerdiInvitasjonskodeInput = function () {
      return B.invitasjonskodeInput.get(0).value;
    };

    B.visLoadingScreen = function () {
      console.log('Viser loading screen.');
      // loadingScreen.modal('show');
      // B.pacman.css({'padding-left': 0});
      // B.pacman.animate({'padding-left': '+=500px'}, {
      //   duration: 10000
      // });
      B.sjekkInvitasjonskodeKnapp.button('loading');
    };

    B.skjulLoadingScreen = function () {
      console.log('Skjuler loading screen.');
      // loadingScreen.modal('hide');
      B.sjekkInvitasjonskodeKnapp.button('reset');
      B.fokusInvitasjonskodeInput();
    };
  }

  function forwardTilHovedside(invitasjonskode) {
    win.location = "/hovedside/" + invitasjonskode;  
  }

  function forwardTilIndex() {
    win.location = "/";  
  }

  function doWithLocalStorage(callback) {
    try {
      if (Modernizr.localstorage) {
        return callback();  
      }
    } catch (error) {
      console.warn("Error in localstorage: " + error);
    }
    return undefined;
  }

  function hentLagretInvitasjonskode() {
    return doWithLocalStorage(function () {
      return win.localStorage["invitasjonskode"]; 
    });
    
  }

  function lagreInvitasjonskode(invitasjonskode) {
    doWithLocalStorage(function () {
      win.localStorage["invitasjonskode"] = invitasjonskode;
    }); 
  }

  function fjernInvitasjonskode() {
    doWithLocalStorage(function () {
      win.localStorage.removeItem("invitasjonskode");
    });  
  }

  function fjernInvitasjon() {
    doWithLocalStorage(function () {
      win.localStorage.removeItem("invitasjon");
    });  
  }

  function lagreInvitasjon(invitasjon) {
    if (invitasjon && (typeof invitasjon === 'object')) {
      console.log('Lagrer invitasjon fra object.');
      doWithLocalStorage(function () {
        win.localStorage["invitasjon"] = JSON.stringify(invitasjon);
      });  
    } else if (invitasjon && (typeof invitasjon === 'string')) {
      console.log('Lagrer invitasjon fra json-string.');
      doWithLocalStorage(function () {
        win.localStorage["invitasjon"] = invitasjon;
      });  
    } 
  }

  function hentInvitasjon(invitasjon) {
    var lagretInvitasjon = win.localStorage["invitasjon"];
    return lagretInvitasjon ? JSON.parse(lagretInvitasjon) : {};
  }

  function sjekkInvitasjonskode(invitasjonskode) {
    B.visLoadingScreen();

    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: "/sjekkinvitasjonskode/" + invitasjonskode,
      statusCode: {
        200: function () {
          console.log("Fant invitasjonskode: " + invitasjonskode); 
          lagreInvitasjonskode(invitasjonskode);
          forwardTilHovedside(invitasjonskode); 
        },
        404: function () {
          console.log("404"); 
          B.fokusInvitasjonskodeInput();
          B.meldinger.fantIkkeKode();
          B.skjulLoadingScreen();
        },
        500: function () {
          console.log("500"); 
          B.fokusInvitasjonskodeInput();
          B.meldinger.serverFeil();
          B.skjulLoadingScreen();
        }
      }
    }); 
  }

  function hentGjesterSomKommer(callback) {
    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: "/gjestersomkommer",
      statusCode: {
        200: function (gjester_som_kommer) {
          console.log("Fant " + gjester_som_kommer.length + " gjester som kommer."); 
          callback(gjester_som_kommer); 
        },
        404: function () {
          console.log("404"); 
        },
        500: function () {
          console.log("500"); 
        }
      }
    });   
  }

  function startIndex() {
    konfigurer();

    B.visLoadingScreen();
    var lagretInvitasjonskode = hentLagretInvitasjonskode();
    if (lagretInvitasjonskode) {
      forwardTilHovedside(lagretInvitasjonskode);
      return;
    }

    B.sjekkInvitasjonskodeKnapp.click(function (e) {
      sjekkInvitasjonskode(B.hentVerdiInvitasjonskodeInput());  
    });

    B.invitasjonskodeInput.keyup(function (e) {
      if (e.which == 13) {
        var invitasjonskode = $(this).get(0).value;
        sjekkInvitasjonskode(invitasjonskode);
      }   
    });
    
    B.skjulLoadingScreen();
  }

  function startHovedside() {
    $("#loggut").click(function (e) {
      fjernInvitasjonskode(); 
      fjernInvitasjon(); 
    });

    $("#vis-gjesteliste").click(function (e) {
      var lv_target = $(this).attr('data-target');
      var lv_url = $(this).attr('href');
      $(lv_target).load(lv_url);
    });
  }

  B.startIndex = startIndex;
  B.startHovedside = startHovedside;
  B.fjernInvitasjonskode = fjernInvitasjonskode;
  B.forwardTilIndex = forwardTilIndex;
  B.lagreInvitasjon = lagreInvitasjon;
  B.hentInvitasjon = hentInvitasjon;
  B.hentGjesterSomKommer = hentGjesterSomKommer;
}(window, jQuery, _, Modernizr, BRYLLUP));