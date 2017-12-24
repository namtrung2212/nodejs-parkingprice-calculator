
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var express = require('express');
var moment = require('moment');

var ParkingPricing = require("./ParkingPricing");
var pricing = new ParkingPricing();


const server = express();
server.listen(3000);

server.get('/GetBookingOptions', function (req, res) {

    if (req.query.startAt && req.query.paidAmt) {

        var startAt = moment.unix(req.query.startAt);
        var paidAmt = req.query.paidAmt;

        var options = pricing.GetBookingOptions(startAt, paidAmt);
        res.json(options);

    } else {
        res.json({});
    }

});

server.get('/CalculateBooking', function (req, res) {

    if (req.query.startAt && req.query.minuteQty) {

        var startAt = moment.unix(req.query.startAt);
        var minuteQty = moment(startAt).add(req.query.minuteQty, "m");

        var booking = pricing.CalculateBooking(startAt, endAt);

        res.json(booking);

    } else {
        res.json({});
    }

});
