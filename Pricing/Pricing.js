
var moment = require('moment');

function Pricing(caching) {

    this.caching = caching;
    this.InitPriceList();
};

module.exports = Pricing;

Pricing.prototype.InitPriceList = async function () {

    this.PriceList = await this.GetPriceList();

    // if (!this.PriceList) {

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

    //}
};

Pricing.prototype.SetPriceList = async function (priceList) {
    this.PriceList = priceList;
    this.caching.set("ParkingPriceList", JSON.stringify(priceList));
};

Pricing.prototype.GetPriceList = async function (key) {

    var that = this;

    return new Promise(async function (resolve, reject) {

        try {

            that.caching.get("ParkingPriceList", function (err, reply) {

                var priceList = err ? null : JSON.parse(reply);
                this.PriceList = priceList;
                resolve(priceList);
            });

        } catch (error) {

            resolve(null);
        }
    }).catch(err => {

    });
};

//MONEY TO DURATION
Pricing.prototype.GetBookingOptions = async function (createdAt, paidAmt) {

    var startAt = moment(createdAt);
    var endAt = moment(startAt);

    var results = [];
    results = await this.TryGetBookingOptions(startAt, endAt, results, paidAmt, 60);

    return results;
};

//MONEY TO DURATION
Pricing.prototype.GetSuitableBooking = async function (createdAt, paidAmt) {

    var startAt = moment(createdAt);
    var endAt = moment(startAt);

    var results = [];
    results = await this.TryGetBookingOptions(startAt, endAt, results, paidAmt, 60);
    if (results.length > 0)
        return results[results.length - 1];

    return null;
}

Pricing.prototype.TryGetBookingOptions = async function (startAt, endAt, results, paidAmt, interval) {

    do {

        endAt = endAt.add(interval, 'm');

        var booking = await this.CalculateBooking(startAt, endAt);

        if (!booking || booking.minuteQty <= 0
            || (results.length > 0 && results[results.length - 1].minuteQty == booking.minuteQty))
            return results;

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
        }

        endAt = moment.unix(booking.endAt);


    } while (booking.price <= paidAmt);

    return results;
}

//DURATION TO MONEY
Pricing.prototype.CalculateBooking = async function (startAt, endAt) {

    await this.initMinutes(startAt, endAt);

    await this.refreshLines();

    for (var i = 0; i < this.Minutes.length; i++) {
        var minute = this.Minutes[i];

        var minPricing = await this.getMinPricing(minute);
        if (minPricing && minPricing.firstIndex == i) {

            for (var z = i; z <= minPricing.lastIndex; z++) {
                var curMinute = this.Minutes[z];
                await this.validatePricings(curMinute);
            }
            await this.refreshLines();
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

        startAt: (finalStart ? finalStart.unix() : null),
        endAt: (finalEnd ? finalEnd.unix() : null),

        startAtVN: (finalStart ? moment.unix(finalStart.unix()).utcOffset(7).format("YYYY-MM-DD HH:mm:ss") : null),
        endAtVN: (finalEnd ? moment.unix(finalEnd.unix()).utcOffset(7).format("YYYY-MM-DD HH:mm:ss") : null),

        price: totalPrice
    };

};

Pricing.prototype.initMinutes = async function (startAt, endAt) {

    this.Minutes = [];

    startAt = moment(startAt).second(0);
    endAt = moment(endAt).second(0);

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

            var isValid = await this.isInRangeHours(minute.startTime, pricing.startHour, pricing.endHour);
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

Pricing.prototype.isInRangeHours = async function (objTime, startHourInday, endHourInDay) {

    var momentAt = moment(objTime).utcOffset(7);
    var minTime = moment(momentAt).utcOffset(7).hour(startHourInday).minute(0).second(0);
    var maxTime = moment(momentAt).utcOffset(7).hour(endHourInDay).minute(0).second(0);

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

Pricing.prototype.calcPrice = async function (pricing, minuteQty) {

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

Pricing.prototype.getMinPricing = async function (minute) {

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

Pricing.prototype.validatePricings = async function (minute) {

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

Pricing.prototype.refreshLines = async function () {

    for (var i = 0; i < this.Minutes.length; i++) {
        var minute = this.Minutes[i];

        for (var j = 0; j < minute.priceList.length; j++) {
            var pricing = minute.priceList[j];
            await this.refreshLine(i, pricing.index);
        }
    }

}

Pricing.prototype.refreshLine = async function (startMinuteIndex, pricingIndex) {

    var minute = this.Minutes[startMinuteIndex];

    var preMinute = startMinuteIndex > 0 ? this.Minutes[startMinuteIndex - 1] : null;
    if (preMinute) {

        var prePricings = preMinute.priceList.filter(c => c.index == pricingIndex);
        if (prePricings.length > 0 && prePricings[0].isValid)
            return;
    }

    var preMinuteQty = 0;

    // option 1
    // for (var z = 0; z < startMinuteIndex; z++) {
    //     var pricings = this.Minutes[z].priceList.filter(c => c.index == pricingIndex);
    //     if (pricings.length > 0 && pricings[0].isValid) {
    //         preMinuteQty++;
    //     }
    // }

    // option 2
    var firstIndex = -1;
    for (var z = 0; z < startMinuteIndex; z++) {
        var pricings = this.Minutes[z].priceList.filter(c => c.index == pricingIndex);
        if (pricings.length > 0 && pricings[0].isValid) {
            firstIndex = z;
            break;
        }
    }
    if (firstIndex >= 0)
        preMinuteQty = startMinuteIndex - firstIndex;


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

    var totalPrice = await this.calcPrice(pricing, preMinuteQty + minuteQty);
    var priceAmt = totalPrice;
    if (preMinuteQty > 0)
        priceAmt = priceAmt - (await this.calcPrice(pricing, preMinuteQty));

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