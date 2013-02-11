var BRYLLUP = this.BRYLLUP || {};

(function (win, $, _, B) {
  "use strict";

  var meldingTemplate = '<div id="melding" class="alert">{{tekst}}</div>';
  var fantIkkeKodeTekst = 'Fant dessverre ikke invitasjonskoden.';
  var serverFeilTekst = 'Det har oppstått en feil på serveren, beklager!';

  B.meldinger = {};

  function konfigurer() {
    _.templateSettings = {
      interpolate : /\{\{(.+?)\}\}/g
    };

    // $.fn.modalmanager.defaults.spinner = '<img class="loading-spinner" src="/img/ajax-loader.gif" />';
    // $.fn.modal.defaults.spinner = '<img class="loading-spinner" src="/img/ajax-loader.gif" />';

    var meldingContainer = $('#meldingContainer');
    var fantIkkeKodeMelding = $(_.template(meldingTemplate, {tekst: fantIkkeKodeTekst}));
    var serverFeilMelding = $(_.template(meldingTemplate, {tekst: serverFeilTekst}));
    
    B.meldinger.fantIkkeKode = function () {
      meldingContainer.empty();
      fantIkkeKodeMelding.appendTo(meldingContainer);
    };
    B.meldinger.serverFeil = function () {
      meldingContainer.empty();
      serverFeilMelding.appendTo(meldingContainer);
    };

    B.invitasjonskodeInput = $("#invitasjonskodeInput");
    B.fokusInvitasjonskodeInput = function () {
      B.invitasjonskodeInput.focus();
    };
    B.hentVerdiInvitasjonskodeInput = function () {
      return B.invitasjonskodeInput.get(0).value;
    };
  }

  function forwardTilHovedside(invitasjonskode) {
    win.location = "/hovedside/" + invitasjonskode;  
  }

  function forwardTilIndex() {
    win.location = "/";  
  }

  function hentLagretInvitasjonskode() {
    return win.localStorage["invitasjonskode"];
  }

  function lagreInvitasjonskode(invitasjonskode) {
    win.localStorage["invitasjonskode"] = invitasjonskode;
  }

  function fjernInvitasjonskode() {
    win.localStorage.removeItem("invitasjonskode");
  }

  function sjekkInvitasjonskode(invitasjonskode) {
    var loading = $('#loading');
    // loading.modal({spinner: '/img/ajax-loader.gif'});
    loading.modal();
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
          loading.modal('hide');
        },
        500: function () {
          console.log("500"); 
          B.fokusInvitasjonskodeInput();
          B.meldinger.serverFeil();
          loading.modal('hide');
        }
      }
    }); 
  }

  function startIndex() {
    konfigurer();

    var lagretInvitasjonskode = hentLagretInvitasjonskode();
    if (lagretInvitasjonskode) {
      forwardTilHovedside(lagretInvitasjonskode);
      return;
    }

    $("#sjekkInvitasjonskodeKnapp").click(function (e) {
      sjekkInvitasjonskode(B.hentVerdiInvitasjonskodeInput());  
    });

    B.invitasjonskodeInput.keyup(function (e) {
      if (e.which == 13) {
        var invitasjonskode = $(this).get(0).value;
        sjekkInvitasjonskode(invitasjonskode);
      }   
    }).focus();
  }

  function startHovedside() {
    $("#loggut").click(function (e) {
      fjernInvitasjonskode();  
    });
  }

  B.startIndex = startIndex;
  B.startHovedside = startHovedside;
  B.fjernInvitasjonskode = fjernInvitasjonskode;
  B.forwardTilIndex = forwardTilIndex;
}(window, jQuery, _, BRYLLUP));