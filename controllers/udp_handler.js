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

var serverisready = false;
var rxhandler = undefined;

var isSender = false;

exports.init = function(callback) {

    rxhandler = callback;

    server.on("listening", function() {
        var address = server.address();
        server.setBroadcast(true);
        global.applogger.info(TAG, "server listening " + address.address + ":" + address.port, "");
    });

    server.on("message", function(msg, rinfo) {
        // global.applogger.info(TAG, "server got a message from " + rinfo.address + ":" + rinfo.port, "");
        // global.applogger.info(TAG, "  HEX  : " + msg.toString('hex'), "");
        global.applogger.info(TAG, "RX: " + msg, "");

        var msgobj = JSON.parse(msg);
        rxhandler(msgobj);

        // var ack = new Buffer("ack");
        //server.send(ack, 0, ack.length, rinfo.port, rinfo.address, function(err, bytes) {
        //console.log("sent ACK.");
        //    global.applogger.info(TAG, "sent ack", "");
        // });
    });

    server.on("error", function(err) {

        global.applogger.info(TAG, "server error", err.stack);
        server.close();
    });

    server.on("close", function() {
        global.applogger.info(TAG, "server closed", "");
    });

    server.bind(s_port);
    global.applogger.info(TAG, "server setup complete and bound", "");
    serverisready = true;
}


function send(message, host) {
    server.send(message, 0, message.length, s_port, host, function(err, bytes) {
        global.applogger.info(TAG, "message sent", "");
    });
}

if(isSender) {
    setInterval(function () {

       // global.applogger.info(TAG, "send timer fired", "");
        if (serverisready) {

            var element = {};
            element.group = "nickgroup";
            element.action = "occupancy";
            var out = JSON.stringify(element);
            var message = new Buffer(out, "utf-8");
            // var message = new Buffer("3031323334353637", "hex");
            send(message, "192.168.50.255");
        }

    }, 5000);
}
