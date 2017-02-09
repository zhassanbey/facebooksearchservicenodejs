//var CicularBuffer = require("circular-buffer");
function DBConnection(config, pg){
    this.host = config.DB_HOST;
    this.port = config.DB_PORT;
    this.username = config.DB_USERNAME;
    this.password = config.DB_PASSWORD;
    var connection = "postgres://"+this.username+":"+this.password+"@"+this.host+":"+this.port+"/semantics3";
    this.pgClient = new pg.Client(connection);
}

DBConnection.prototype = {
  getBots: function(){
    var pgClient = this.pgClient;
    var result = [];
    pgClient.connect();
    var queryStr = "select *  from bots where domain='facebook.com'";
    var query = pgClient.query(queryStr);
    query.on('row', function(row){
       result.push(row);
    });
    return query.on('end', function(){
       pgClient.end();
    }).then(function(){
        return result;
    });  
  }
};

function create(config, pg){
    return new DBConnection(config, pg);
}

module.exports = {
    create:create
};