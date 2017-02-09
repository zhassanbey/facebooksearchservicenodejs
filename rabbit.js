function Rabbit(config, amqp) {
    this.amqp = amqp;
    this.config = config;
    this.username = config.RABBIT_USERNAME;
    this.pass = config.RABBIT_PASSWORD;
    this.host = config.RABBIT_HOST;
    this.port = config.RABBIT_PORT;
    this.prefetchCount = config.PREFETCH_COUNT;
    this.inputQueue = config.INPUT_Q;
}

Rabbit.prototype = {
    publish: function (outputChannel, exchange, routingKey, message) {
        outputChannel.publish(exchange, routingKey, new Buffer(message), 'utf8');
    },
    consume: function (process) {
        var inputQueue = this.inputQueue;
        var prefetchCount = this.prefetchCount;
        var url = "amqp://" + this.username + ":" + this.pass + "@" + this.host + ":" + this.port;
        console.log(url);
        this.amqp.connect(url, function (err, conn) {
            conn.createChannel(function (err, inputChannel) {
                inputChannel.prefetch(prefetchCount);
                console.log("created input channel");
                conn.createChannel(function (err, outputChannel) {
                    console.log("created output channel");
                    console.log("consuming "+inputQueue);
                    inputChannel.consume(inputQueue, function (msg) {
                        process(outputChannel, msg).then(function (msg) {
                            inputChannel.ack(msg);
                        });
                    }, {noAck: false});
                });
            });
        });
    }
};
function create(config, amqp){
    return new Rabbit(config, amqp);
}
module.exports = {
    create: create
};