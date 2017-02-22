/**
 * Created by Aleksandr on 20.02.2017.
 */
var cool = require('cool-ascii-faces');
var config = require("./config");
var http = require('http');
var express = require('express');
var cookieSession = require("cookie-session");

var vk = new (require("./vk"))();

var port = process.env.PORT || 5000;
var app = express();



app.set('views', __dirname + "/template");
app.set('view engine', 'ejs');


app.use(cookieSession(config));

app.get('/logout', function (req, res, next) {
    req.session = null;
    res.redirect('/');
    res.end();
});

app.use(vk.authentication({
        url: '/frends',
        redirect_uri: '/oauth'
    }
));
app.get('/', function (req, res, next) {
    console.log('get /');
    if (vk.authorized) {
        res.redirect('/frends');

    } else {
        res.render('start', {
            href: '/frends'
        });

    }
    res.end();
});

app.get('/frends', function (req, res, next) {

    vk.api('friends.get', {
        user_id: vk.user_id,
        count: 5,
        order: 'random',
        fields: 'photo_100,domain'
    }, function (response) {
        if (response.error) {
            next(new Error('500'));
            return;
        }
        res.render('frends', {
            response: response.response,
            user_id: vk.user_id
        });
        res.end();
    });

});

app.get('/cool', function (request, response, next) {
    response.send(cool());
});

app.use(function (err, req, res, next) {
    if (err) {
        console.error(err.stack);
        res.status(500).send('Something broke!');
        res.end();
    }
});

app.listen(port, function () {
    console.log('Node app is running on port', port);
});