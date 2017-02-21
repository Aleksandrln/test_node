var https = require('https');
var bodyParser = require('body-parser');
let parseJson = bodyParser.json();

function VK(options) {
    this.options = require("./config");
    options && Object.keys(options).forEach((val) = > this.options[val] = options[val]
)
    ;
    this.token = '';
    this.user_id = '';


}

VK.prototype._oauth = function (req, res, next) {
    let vkAuthenticationUrl = 'https://oauth.vk.com/authorize?client_id=' +
        this.options.vkCLientId + '&scope=' + this.options.vkRequestedScopes + '&redirect_uri=' +
        req.protocol + '://' + req.hostname + this._redirect_uri + '&display=page&response_type=code&v=5.62';
    res.redirect(vkAuthenticationUrl);
    res.end();
    /* res.writeHead(303, {Location: vkAuthenticationUrl});
     res.end();*/
};

VK.prototype._getToken = function (req, res, next) {
    let self = this;
    if (req.query.code) {
        let vkAuthenticationUrl = 'https://oauth.vk.com/access_token?client_id=' + this.options.vkCLientId + '&client_secret='
            + this.options.client_secret +
            '&redirect_uri=' + req.protocol + '://' + req.hostname + this._redirect_uri + '&code=' + req.query.code;

        https.get(vkAuthenticationUrl, (response) = > parseJson(response, response, function () {
            if (response.body.error) {
                next(new Error(response.body.status));
                self.authorized = false;
                return;
            }

            self.token = req.session.token = response.body.access_token;
            self.user_id = req.session.user_id = response.body.user_id;

            res.redirect(self._url);
            res.end();
            /* res.writeHead(303, {Location:  self._url});
             */

        })
    ).
        on('error', () = > next(new Error('404'))
    )
        ;

    }
    else {
        next(new Error('500'));
    }
};

VK.prototype.authentication = function (options) {
    let self = this; // сохраняем класс в замыкании
    self._url = options.url || oauthOptions.url;
    self._redirect_uri = options.redirect_uri || oauthOptions.redirect_uri;

    return function (req, res, next) {
        self.authorized = Boolean(self.token = req.session.token);
        self.user_id = req.session.user_id;
        if (self.authorized) {
            next();  // токен есть дальше работаем с ним.
        }
        else if (req.path == self._url) {
            self._oauth(req, res, next);
        }
        else if (req.path == self._redirect_uri) {
            self._getToken(req, res, next);
        } else {
            next();
        }
    }
};

VK.prototype.api = function (method, param, callback, next) {
    let params = [];
    let self = this;
    param.ACCESS_TOKEN = this.token;
    param.V = this.options.ver_api;

    let req = 'https://api.vk.com/method/' + method + '?' + Object.keys(param).reduce((arr, val) = > {
            arr.push(val + '=' + encodeURIComponent(param[val]));
    return arr
},
    params
    ).
    join('&');
    https.get(req, (response) = > {
        parseJson(response, response,() =
    >
    {
        let arr = [];
        response.body = response.body || {error: {code: '500', msg: 'error Json Parse'}};
        response.body.rawResponse = response;
        arr.push(response.body, callback);
        callback.apply(self, arr);
    }
    )
    ;
})
    ;
}
;

module.exports = VK;