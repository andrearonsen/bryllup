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
      B.aktuellInvitasjon = invitasjon;  
    } else if (invitasjon && (typeof invitasjon === 'string')) {
      console.log('Lagrer invitasjon fra json-string.');
      doWithLocalStorage(function () {
        win.localStorage["invitasjon"] = invitasjon;
      });
      B.aktuellInvitasjon = JSON.parse(invitasjon); 
    }
    return B.aktuellInvitasjon; 
  }

  function hentInvitasjon(invitasjon) {
    return doWithLocalStorage(function () {
      var lagretInvitasjon = win.localStorage["invitasjon"];
      return lagretInvitasjon ? JSON.parse(lagretInvitasjon) : {};
    });  
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

  function oppdaterGjestFelt(url, invitasjonskode, gjest_key, felt, felt_verdi) {
    var data = {invitasjonskode : invitasjonskode, gjest_key : gjest_key};
    data[felt] = felt_verdi;
    $.ajax({
      type: 'POST',
      dataType: 'json',
      url: url,
      data: data,
      statusCode: {
        200: function () {
          console.log("Oppdatert invitasjon " + invitasjonskode + " -> " + gjest_key + ' felt [' + felt + "] = " + felt_verdi);
          B.aktuellInvitasjon[gjest_key][felt] = felt_verdi;
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

  function oppdaterKommentar(invitasjonskode, gjest_key, kommentar) {
    oppdaterGjestFelt('/oppdaterkommentar', invitasjonskode, gjest_key, 'kommentar', kommentar);
  }

  function oppdaterKommer(invitasjonskode, gjest_key, kommer) {
    $.ajax({
      type: 'POST',
      dataType: 'json',
      url: "/oppdaterkommer",
      data: {invitasjonskode: invitasjonskode, gjest_key : gjest_key, kommer: kommer},
      statusCode: {
        200: function () {
          console.log("Oppdatert invitasjon " + invitasjonskode + " -> " + gjest_key + ' kommer: ' + kommer);
          B.aktuellInvitasjon[gjest_key].kommer = kommer;
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

  function initGoogleMaps() {
    console.log('Initializing Google Maps element.');
    
    var mapOptions = {
        zoom: 8,
        center: new google.maps.LatLng(-34.397, 150.644),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    B.kart = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);  
  }

  B.initGoogleMaps = initGoogleMaps;

  function loadGoogleMaps() {
    console.log('Loading Google Maps script.');

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyCiBzXAv4sNqDkEL5UgAeq1ZSV7IkuABgc&sensor=false&callback=BRYLLUP.initGoogleMaps";
    document.body.appendChild(script);

    $('.map').on('shown', function () { 
      google.maps.event.trigger(map, 'resize'); 
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

  function startHovedside(invitasjon_json) {
    var invitasjon = lagreInvitasjon(invitasjon_json);

    $("#loggut").click(function (e) {
      fjernInvitasjonskode(); 
      fjernInvitasjon(); 
    });

    $("#vis-gjesteliste").click(function (e) {
      var lv_target = $(this).attr('data-target');
      var lv_url = $(this).attr('href');
      $(lv_target).load(lv_url);
    });

    $(".gjest-kommer button").click(function (e) {
      var invitasjonskode = B.aktuellInvitasjon.invitasjonskode;
      var gjestindex = parseInt($(this).parent().attr('data-gjestindex'));
      var kommer = $(this).hasClass('kommer');
      var kommer_ikke = $(this).hasClass('kommer-ikke');
      var var_aktivert = $(this).hasClass('active');

      var kommer_str = 'ikke_svart';
      if (kommer && !kommer_ikke) {
        kommer_str = 'Ja';
      } else if (kommer_ikke && !kommer) {
        kommer_str = 'Nei';
      }
      
      var gjest_key = 'gjest' + (gjestindex + 1);
      oppdaterKommer(invitasjonskode, gjest_key, kommer_str);
    });

    $(".gjest-kommentar").change(function () {
      var invitasjonskode = B.aktuellInvitasjon.invitasjonskode;
      var gjestindex = parseInt($(this).attr('data-gjestindex'));
      var gjest_key = 'gjest' + (gjestindex + 1);
      var kommentar = $(this).get(0).value;
      oppdaterKommentar(invitasjonskode, gjest_key, kommentar);
    });

    _.defer(loadGoogleMaps);
    _.defer(function () {
      $("#bilder").load("/bildekarusell/" + win.screen.width);
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