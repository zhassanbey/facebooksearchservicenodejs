//import system libraries
var config = require('config');
var amqp = require("amqplib/callback_api");
var pg = require('pg');
var request = require("request-promise");
//import factory modules 
var clientFactory = require("./facebook_client.js");
var dbFactory = require("./db_connection.js");
var rabbitFactory = require("./rabbit.js");
//create objects from factories
var db = dbFactory.create(config, pg);
var rabbit = rabbitFactory.create(config, amqp);
var client = clientFactory.create(config, request);

var substr = function (hrefs, html, index, linkId, callback) {
    if (index >= 0) {
        var str = html.substring(index + 6, html.indexOf("\"", index + 6));
        if (str.indexOf("fbid") !== -1) {
            hrefs.push(str);
        }
        substr(hrefs, html, html.indexOf(linkId, index + 6 + str.length), linkId, callback);
    } else {
        callback();
    }
};
db.getBots().then(function (botList) {
    console.log(botList);
    rabbit.consume(function (outputChannel, msg) {
        var topic = JSON.parse(msg.content.toString());
        var keywords = topic.keywords;
        var keywordList = keywords.split(",");
        if (keywordList !== undefined && keywordList !== "") {
            console.log("keywordList " + keywordList.length + " ");
            keywordList.forEach(function (keyword) {
                var bot = botList.shift();
                botList.push(bot);
                var kw = keyword.replace(/\*/g, "");
                console.log("search for " + kw + " assigned to " + bot.username);
                var latestSearch = client.search(kw, bot.username, bot.password, "latest");
                latestSearch.then(function (latestBody) {
                    if (!latestBody.startsWith("banned")) {
                        var topSearch = client.search(kw, bot.username, bot.password, "top");
                        topSearch.then(function (topBody) {
                            var body = latestBody + topBody;
                            var linkId = "href";
                            var hrefs = [];
                            var index = body.indexOf(linkId);
                            substr(hrefs, body, index, linkId, function () {
                                console.log(keywordList.indexOf(kw) + " hrefs.length = " + hrefs.length);
                                hrefs.forEach(function (href) {
                                    console.log(hrefs.indexOf(href) + ") crawler " + href);
                                    var sendMsg = "{\"botUsername\":\"" + bot.username + "\", \"botPassword\":\"" + bot.password + "\",\"url\":\"" + href + "\"}";
                                    rabbit.publish(outputChannel, config.OUTPUT_X, config.OUTPUT_KEY, sendMsg);
                                });
                            });
                        }).catch(function (err) {
                            topSearch.end();
                        });
                    } else {
                        rabbit.publish(outputChannel, config.OUTPUT_X, config.OUTPUT_KEY, "banned "+bot.username);
                        msg.nack();
                    }
                }).catch(function (err) {
                    console.log("[err]" + err + " for keyword " + kw + " republishing..");
                    latestSearch.end();
                });
            });
        }
        return Promise.resolve(msg);
    }).catch(function (err) {
        process.exit();
    });
});