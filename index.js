

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var express = require('express');
var moment = require('moment');

const RedisClient = require('redis');
var caching = RedisClient.createClient("6379", "localhost");

var Supervisor = require("./Supervisor");
var supervisor = new Supervisor(caching);

var Pricing = require("./Pricing");
var pricing = new Pricing(caching);

var Booking = require("./Booking");
var booking = new Booking(caching, pricing);

const server = express();
server.use(bodyParser.urlencoded({ extended: false }))
server.use(bodyParser.json());
server.set('view engine', 'ejs');
server.listen(3000);

server.get('/note', function (req, res) {

    var notices = [
        { note: "(*) 30 PHÚT PHẢI XEM LẠI TRANG NÀY ! " },
        { note: "(*) Khách hàng chủ động lựa chọn phương thức thanh toán mà họ muốn." },
        { note: "(*) Vé tháng : Hợp đồng ký xong mới được nhập vào máy tính bảng" },
        { note: "(*) Vinaphone, Mobifone, Vietnamobile đang hoàn thiện hợp đồng" },
        { note: "(*) Ghi lại biển số xe mà khách đã thanh toán bằng tiền mặt." },
        { note: "(*) Không chi trả bất cứ khỏan phí nào cho các trật tự viên" },
        { note: "(*) Gọi về hotline bên dưới ngay khi có sự chống đối hoặc cản trở của các bên" }
    ];

    var steps = [
        { note: "Chủ động phát tờ rơi cho khách hàng" },
        { note: "Giới thiệu iParking được áp dụng theo quyết định của UBND TP Hà Nội" },
        { note: "Giới thiệu các phương thức thanh toán của iParking" },
        { note: "Không dành quá nhiều thời gian để hướng dẫn khách cài đặt hoặc nhắn tin" },
        { note: "Không tranh cãi với khách hàng hoặc trật tự viên" },
        { note: "Ghi chú lại các điểm không hợp tác hoặc có vấn đề cần xử lý" },
        { note: "Hạn chế trả lời báo chí. Chỉ trả lời những gì mình chắc chắn" },
        { note: "Không chia sẽ đường link này (iparking.namtrung2212.com/note) cho trật tự viên và báo chí" }
    ];

    var veluot = [

        { note: "Thanh toán qua app : dùng thẻ quốc tế (VISA, MasterCard..) và 1 số thẻ ATM" },
        { note: "Thanh toán qua app : dùng tài khoản trả trước trên ứng dụng" },
        { note: "Thanh toán qua tin nhắn: cú pháp niêm yết trên bảng và tờ rơi" },

        { note: "Nhà mạng Viettel hoạt động tốt." },
        { note: "Vinaphone, Mobifone, Vietnamobile đang hoàn thiện hợp đồng" },

        { note: "Nạp tiền vào TK trả trước : dùng thẻ quốc tế hoặc nội đia tại trang web iparking.vn" }

    ];

    var vethang = [

        { note: "Khách hàng làm việc với cty khai thác điểm đỗ xe để làm thủ tục ký HĐ" },
        { note: "Hợp đồng được ký hoàn tất mới nhập vào máy tính bảng" },
        { note: "Khách hàng sẽ nhận được Mã Thanh Toán gửi qua tin nhắn." },
        { note: "Khách hàng dùng Mã Thanh Toán nếu thanh toán qua iparking.vn hoặc Internet Banking" },

        { note: "Thanh toán qua app : dùng thẻ quốc tế (VISA, MasterCard..) và 1 số thẻ ATM" },
        { note: "Thanh toán qua app : dùng tài khoản trả trước trên ứng dụng" },
        { note: "Thanh toán qua iparking.vn : dùng thẻ quốc tế (VISA, MasterCard..) và 1 số thẻ ATM" },
        { note: "Thanh toán qua Internet Banking : dùng thẻ quốc tế (VISA, MasterCard..) và 1 số thẻ ATM" },

        { note: "Nạp tiền vào TK trả trước : dùng thẻ quốc tế hoặc nội đia tại trang web iparking.vn" }

    ];

    var infos = [
        { note: "Tăng giá theo bậc thang là quyết định của UBND TP Hà Nội, iParking chỉ là hệ thống phần mềm quản lý." },
        { note: "Thanh toán bằng tiền mặt thì sẽ được ghi nhận vào hệ thống => minh bạch thu ngân sách" }
    ];


    var contacts = [
        { note: "Phụ trách chung : a Vinh (0949200690)" },
        { note: "Quận Hoàn Kiếm, Ba Đình : a Long (0978977486)" },
        { note: "Quận Hai Bà Trưng, Đống Đa : a Trung (0905798117)" },
        { note: "Nghiệp vụ : chị Kim (0989898476) hoặc a Trung" },
        { note: "Kỹ thuật công ty HPC : a Đạt (0983271819), a Hiếu (0975126124)" }
    ];

    var forFG = {
        notices: notices,
        steps: steps,
        veluot: veluot,
        vethang: vethang,
        infos: infos,
        contacts: contacts
    };

    res.render('note', forFG);

});

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



server.get('/supervisor/notices', async function (req, res) {
    var notices = await supervisor.GetNotices();
    res.json(notices);
});

server.post('/supervisor/notices', async function (req, res) {

    var notices = req.body;

    await supervisor.SetNotices(notices);

    notices = await supervisor.GetNotices();
    res.json(notices);

});