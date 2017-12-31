

var moment = require('moment');

// var now = moment();
// //var later = now.add(1, 'h');
// // console.log(later.utcOffset(7).format("YYYY-MM-DD HH:mm"));
// // console.log(later.valueOf());


// console.log("now.hours() = " + now.hours());
// console.log("now.get('hour') = " + now.get('hour'));


var ParkingPricing = require("./ParkingPricing");
var helper = new ParkingPricing();


var startAt = moment();//.add(1, 'h');
var endAt = moment(startAt).add(4, 'h').add(33, 'm');

console.log("======================================================= ");
console.log("order : startAt = " + startAt.utcOffset(7).format("YYYY-MM-DD HH:mm:ss"));
console.log("order : endAt = " + endAt.utcOffset(7).format("YYYY-MM-DD HH:mm:ss"));
console.log(" ");

var booking = helper.CalculateBooking(startAt, endAt);
// var booking = helper.GetBookingOptions(startAt, 400000);
// console.log(JSON.stringify(booking));



console.log("booking : startAt = " + (booking.startAt != null ? booking.startAt.utcOffset(7).format("YYYY-MM-DD HH:mm:ss") : null));
console.log("booking : endAt = " + (booking.endAt != null ? booking.endAt.utcOffset(7).format("YYYY-MM-DD HH:mm:ss") : null));
console.log("booking : duration = " + Math.floor(booking.minuteQty / 60) + " hours " + (booking.minuteQty % 60) + " minutes");
console.log("booking : price = " + booking.price); console.log(" ");
