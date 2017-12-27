
var moment = require('moment');

const RedisClient = require('redis');

function Booking(pricing) {

    this.pricing = pricing;
    this.caching = RedisClient.createClient("6379", "localhost");
    // this.caching.flushall();

};

module.exports = Booking;

Booking.prototype.SetTicket = async function (ticket) {
    this.caching.set(ticket.PlateNumber + ticket.ParkingPlace, JSON.stringify(ticket));
};

Booking.prototype.GetTicket = async function (plateNumber, parkingPlace) {

    var that = this;

    return new Promise(async function (resolve, reject) {

        try {

            that.caching.get(plateNumber + parkingPlace, function (err, reply) {

                // console.log("err =" + JSON.parse(err));
                // console.log("reply =" + JSON.parse(reply));
                var ticket = err ? null : JSON.parse(reply);
                ticket = that.formatTicket(ticket);
                resolve(ticket);
            });

        } catch (error) {

            resolve(null);
        }
    }).catch(err => {

    });
};

Booking.prototype.PayTicket = async function (plateNumber, parkingPlace, paidAmt) {

    var startAt = moment.utc().utcOffset(7);

    var ticket = await this.GetTicket(plateNumber, parkingPlace);
    if (ticket) {
        startAt = ticket.startAt;
        paidAmt += parseFloat(ticket.paidAmt);
    }

    var obj = await this.pricing.GetSuitableBooking(startAt, paidAmt);
    if (!obj)
        return null;

    ticket = {
        plateNumber: plateNumber,
        parkingPlace: parkingPlace,
        ...obj
    };

    this.SetTicket(ticket);

    return ticket;
};

Booking.prototype.PayByCard = async function (plateNumber, parkingPlace, paidAmt) {
    return this.PayTicket(plateNumber, parkingPlace, paidAmt);
};

Booking.prototype.PayBySMS = async function (sms) {

    var arr = sms.split(" ");

    if (arr.length < 3)
        return null;

    var ip = arr[0];
    if (ip.substring(0, 2) != "IP")
        return null;

    var paidAmt = ip.substring(2, ip.length);
    if (parseFloat(paidAmt) <= 0)
        return null;

    paidAmt = parseFloat(paidAmt) * 1000;


    var parkingPlace = arr[1];
    var plateNumber = arr[2];

    return this.PayTicket(plateNumber, parkingPlace, paidAmt);

};


Booking.prototype.formatTicket = async function (ticket) {

    if (ticket.startAt)
        ticket.startAtVN = moment.unix(ticket.startAt).utcOffset(7).format("YYYY-MM-DD HH:mm:ss");

    if (ticket.endAt)
        ticket.endAtVN = moment.unix(ticket.endAt).utcOffset(7).format("YYYY-MM-DD HH:mm:ss");

    return ticket;
};