// Express
const http = require('http');
const express = require('express');

// JSON 파일을 읽기 위한 FS 모듈
const fs = require('fs');

// Express 서버 생성
const app = express();
const server = http.createServer(app);

// HTML, Views, EJS
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/static'));
// post body-parser 사용
app.use(express.urlencoded({ extended: true }));
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.disable('x-powered-by');

// Mariadb
const mysql = require('mysql2/promise');
const db_auth = JSON.parse(fs.readFileSync(__dirname + '/db_auth.json'));

// DB Initialzation
const dbPool = mysql.createPool({
    host: 'localhost',
    user: db_auth.username,
    password: db_auth.password,
    database: 'kiosk',
    multipleStatements: true
});

// hostname 및 port 설정
const server_config = JSON.parse(fs.readFileSync(__dirname + '/server_config.json'));
const hostname = server_config.hostname;
const port = server_config.port;

// 서버 생성
server.listen(port, hostname, function () {
    console.log('Server is listening on port ' + port);
});

// 에러 페이지
app.get('/error', function (req, res) {
    const message = req.query.message;
    const redirect = req.query.redirect;
    res.render('alert', { message: message, redirect: redirect });
});


// API

// 주문하기 페이지
const menuData = JSON.parse(fs.readFileSync(__dirname + '/menu.json'));
app.get('/', function (req, res) {
    res.render('order', { menu: menuData });
});

// 주문 목록 페이지
app.get('/orders', function (req, res) {
    res.render('order_list');
});

// 주문하기 API
var orderNumber = 1
app.post('/api/order', async function (req, res) {
    const order = req.body.order;

    const connection = await dbPool.getConnection();

    const orderSql = 'insert into `order`(orderNumber) values (?);';
    await connection.query(orderSql, orderNumber++);

    const [currOrder] = await connection.query('select * from `order` order by orderId desc limit 1;');
    
    console.log(order);
    for (var i = 0; i < order.length; i++) {
        console.log(order[i]);
        const sql = 'insert into order_list (orderId, menu, price, amount) values (?, ?, ?, ?);';
        await connection.query(sql, [currOrder[0].orderId, order[i].menu, order[i].price, order[i].amount]);
    }

    res.send(currOrder);
});

// 주문목록 가져오기 API
app.get('/api/order', async function (req, res) {
    const connection = await dbPool.getConnection();

    const orderSql = 'select * from `order` where `date` = curdate() order by timestamp desc;';
    const [order] = await connection.query(orderSql);

    res.send(order);
});

// 주문 세부 목록 가져오기 API
app.get('/api/order/:orderId', async function (req, res) {
    const orderId = req.params.orderId;
    const connection = await dbPool.getConnection();

    const sql = 'select * from order_list where orderId = ?;';
    const [orderList] = await connection.query(sql, [orderId]);

    res.send(orderList);
});

// 주문 취소 API
app.post('/api/order/:orderId/cancel', async function (req, res) {
    const orderId = req.params.orderId;

    const connection = await dbPool.getConnection();

    const updateSql = 'update `order` set orderPlaced = ? where orderId = ?;';
    await connection.query(updateSql, false, orderId);

    res.send(true);
});