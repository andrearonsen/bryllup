var BRYLLUP = this.BRYLLUP || {};

(function (win, $) {
  "use strict";

  function sjekkInvitasjonskode(invitasjonskode) {
    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: "/sjekkinvitasjonskode/" + invitasjonskode,
      statusCode: {
        200: function () {
          $("#melding").text("");  
        },
        404: function () {
          $("#melding").text("Invitasjonskoden finnes ikke.");
        },
        500: function () {
          $("#melding").text("Feil på server.");
        }
      }
    }).done(function (item) {
      alert('OK: ' + JSON.stringify(item));
      win.location = "/hovedside/" + invitasjonskode;
    });
  }

  BRYLLUP.sjekkInvitasjonskode = sjekkInvitasjonskode;

  BRYLLUP.start = function () {
    $("#sjekkInvitasjonskodeKnapp").click(function (e) {
      var invitasjonskode = $("#invitasjonskodeInput").get(0).value;
      sjekkInvitasjonskode(invitasjonskode);  
    });

    $("#invitasjonskodeInput").keyup(function (e) {
      if (e.which == 13) {
        var invitasjonskode = $(this).get(0).value;
        sjekkInvitasjonskode(invitasjonskode);
      }   
    });
  };
}(window, jQuery));

BRYLLUP.start();