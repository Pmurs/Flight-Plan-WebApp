/**
 * Created by Paul on 11/9/2015.
 */
/*
 CLIENT
 1. User clicks -> click lat/long
 19555 airports in JSON file, don't want to search all of these, particularly not on client side
 2. Ajax GET v1/airport/:lat/:lng, v1/airport?lat=...&long=...&maxDist=10000 (graham used second approach)
 Result(airport){
 calculate distance and print (can calculate distance on server)
 }

 SERVER
 1. Incoming request (lat, long, max)
 Use REDIS or Mongo to do geoqueries
 REDIS will be really fast, cost lots of memory, cached data is wiped on restart (tough to develop with), GEO is experimental right now
 Use Mongo instead: load once and it's there, can be updated if needed. Potentially not as fast as REDIS because it uses disk space instead of cache, GEO support is good
 2. Search MongoDB for lat/long
 Create airport schema
 'type':     string required
 'ident':    string unique required
 'date':     date
 'region':   string
 'pos':      {type: [number], index: '2dsphere'}
 Create script airport_loader.js, run once for setup
 Connect to MongoDB (mongoose.connect)
 Import airports.json (require airports.json into variable, will be an array)
 Require airport schema -> Airport
 async.each(airports, function(airport){
 [-long/3600, lat/3600]
 new Airport(airport);
 save doc
 }
 May want to only add actual airports, or only search for them later
 Want to convert from seconds to degrees, divide big numbers by 3600
 module.exports = mongoose.model(...)
 require(geolib)
 Airport.find({type: 'AIRPORT', $near: {$geometry: {Point, coordinates -> [long, lat]}, $maxdistance: 10000}}
 Sort on distance, return closest + distance (can add markers to map with one line of code)
 */

'use strict';


var mongoose = require('mongoose'),
    async    = require('async'),
    airports = require('./apt.json');

var Schema = mongoose.Schema;

var airportSchema = Schema({
    type: {type: String, required: true},
    ident: {type: String, required: true, unique: true},
    date: {type: Date},
    region: {type: String},
    pos: {type: [Number], index: '2dsphere'}
});

var Airport = mongoose.model('Airport', airportSchema);

var load = function() {
    console.log('Adding airports to database');
    async.each(airports, function (airport) {
        if (airport.type === 'AIRPORT') {
            var newAirport = Airport(airport);
            newAirport.pos = [-(airport.longitudeSec) / 3600, (airport.latitudeSec) / 3600];
            newAirport.save(function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
    console.log('All airports added to database');
}

module.exports = {Airport : Airport, load: load};