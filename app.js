/**
 * Created by Aleksandr on 20.02.2017.
 */
var config = require("./config");
var http = require('http');
var express = require('express');
var cookieSession = require("cookie-session");

var vk = new (require("./vk"))();


var app = express();
app.listen(5000, "localhost");


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


app.use(function (err, req, res, next) {
    if (err) {
        console.error(err.stack);
        res.status(500).send('Something broke!');
        res.end();
    }
});
