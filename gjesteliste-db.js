var mongodb = require('mongodb');
var server = new mongodb.Server("127.0.0.1", 27017, {});

new mongodb.Db('bryllup', server, {w: 1}).open(function (error, client) {
  if (error) throw error;
  var gjesteliste = new mongodb.Collection(client, 'gjesteliste');

  gjesteliste.insert({
    invitasjonsnummer: 'FAR123',
    velkomstmelding: 'Velkommen André og Sarah!',
    gjest1 : {
      fornavn: 'André Kvist',
      etternavn: 'Aronsen',
      kommer : false,
      kommentar: 'Ingen.'
    },
    gjest2 : {
      fornavn: 'Sarah Elise Fagerlie',
      etternavn: 'Hansen',
      kommer : true,
      kommentar: 'Vegetarmat.' 
    }
  }, function(err, docs) {
    if (err) console.warn(err.message);
    else console.log('successfully updated');
    client.close();
  });
});
