

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var express = require('express');
var moment = require('moment');

var ParkingPricing = require("./ParkingPricing");
var pricing = new ParkingPricing();


const server = express();
server.use(bodyParser.urlencoded({ extended: false }))
server.use(bodyParser.json())
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

    console.log("now1 = " + moment().format("YYYY-MM-DD HH:mm:ss"));
    console.log("now2 = " + moment().utcOffset(7).format("YYYY-MM-DD HH:mm:ss"));

    var booking = {};

    if (req.query.startAt && req.query.minuteQty) {

        var startAt;
        if (req.query.startAt == "now")
            startAt = moment();
        else
            startAt = moment.unix(req.query.startAt);

        var endAt = moment(startAt).add(req.query.minuteQty, "m");

        booking = pricing.CalculateBooking(startAt, endAt);

    }

    res.json(booking);

});


server.get('/GetPriceList', async function (req, res) {
    var priceList = await pricing.GetPriceList();
    res.json(priceList);
});

server.post('/SetPriceList', async function (req, res) {

    var priceList = req.body;

    await pricing.SetPriceList(priceList);

    priceList = await pricing.GetPriceList();
    res.json(priceList);

});
