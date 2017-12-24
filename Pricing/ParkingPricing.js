
var moment = require('moment');
const RedisClient = require('redis');

function ParkingPricing() {

    this.caching = RedisClient.createClient("6379", "localhost");
    this.InitPriceList();
};

module.exports = ParkingPricing;

ParkingPricing.prototype.InitPriceList = async function () {

    this.PriceList = await this.GetPriceList();

    if (!this.PriceList) {

        // this.PriceList = [
        //     {
        //         startHour: 6, endHour: 22, UOM: 60,
        //         prices: [
        //             { from: 1, to: 2, unitprice: 25000, adjust: 0 },
        //             { from: 3, to: 4, unitprice: 35000, adjust: 50000 },
        //             { from: 5, to: 10000, unitprice: 45000, adjust: 120000 }
        //         ]
        //     }
        // ];

        this.PriceList = [
            {
                startHour: 0, endHour: 24, UOM: 60,
                prices: [
                    { from: 1, to: 2, unitprice: 25000, adjust: 0 },
                    { from: 3, to: 4, unitprice: 35000, adjust: 50000 },
                    { from: 5, to: 10000, unitprice: 45000, adjust: 120000 }
                ]
            },
            {
                startHour: 18, endHour: 6, UOM: 60,
                prices: [
                    { from: 7, to: 12, unitprice: 0, adjust: 150000 }
                ]
            }
        ];

        await this.SetPriceList(this.PriceList);

    }
};

ParkingPricing.prototype.SetPriceList = async function (priceList) {
    this.PriceList = priceList;
    this.caching.set("ParkingPriceList", JSON.stringify(priceList));
};

ParkingPricing.prototype.GetPriceList = async function (key) {

    var that = this;

    return new Promise(async function (resolve, reject) {

        try {

            that.caching.get("ParkingPriceList", function (err, reply) {

                var priceList = err ? null : JSON.parse(reply);
                resolve(priceList);
            });

        } catch (error) {

            resolve(null);
        }
    }).catch(err => {

    });
};


//MONEY TO DURATION
ParkingPricing.prototype.GetBookingOptions = function (createdAt, paidAmt) {

    var startAt = moment(createdAt);

    var results = [];

    var endAt = moment(startAt);
    results = this.TryGetBookingOptions(startAt, endAt, results, paidAmt, 60);

    endAt = moment(results[results.length - 1].endAt);
    results = this.TryGetBookingOptions(startAt, endAt, results, paidAmt, 1);

    return results;
};


ParkingPricing.prototype.TryGetBookingOptions = function (startAt, endAt, results, paidAmt, interval) {

    do {

        var booking = this.CalculateBooking(startAt, endAt.add(interval, 'm'));
        if (booking.price <= paidAmt) {

            var obj = {
                ...booking,
                paidAmt: paidAmt,
                remainAmt: paidAmt - booking.price
            };

            if (results.length <= 0 || results[results.length - 1].price != obj.price) {
                results.push(obj);
            } else {
                results[results.length - 1] = obj;
            }

            endAt = moment(booking.endAt);
        }

    } while (booking.price <= paidAmt);

    return results;
}


//DURATION TO MONEY
ParkingPricing.prototype.CalculateBooking = function (startAt, endAt) {

    this.initMinutes(startAt, endAt);

    this.refreshLines();

    for (var i = 0; i < this.Minutes.length; i++) {
        var minute = this.Minutes[i];

        var minPricing = this.getMinPricing(minute);
        if (minPricing && minPricing.firstIndex == i) {

            for (var z = i; z <= minPricing.lastIndex; z++) {
                var curMinute = this.Minutes[z];
                this.validatePricings(curMinute);
            }
            this.refreshLines();
        }
    }

    var totalPrice = 0;
    var finalStart;
    var finalEnd;

    for (var i = 0; i < this.Minutes.length; i++) {
        var minute = this.Minutes[i];

        var count = 0;
        for (var v = 0; v < minute.priceList.length; v++) {
            var pricing = minute.priceList[v];

            if (pricing.isValid) {

                totalPrice += pricing.lineValue;
                if (!finalStart) finalStart = pricing.startAt;
                finalEnd = pricing.endAt;

                i = pricing.lastIndex;
                count++;
            }
        }
        if (count > 1)
            console("WRONG!");

    }

    return {
        minuteQty: this.Minutes.length,
        hourQty: parseFloat(this.Minutes.length / 60).toFixed(2),
        startAt: finalStart.utcOffset(7).format("YYYY-MM-DD HH:mm:ss"),
        endAt: finalEnd.utcOffset(7).format("YYYY-MM-DD HH:mm:ss"),
        // startAt: finalStart,
        // endAt: finalEnd,
        price: totalPrice
    };

};

