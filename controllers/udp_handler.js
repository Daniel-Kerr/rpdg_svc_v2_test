/**
 * Created by Nick on 4/19/2017.
 */

var host = "localhost";
var c_port = 41234;
var s_port = 41234;
var dgram = require("dgram");
var path = require('path');
var pad = require('pad');
var TAG = pad(path.basename(__filename),15);
var server = dgram.createSocket("udp4");


exports.init = function() {

    // client, side
// var message = new Buffer("hello");
    var message = new Buffer("3031323334353637", "hex");

/*
    client.on("message", function(msg, rinfo) {
        console.log("recieved: " + msg.toString("hex"));
        client.close();
    });


    client.on("err", function(err) {
        console.log("client error: \n" + err.stack);
        console.close();
    });

// Socket
    client.on("close", function() {
        console.log("closed.");
    });


    send(message, host, c_port);
/*
    function send(message, host, port) {
        client.send(message, 0, message.length, port, host, function(err, bytes) {
            console.log("sent.");
        });
    }
*/
    // UDP Sample Server

    server.on("listening", function() {
        var address = server.address();
        global.applogger.info(TAG, "server listening " + address.address + ":" + address.port, "");
       // console.log("server listening " + address.address + ":" + address.port);
    });

    server.on("message", function(msg, rinfo) {
        global.applogger.info(TAG, "server got a message from " + rinfo.address + ":" + rinfo.port, "");
        global.applogger.info(TAG, "  HEX  : " + msg.toString('hex'), "");
        global.applogger.info(TAG, "  ASCII: " + msg, "");
        //console.log("server got a message from " + rinfo.address + ":" + rinfo.port);
       // console.log("  HEX  : " + msg.toString('hex'));
       // console.log("  ASCII: " + msg);
        var ack = new Buffer("ack");
        server.send(ack, 0, ack.length, rinfo.port, rinfo.address, function(err, bytes) {
            //console.log("sent ACK.");
            global.applogger.info(TAG, "sent ack", "");
        });
    });

    server.on("error", function(err) {
        //console.log("server error: \n" + err.stack);
        global.applogger.info(TAG, "server error", err.stack);
        server.close();
    });


    server.on("close", function() {
       // console.log("closed.");
        global.applogger.info(TAG, "server closed", "");
    });

    server.bind(s_port);
    //console.log("udp server is setup.");
    global.applogger.info(TAG, "server setup complete and bound", "");

}


function send(message, host, port) {
    server.send(message, 0, message.length, port, host, function(err, bytes) {
        //console.log("sent.");
        global.applogger.info(TAG, "message sent", "");
    });
}
