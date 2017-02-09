function Client(config, request) {
    this.config = config;
    this.request = request;
    this.host = config.FACEBOOK_SERVICE_URL;
    this.port = config.FACEBOOK_SERVICE_PORT;
    this.limit = config.PAGE_LIMIT;
    this.type = config.TYPE;
    this.timeout = config.TIMEOUT;
    this.baseUrl = "http://" + this.host + ":" + this.port;
}

Client.prototype = {
    search: function (kw, bot_username, bot_password, type) {
        var url = this.baseUrl + "/search?kw=" + kw + "&bot_username=" + bot_username + "&bot_password=" + bot_password + "&type=" + type + "&limit=" + this.limit;
        return this.request({method: 'get', url: encodeURI(url), timeout: this.timeout});
    }
};

function create(config, request) {
    return new Client(config, request);
}

module.exports = {
    create: create
};