ParkingPricing.prototype.initMinutes = function (startAt, endAt) {

    this.Minutes = [];

    startAt = moment({
        year: startAt.year(),
        month: startAt.month(),
        days: startAt.date(),
        hour: startAt.hours(),
        minute: startAt.minutes(),
        second: 0
    });

    endAt = moment({
        year: endAt.year(),
        month: endAt.month(),
        days: endAt.date(),
        hour: endAt.hours(),
        minute: endAt.minutes(),
        second: 0
    });


    var current = moment(startAt);

    var count = 0;
    while (current < endAt) {

        var minute = {
            index: count,
            startTime: moment(current),
            endTime: moment(current).add(1, 'm'),
            priceList: [],
            accumPrice: 0
        };

        for (var i = 0; i < this.PriceList.length; i++) {
            var pricing = this.PriceList[i];

            var isValid = this.isInRangeHours(minute.startTime, pricing.startHour, pricing.endHour);
            if (isValid)
                minute.priceList.push({
                    index: i,
                    isValid: true
                });
        }

        if (minute.priceList.length == 0)
            break;

        this.Minutes.push(minute);

        current = current.add(1, "m");
        count++;
    }

}

ParkingPricing.prototype.isInRangeHours = function (objTime, startHourInday, endHourInDay) {

    var momentAt = objTime.utcOffset(7);

    var minTime = moment({
        year: momentAt.year(),
        month: momentAt.month(),
        days: momentAt.date(),
        hour: startHourInday,
        minute: 0,
        second: 0
    });

    var maxTime = moment({
        year: momentAt.year(),
        month: momentAt.month(),
        days: momentAt.date(),
        hour: endHourInDay,
        minute: 0,
        second: 0
    });

    if (startHourInday > endHourInDay)
        maxTime = maxTime.add(1, 'd');

    var isOk = (minTime <= momentAt && momentAt < maxTime);
    if (!isOk) {
        minTime = minTime.add(1, 'd');
        maxTime = maxTime.add(1, 'd');
        isOk = (minTime <= momentAt && momentAt < maxTime);

        if (!isOk) {
            minTime = minTime.add(-2, 'd');
            maxTime = maxTime.add(-2, 'd');
            isOk = (minTime <= momentAt && momentAt < maxTime);
        }
    }

    return isOk;

}

ParkingPricing.prototype.calcPrice = function (pricing, minuteQty) {

    var result = Number.MAX_VALUE;

    var config = this.PriceList[pricing.index];

    var blockQty = Math.ceil(minuteQty / config.UOM);

    var prices = config.prices.filter(p => p.from <= blockQty && blockQty <= p.to);
    if (prices.length > 0) {
        result = prices[0].adjust;
        result += ((blockQty - prices[0].from + 1) * prices[0].unitprice);
    }

    return result;
}

ParkingPricing.prototype.getMinPricing = function (minute) {

    var minValue = Number.MAX_VALUE;
    var minPricing = null;

    for (var j = 0; j < minute.priceList.length; j++) {
        var pricing = minute.priceList[j];

        if (pricing.isValid && pricing.value < minValue) {
            minPricing = pricing;
            minValue = pricing.value;
        }
    }
    return minPricing;
}

ParkingPricing.prototype.validatePricings = function (minute) {

    var minValue = Number.MAX_VALUE;

    for (var v = 0; v < minute.priceList.length; v++) {
        var pricing = minute.priceList[v];
        if (pricing.value > 0 && pricing.value < minValue)
            minValue = pricing.value;
    }

    for (var v = 0; v < minute.priceList.length; v++) {
        var pricing = minute.priceList[v];
        pricing.isValid = (pricing.value == minValue && minValue < Number.MAX_VALUE);
    }
}

ParkingPricing.prototype.refreshLines = function () {

    for (var i = 0; i < this.Minutes.length; i++) {
        var minute = this.Minutes[i];

        for (var j = 0; j < minute.priceList.length; j++) {
            var pricing = minute.priceList[j];
            this.refreshLine(i, pricing.index);
        }
    }

}

ParkingPricing.prototype.refreshLine = function (startMinuteIndex, pricingIndex) {

    var minute = this.Minutes[startMinuteIndex];

    var preMinute = startMinuteIndex > 0 ? this.Minutes[startMinuteIndex - 1] : null;
    if (preMinute) {

        var prePricings = preMinute.priceList.filter(c => c.index == pricingIndex);
        if (prePricings.length > 0 && prePricings[0].isValid)
            return;
    }

    var minuteQty = 0;
    var pricing = null;
    for (var z = startMinuteIndex; z < this.Minutes.length; z++) {

        var nextPricings = this.Minutes[z].priceList.filter(c => c.index == pricingIndex);

        if (nextPricings.length > 0 && nextPricings[0].isValid) {
            minuteQty++;
            if (!pricing) pricing = nextPricings[0];
        }
        else
            break;
    }


    if (!pricing) return;

    var priceAmt = this.calcPrice(pricing, minuteQty);

    for (var z = 0; z < minuteQty; z++) {

        var nextPricings = this.Minutes[startMinuteIndex + z].priceList.filter(c => c.index == pricingIndex);
        if (nextPricings.length > 0 && nextPricings[0].isValid) {
            nextPricings[0].firstIndex = startMinuteIndex;
            nextPricings[0].lastIndex = startMinuteIndex + minuteQty - 1;
            nextPricings[0].minuteQty = minuteQty;
            nextPricings[0].startAt = this.Minutes[startMinuteIndex].startTime;
            nextPricings[0].endAt = this.Minutes[nextPricings[0].lastIndex].endTime;
            nextPricings[0].lineValue = (priceAmt < Number.MAX_VALUE ? priceAmt : 0);
            nextPricings[0].value = (priceAmt < Number.MAX_VALUE ? priceAmt / minuteQty : 0);
        }
        else
            break;
    }


}