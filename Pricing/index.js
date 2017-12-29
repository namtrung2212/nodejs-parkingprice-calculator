

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var express = require('express');
var moment = require('moment');

const RedisClient = require('redis');
var caching = RedisClient.createClient("6379", "localhost");

var Pricing = require("./Pricing");
var pricing = new Pricing(caching);

var Booking = require("./Booking");
var booking = new Booking(caching, pricing);

const server = express();
server.use(bodyParser.urlencoded({ extended: false }))
server.use(bodyParser.json())
server.listen(3000);


server.get('/pricing/priceList', async function (req, res) {
    var priceList = await pricing.GetPriceList();
    res.json(priceList);
});

server.post('/pricing/priceList', async function (req, res) {

    var priceList = req.body;

    await pricing.SetPriceList(priceList);

    priceList = await pricing.GetPriceList();
    res.json(priceList);

});

//MONEY TO DURATION
server.get('/pricing/options', async function (req, res) {

    if (req.query.startAt && req.query.paidAmt) {

        var startAt;
        if (req.query.startAt == "now")
            startAt = moment();
        else
            startAt = moment.unix(req.query.startAt);

        var paidAmt = req.query.paidAmt;
        paidAmt = parseFloat(paidAmt);

        var options = await pricing.GetBookingOptions(startAt, paidAmt);
        res.json(options);

    } else {
        res.json({});
    }

});

//MONEY TO DURATION
server.get('/pricing/suitable', async function (req, res) {

    if (req.query.startAt && req.query.paidAmt) {

        var startAt;
        if (req.query.startAt == "now")
            startAt = moment();
        else
            startAt = moment.unix(req.query.startAt);

        var paidAmt = req.query.paidAmt;
        paidAmt = parseFloat(paidAmt);

        var ticket = await pricing.GetSuitableBooking(startAt, paidAmt);

        res.json(ticket);

    } else {
        res.json({});
    }

});

//DURATION TO MONEY
server.get('/pricing/calculate', async function (req, res) {

    var ticket = {};

    if (req.query.startAt && req.query.minuteQty) {

        var startAt;
        if (req.query.startAt == "now")
            startAt = moment();
        else
            startAt = moment.unix(req.query.startAt);

        var endAt = moment(startAt).add(req.query.minuteQty, "m");

        ticket = await pricing.CalculateBooking(startAt, endAt);

    }

    res.json(ticket);

});

server.get('/booking/ticket', async function (req, res) {

    var plateNumber = req.query.plateNumber;
    var parkingPlace = req.query.parkingPlace;
    if (plateNumber && parkingPlace) {

        var ticket = await booking.GetTicket(plateNumber, parkingPlace);
        res.json(ticket);

    } else {

        res.json(null);

    }

});

server.get('/payment/card', async function (req, res) {

    var plateNumber = req.query.plateNumber;
    var parkingPlace = req.query.parkingPlace;
    var paidAmt = req.query.paidAmt;
    paidAmt = parseFloat(paidAmt);

    if (plateNumber && parkingPlace && paidAmt) {

        var ticket = await booking.PayByCard(plateNumber, parkingPlace, paidAmt);
        res.json(ticket);

    } else {

        res.json(null);
    }

});

server.get('/payment/sms', async function (req, res) {

    var sms = req.query.sms;
    if (sms) {

        var ticket = await booking.PayBySMS(sms);
        res.json(ticket);

    } else {

        res.json(null);

    }

});


server.get('/booking/flush', async function (req, res) {

    caching.flushall();
    res.json("done");
});