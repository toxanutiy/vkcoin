const app = require('express')(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    fs = require('fs'),
    crypto = require('crypto'),
    { stringify, parse } = require('querystring'),
    mongoose = require('mongoose'),
    db = mongoose.connection,
    { VK } = require('vk-io'),
    config = require('./config.json'),
    vk = new VK({
        token: config.app.serviceKey
    }),
    User = require('./models/User.js');

server.listen(8080);
mongoose.connect(config.db, {useCreateIndex: true, useNewUrlParser: true});

db.on('error', console.error.bind(console, 'Ошибка подключения к базе'));
db.once('open', () => {
    console.log('Подключились к базе данных');

    io.on('connection', (socket) => {
        let user = null;

        socket.on('auth', async (URL) => {
            URL = URL.substr(1);
            URL = parse(URL);

            if (checkVKQueryParamsSign(URL)) {
                user = await User.findOrCreate(vk, URL.vk_user_id);

                socket.emit('setUser', user);
            }
        });

        socket.on('setScore', async (balance) => {
            if (user !== null) {
                user.balance = parseInt(balance);

                await User.findOne({id: user.id}).update({$set: {balance: user.balance}});
            }
        });

        socket.on('buyItem', async (key) => {
            let item = user.shop[key];
            let upgrades = user.upgrades;
            let shop = user.shop;

            if (parseInt(user.balance) < parseInt(item.price)) return;

            user.balance -= parseInt(item.price);

            let searchItem = upgrades.find(x => x.name === item.name);
            let buyItem = {
                name: item.name,
                amount: 1,
                mine: item.mine
            };

            if (typeof searchItem !== "undefined") {
                buyItem = {
                    name: item.name,
                    amount: searchItem.amount + 1,
                    mine: parseFloat(searchItem.mine) + item.mine
                };
                const index = upgrades.findIndex(x => x.name === item.name);
                upgrades.splice(index, 1);
                upgrades.push(buyItem);
            } else {
                upgrades.push(buyItem);
            }

            upgrades = upgrades.reverse();

            item.price = parseInt(parseInt(item.price) * parseFloat(item.upgrade));
            shop[key] = item;

            user.upgrades = upgrades;
            user.shop = shop;
            user.auto += item.mine;

            await User.findOne({id: user.id}).update({$set: {balance: user.balance, upgrades: user.upgrades, shop: user.shop, auto: user.auto}});
            socket.emit('buysItem', user);
        });

    });
});

const isVKParam = e => e[0].startsWith('vk_');
const checkVKQueryParamsSign = params => {
    const listOfParams = Object.entries(params) //перевод в обьекта параметро в список
        .filter(isVKParam) //фильтрация параметров VK
        .sort((a, b) => {
            if (a[0] < b[0]) {
                return -1
            }
            if (a[0] > b[0]) {
                return 1
            }
            return 0
        }) //сортировка по алфавиту
    const paramsStr = stringify(
        listOfParams.reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {})
    ) //перевод параметров в строковый вид

    const hmac = crypto.createHmac('sha256', config.app.secretKey) //инициализация генератора подписи
    hmac.update(paramsStr) //добавление строки с параметрами
    const sign = hmac
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '') //генерация подписи
    return sign === params.sign //сравнение подписей
}
