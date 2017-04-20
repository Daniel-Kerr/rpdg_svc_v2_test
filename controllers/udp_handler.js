/**
 * Created by Nick on 4/19/2017.
 */

var host = "localhost";
var c_port = 41234;
var s_port = 41234;
var dgram = require("dgram");
var path = require('path');
var pad = require('pad');
var ip = require('ip');


var TAG = pad(path.basename(__filename),15);
var server = dgram.createSocket("udp4");

var serverisready = false;
var rxhandler = undefined;

var isSender = false;

var local_ip_address= undefined;

// multicast stuff
var MULTICAST_ADDR = '239.255.255.250';
var SRC_PORT = 6025;
var PORT = 6024;
var client = dgram.createSocket('udp4');

exports.init = function(callback) {

    rxhandler = callback;

    local_ip_address = ip.address();

    server.on("listening", function() {
        var address = server.address();
       // server.setBroadcast(true);
        global.applogger.info(TAG, "UDP server listening " + address.address + ":" + address.port, "");
    });

    server.on("message", function(msg, rinfo) {
         global.applogger.info(TAG, "SERVER Rx from: " + rinfo.address + ":" + rinfo.port, "");

         if(rinfo.address == local_ip_address)
         {
             global.applogger.info(TAG, "Rx handler, ignored, from me", "");
             return;
         }


        // global.applogger.info(TAG, "  HEX  : " + msg.toString('hex'), "");
        //global.applogger.info(TAG, "RX: " + msg, "");

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


    server.bind(SRC_PORT);

    // for multi-cast
    //server.bind(PORT, function () {
     //   server.addMembership(MULTICAST_ADDR);
    //});



    client.on('listening', function () {
        var address = client.address();
        global.applogger.info(TAG, 'UDP Client listening on ' + address.address + ":" + address.port,"");
    });

    client.on('message', function (message, rinfo) {
        global.applogger.info(TAG, "CLIENT Rx from: " + rinfo.address + ":" + rinfo.port, "");

        //console.log('Message from: ' + rinfo.address + ':' + rinfo.port + ' - ' + message);
    });

    client.bind(PORT, function () {
        client.addMembership(MULTICAST_ADDR);
    });


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

           // var element = {};
           // element.group = "nickgroup";
           // element.action = "occupancy";
           // var out = JSON.stringify(element);
           // var message = new Buffer(out, "utf-8");
            // var message = new Buffer("3031323334353637", "hex");
            //send(message, "192.168.50.255");

            var message = new Buffer("Multicast message!");
            server.send(message, 0, message.length, PORT, MULTICAST_ADDR, function () {
                console.log("Sent '" + message + "'");
                global.applogger.info(TAG, "multi-cast message sent", "");
            });
        }

    }, 8000);
}
