var BRYLLUP = this.BRYLLUP || {};

(function (win, $, _, Modernizr, B) {
  "use strict";

  var meldingTemplate = '<div id="melding" class="alert">{{tekst}}</div>';
  var fantIkkeKodeTekst = 'Fant dessverre ikke invitasjonskoden. Prøv igjen, koden består av initialer og et tall. Eller send André en SMS på 406 10 588, så fikser han det :-)';
  var serverFeilTekst = 'Det har oppstått en feil på serveren, beklager! Prøv igjen senere.';

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
      B.sjekkInvitasjonskodeKnapp.button('loading');
    };

    B.skjulLoadingScreen = function () {
      console.log('Skjuler loading screen.');
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

  function scrollToElement($element) {
    $('html, body').animate({
      scrollTop: $element.offset().top
    }, 2000);
  }

  function initGoogleMaps() {
    console.log('Initializing Google Maps element.');
    var isMobile = win.screen.width < 767;
    var center_latlng = new google.maps.LatLng(59.88842,10.782051);
    var zoom = isMobile ? 10 : 12;
    var mapOptions = {
        zoom: zoom,
        center: center_latlng,
        mapTypeId: google.maps.MapTypeId.HYBRID
    };
    
    B.kart = new google.maps.Map(document.getElementById("kart_canvas"), mapOptions); 

    var kirke_latlng = new google.maps.LatLng(59.847266,10.831965);
    var kirke_icon = '/ico/kirke.png';
    var marker_kirke = new google.maps.Marker({
      position: kirke_latlng,
      map: B.kart,
      animation: google.maps.Animation.BOUNCE,
      icon: kirke_icon,
      title: "Mortensrud Kirke"
    });

    var miles_latlng = new google.maps.LatLng(59.924431, 10.731964);
    var miles_icon = '/ico/fest.png';
    var marker_miles = new google.maps.Marker({
      position: miles_latlng,
      map: B.kart,
      animation: google.maps.Animation.BOUNCE,
      icon: miles_icon,
      title: "Miles Oslo AS"
    });

    var phus_latlng = new google.maps.LatLng(59.916396, 10.74225);
    var phus_icon = '/ico/phus.png';
    var marker_phus = new google.maps.Marker({
      position: phus_latlng,
      map: B.kart,
      animation: google.maps.Animation.BOUNCE,
      icon: phus_icon,
      title: "Europark Sentrum P-hus"
    });

    var hotell_latlng = new google.maps.LatLng(59.918660, 10.733699);
    var hotell_icon = '/ico/hotell.png';
    var marker_hotell = new google.maps.Marker({
      position: hotell_latlng,
      map: B.kart,
      animation: google.maps.Animation.BOUNCE,
      icon: hotell_icon,
      title: "Radisson Blu Scandinavia Hotel Oslo"
    });

    var toggleBounce = function (marker) {
      return function () {
        if (marker.getAnimation() != null) {
          marker.setAnimation(null);
        } else {
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }
      };
    }
    google.maps.event.addListener(marker_kirke, 'click', toggleBounce(marker_kirke));
    google.maps.event.addListener(marker_miles, 'click', toggleBounce(marker_miles));
    google.maps.event.addListener(marker_hotell, 'click', toggleBounce(marker_hotell));
    google.maps.event.addListener(marker_phus, 'click', toggleBounce(marker_phus));

    $('.map').on('shown', function () { 
      google.maps.event.trigger(B.kart, 'resize'); 
    });

    B.kart.set('scrollwheel', false);
    // B.kart.set('draggable', false);

    var kartZoomAnkerElement = $("#kart-zoom-anker");

    $('#zoomut').click(function (e) {
      B.kart.setCenter(center_latlng);
      B.kart.setZoom(zoom);
      scrollToElement(kartZoomAnkerElement);
    });

    $('#zoomkirke').click(function (e) {
      B.kart.setCenter(kirke_latlng);
      B.kart.setZoom(isMobile ? 15 : 17);
      scrollToElement(kartZoomAnkerElement);
    });

    $('#zoomfest').click(function (e) {
      B.kart.setCenter(miles_latlng);
      B.kart.setZoom(isMobile ? 17 : 19);  
      scrollToElement(kartZoomAnkerElement);
    });
    
    $('#zoomphus').click(function (e) {
      B.kart.setCenter(phus_latlng);
      B.kart.setZoom(isMobile ? 17 : 19);  
      scrollToElement(kartZoomAnkerElement);
    });

    $('#zoomhotell').click(function (e) {
      B.kart.setCenter(hotell_latlng);
      B.kart.setZoom(isMobile ? 17 : 19);
      scrollToElement(kartZoomAnkerElement);    
    });
  }

  B.initGoogleMaps = initGoogleMaps;

  function loadGoogleMaps() {
    console.log('Loading Google Maps script.');

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyCiBzXAv4sNqDkEL5UgAeq1ZSV7IkuABgc&sensor=false&callback=BRYLLUP.initGoogleMaps";
    document.body.appendChild(script);
  }

  function loadDisqus() {
    var disqus_shortname = 'bryllupfagerliearonsen'; 
    var dsq = document.createElement('script'); 
    dsq.type = 'text/javascript'; 
    dsq.async = true;
    dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
  }

  function findCurrentCountry(callback) {
    if (Modernizr.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
          $.getJSON('http://ws.geonames.org/countryCode', {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              type: 'JSON'
          }, function(result) {
              callback(result.countryCode);
          });
      });
    }
  }

  function sjekkSvarFrist() {
    var idag = new Date();
    var svarFrist = new Date(2013, 5, 17, 8, 0, 0, 0); // 17. juni kl. 8
    if (idag > svarFrist) {
      console.log("Svarfrist er utløpt.");
      $(".gjest-kommer button").attr("disabled", "disabled");
    } else {
      console.log("Fortsatt tid til å svare.");
      console.log("SvarFrist: " + svarFrist);
    }
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
    console.log('Starter hovedside...');
    var invitasjon = lagreInvitasjon(invitasjon_json);

    $("#loggut").click(function (e) {
      console.log("Logger ut " + invitasjon.invitasjonskode);
      fjernInvitasjonskode(); 
      fjernInvitasjon();
      forwardTilIndex(); 
    });

    $("#vis-gjesteliste").click(function (e) {
      var lv_target = $(this).attr('data-target');
      var lv_url = $(this).attr('href');
      $(lv_target).load(lv_url);
    });

    $(".gjest-kommer button").click(function (e) {
      var $denne = $(this);
      var invitasjonskode = B.aktuellInvitasjon.invitasjonskode;
      var gjestindex = parseInt($denne.parent().attr('data-gjestindex'));
      var kommer = $denne.hasClass('kommer');
      var kommer_ikke = $denne.hasClass('kommer-ikke');
      var var_aktivert = $denne.hasClass('active');

      var $gjest_navn = $denne.parent().siblings(".gjest-fulltnavn")
                          .removeClass("text-warning")
                          .removeClass("text-error")
                          .removeClass("text-success");
      console.log("GjestNavnJquery:" + $gjest_navn);

      var kommer_str = 'ikke_svart';
      if (kommer && !kommer_ikke) {
        kommer_str = 'Ja';
        $gjest_navn.addClass("text-success");
      } else if (kommer_ikke && !kommer) {
        kommer_str = 'Nei';
        $gjest_navn.addClass("text-error");
      } else {
        $gjest_navn.addClass("text-warning");
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

    sjekkSvarFrist();

    _.defer(loadGoogleMaps);
    _.defer(function () {
      $("#bildekarusell").load("/bildekarusell/" + win.screen.width);
    });
    _.defer(loadDisqus);
    _.defer(function () {
      var isMobile = win.screen.width <= 767;
      var soundropUrl = "http://goo.gl/nZQOe";
      if (isMobile) {
        $("#sounddrop-container").empty().append("<a href='" + soundropUrl + "'>" + soundropUrl + "</a>");
      } else {
        $("#spilleliste-soundrop").attr("src", soundropUrl);
      }
    });
  }

  B.startIndex = startIndex;
  B.startHovedside = startHovedside;
}(window, jQuery, _, Modernizr, BRYLLUP));