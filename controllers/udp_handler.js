/**
 * Created by Nick on 4/19/2017.
 */
var host = "localhost";
var dgram = require("dgram");
var path = require('path');
var pad = require('pad');
var ip = require('ip');
var TAG = pad(path.basename(__filename),15);
var server = undefined;
var serverisready = false;
var rxhandler = undefined;
var isSender = false;
var local_ip_address= undefined;

var MULTICAST_ADDR = '239.255.255.250';
var SRC_PORT = 6025;

//var PORT = 6024;
//var client = dgram.createSocket('udp4');

module.exports = {

    init: function (callback, sender) {

        try {
            rxhandler = callback;

            isSender = sender;

            server = dgram.createSocket("udp4");


            local_ip_address = ip.address();

            server.on("listening", function () {
                var address = server.address();
                global.applogger.info(TAG, "UDP server listening " + address.address + ":" + address.port, "");
            });

            server.on("message", function (msg, rinfo) {

                if (rinfo.address == local_ip_address) {
                     global.applogger.info(TAG, "Rx handler, ignored, from me", "");
                    return;
                }
                else
                    global.applogger.info(TAG, "SERVER Rx from: " + rinfo.address + ":" + rinfo.port, "");

                // for later
                 var msgobj = JSON.parse(msg);
                 rxhandler(msgobj);
            });

            server.on("error", function (err) {

                global.applogger.info(TAG, "server error", err.stack);
                server.close();
            });

            server.on("close", function () {
                global.applogger.info(TAG, "server closed", "");
            });

            server.bind(SRC_PORT, function () {
                server.addMembership(MULTICAST_ADDR); // added on 6/15

            });


            // note client setu pwas here.

            global.applogger.info(TAG, "server setup complete and bound", "");
            serverisready = true;

            if (isSender)
                initSenderLoop();

        } catch (ex1) {
            global.applogger.error(TAG, "exception setting up udp server/client", ex1);
        }
    },

    cleanup: function () {
        try {
            console.log(" UDP Server cleanup start ");
            if (client != undefined) {
                client.close();
            }

            if (server != undefined) {
                server.close();
            }
        } catch (ex1) {
            global.applogger.error(TAG, "exception closing dgram sockets", ex1);
        }
    },

    transmitData : function(data)
    {
        global.applogger.info(TAG, "sending data", "");
        var message = new Buffer(data);
        server.send(message, 0, message.length, SRC_PORT, MULTICAST_ADDR, function () {



        });
    }

} // end of exports.


//var transmitqueue = [];


function initSenderLoop() {

  /*  global.applogger.info(TAG, "****** Init of sender loop now ******", "");

    setInterval(function () {

        // global.applogger.info(TAG, "send timer fired", "");
        if (serverisready) {

            if(transmitqueue.length > 0) {

                var data = transmitqueue[0];

                transmitqueue.splice(0,1);  ///remove index 0 ,

                var message = new Buffer(data);
                // var message = new Buffer("Multicast message!");
                // server.send(message, 0, message.length, PORT, MULTICAST_ADDR, function () {
                server.send(message, 0, message.length, SRC_PORT, MULTICAST_ADDR, function () {

                    // var address = server.address();
                    //  global.applogger.info(TAG, "sent message  ", address.address +  " " +  SRC_PORT);

                    //global.applogger.info(TAG, "multi-cast message sent", message + "'"  + "on port: " +SRC_PORT);
                });
            }

        }
    }, 8000);  */

}


/*       client.on('listening', function () {
 var address = client.address();
 global.applogger.info(TAG, 'UDP Client listening on ' + address.address + ":" + address.port, "");
 });

 client.on('message', function (message, rinfo) {

 // if (rinfo.address == local_ip_address) {  // ignore message this local node sends out.
 // global.applogger.info(TAG, "Rx handler, ignored, from me", "");
 //    return;
 //}
 global.applogger.info(TAG, "CLIENT Rx from: " + rinfo.address + ":" + rinfo.port, " msg: " + message);
 //console.log('Message from: ' + rinfo.address + ':' + rinfo.port + ' - ' + message);
 });

 client.bind(PORT, function () {
 client.addMembership(MULTICAST_ADDR);
 });

 */