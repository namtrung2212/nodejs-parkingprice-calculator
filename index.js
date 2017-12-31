

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

    var prepares = [
        { note: "Tập trung tại điểm đỗ HK030 đối diện khách sạn Metropole, sát vườn hoa Diên Hồng" },
        { note: "Nghe phổ biến triển khai, được phân công điểm đỗ, nhận tờ rơi + áo + mẫu báo cáo" },
        { note: "Quay về điểm đỗ mình phụ trách buổi sáng (từ 9AM đến 12AM)" },
        { note: "Điểm buổi chiều (từ 1.30pm đến 4.30pm)" }
    ];

    var steps = [
        { note: "Chủ động phát tờ rơi cho khách hàng" },
        { note: "Giới thiệu iParking được áp dụng theo quyết định của UBND TP Hà Nội" },
        { note: "Giới thiệu các phương thức thanh toán của iParking" },
        { note: "Không dành quá nhiều thời gian để hướng dẫn khách cài đặt hoặc nhắn tin" },
        { note: "Không tranh cãi với khách hàng hoặc trật tự viên" },
        { note: "Ghi chú lại các điểm không hợp tác hoặc có vấn đề cần xử lý" },
        { note: "Hạn chế trả lời báo chí. Chỉ trả lời những gì mình chắc chắn" }
    ];

    var paymentMethods = [

        { note: "Thanh toán bằng app (sử dụng thẻ VISA, MasterCard..) và 1 số thẻ ATM" },
        { note: "Nạp tiền vào tài khoản trả trước để sử dụng dần trên ứng dụng" },

        { note: "Thanh toán bằng cú pháp tin nhắn" },
        { note: "Nhà mạng Viettel hoạt động tốt. Vinaphone, Mobifone, Vietnamobile đang hoàn thiện hợp đồng" },

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

    var plans = [
        {
            name: "HÀ THỊ THÙY DINH",
            morning: "HK024 : số 18-22 Ngô Quyền",
            afternoon: "HK025 : số 34-74 Ngô Quyền",

        },
        {
            name: "HOÀNG THU THỦY",
            morning: "HK041 : số 2-4 Cổ Tân (cạnh vườn hoa)",
            afternoon: "HK027 : số 3-20 Lý Thái Tổ",

        },
        {
            name: "HÀ THỊ HỒNG",
            morning: "HK030 : sát vườn hoa Diên Hồng, đối diện khách sạn Metropol",
            afternoon: "HK034 : số 6-26 Nhà Thờ",

        },
        {
            name: "ĐỖ THỊ MỸ HẢI",
            morning: "DD002 : Văn Miếu (từ Nguyễn Thái Học đến Nguyễn Khuyến)",
            afternoon: "HK035 : Hỏa Lò (Sát tường rào Viện kiểm sát)",

        },
        {
            name: "HOÀNG THỊ THU HÀ",
            morning: "HK051 : số 18 - 22 Ngô Quyền",
            afternoon: "HK051 : số 10-108 Hàng Trống",

        },
        {
            name: "NGÔ THỊ HỒNG DUYÊN",
            morning: "BD003 : Trần Huy Liệu (đối diện khách sạn Hà Nội)",
            afternoon: "BD004 : La Thành (trước khách sạn Heritage)",

        },
        {
            name: "VŨ THỊ THANH THẢO",
            morning: "BD008 : Ngọc Hà (đầu dốc cạnh Công viên Bách Thảo)",
            afternoon: "BD008 : Ngọc Hà (đầu dốc cạnh Công viên Bách Thảo)",

        },
        {
            name: "ĐỖ THỊ PHƯƠNG LIÊN",
            morning: "BD009 : số 43-91 Giang Văn Minh ",
            afternoon: "BD009 : bên số chẵn",

        },
        {
            name: "PHẠM HỒNG TRANG",
            morning: "BD011 : Cầu Giấy (ngã ba Voi Phục-Cầu Giấy)",
            afternoon: "BD011 : Cầu Giấy (ngã ba Voi Phục-Cầu Giấy)",

        },
        {
            name: "BÙI MAI LIÊN",
            morning: "HB028 : số 38-48A Tăng Bạt Hổ",
            afternoon: "HB035 : số 58A-76 Ngô Thì Nhậm",

        },
        {
            name: "TRẦN THỊ BÍCH HƯỜNG",
            morning: "HB032 : số 8-38 Lê Đại Hành",
            afternoon: "HB033 : số 42 Lê Đại Hành",

        },
        {
            name: "LÊ HƯƠNG LY",
            morning: "HB036 : số 36-76 Nguyễn Du",
            afternoon: "HB045 : số 1-55 Lê Văn Hưu",

        },
        {
            name: "NGUYỄN THỊ HƯƠNG",
            morning: "HB038 : số 4-60 Triệu Việt Vương",
            afternoon: "HB039 : số 154-184 Triệu Việt Vương",

        },
        {
            name: "NG.T LAM GIANG",
            morning: "HB040 : Trần Nhân Tông (từ Trần Bình Trọng đến quán bia xanh)",
            afternoon: "HB041 : Trần Nhân Tông (công viên Thống Nhất, công viên Lê Nin)",

        }

    ];


    var forFG = {
        prepares: prepares,
        steps: steps,
        methods: paymentMethods,
        infos: infos,
        contacts: contacts,
        plans: plans
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