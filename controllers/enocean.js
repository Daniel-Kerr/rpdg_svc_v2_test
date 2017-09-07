/**
 * Created by Nick on 2/24/2017.
 */
var path = require('path');
var pad = require('pad');
var moment = require('moment');
var TAG = pad(path.basename(__filename),15);
var rxhandler = undefined;
var data_utils = require('../utils/data_utils.js');  //1/15/17,
var fs = require('fs');
var supported = false;
var israspberrypi = (process.arch == 'arm');
var isready = false;
var comport = '/dev/ttyUSB0';
var last_rx_messages = [];

// new 8/11/17
var enocean_util = require('./enocean_util.js');
var SerialPort = undefined;
var iswindows = (process.platform == 'win32');

var periodictimer = undefined;  // tx que
var transmitequeue = [];
var port = undefined;
var pendingRx = [];  // Rx data fifo,
var learntimer = undefined;
var islearningmode = false;

var teachintarget = undefined;
var teachtimer = undefined;
var teachstate = 0;


var hubid = ""; //"019C415B";// this is the id of the usb hub,  variable per system,


//                 019D8FBC
if(iswindows)
    SerialPort = require("../../crossplatform_modules/windows/port/node_modules/serialport");
else {
    if (israspberrypi)
        SerialPort = require("../../crossplatform_modules/rpi/port/node_modules/serialport");
    else
        SerialPort = require("../../crossplatform_modules/linux/port/node_modules/serialport");
}

// if windows try to find port number,
if(iswindows &&  process.argv.length > 0 && data_utils.commandLineArgPresent("COM"))
{
    for(var i = 0; i < process.argv.length; i++)
    {
        var argval = process.argv[i];
        if(argval.includes("COM"))
        {
            comport = argval;
            supported = true;
            break;
        }
    }
}
else  // linux and rpi
{
    comport = '/dev/ttyUSB0';
    global.applogger.info(TAG, "checking if port is valid", "");
    var fs = require('fs');
    if (fs.existsSync(comport)) {
        global.applogger.info(TAG, "USB stick found, enabling enocean now", "");
        supported = true;
    }
}

function storeRxMessage(msg)
{
    var d = moment();
    var str = d.format('MM/DD/YYYY ' + ' HH:mm') + " " + msg;
    last_rx_messages.push(str);  // push onto end,

    if(last_rx_messages.length > 10)
        last_rx_messages.splice(0, 1);  // cut out index 0,

}


function convertLuxToVoltage(lux)
{
    // first convert lux to foot candles.
    // 1 lux = 0.092903 fc,
    var footcandles = Number(lux)* 0.092903;
    var Zero2TenLevels = [
        [0.0,50],
        [1.5,50],
        [2.3,50],
        [3.1,40],
        [4.9,40],
        [5.7,30],
        [6.1,20],
        [7.2,20],
        [8.5,10],
        [9.3,10]
    ];

    var voltage = 0.0;
    var fc = 0;
    for (var dimIndex = 0; dimIndex < Zero2TenLevels.length; dimIndex++) {
        if (footcandles <= Zero2TenLevels[dimIndex][1]) {
            voltage = Zero2TenLevels[dimIndex][0];
            fc = Zero2TenLevels[dimIndex][1];
        }
    }

    global.applogger.info(TAG, "convert:  lux value: " + lux + " to fc " + fc + "   voltage: " + voltage,"");
    return voltage;
}


function tranmitDequeueloop()
{
    if(transmitequeue.length > 0)
    {
        var element = transmitequeue[0];
        var level = element.level;
        var outputid = element.id;
        var msg = enocean_util.constructRemoteCommand(hubid, outputid, "level", level);
        var buf1 = new Buffer(msg, "hex"); // turn msg into a Buffer
        port.write(buf1);
        transmitequeue.splice(0,1);  //remove index 0
    }
}


function getHubInfo()  // read out hub info , and store as hub id ..
{
    if(port != undefined) {
        var msg = "5500010005700309";
        console.log("Hub Version info request: " + msg);
        var buf1 = new Buffer(msg, "hex"); // turn msg into a Buffer
        port.write(buf1);
    }
}
module.exports = {

    init : function(callback)
    {
        global.applogger.info(TAG, "init enocean driver ", "  enocean support enabled on comport: " + comport);

        rxhandler = callback;
        if(supported && SerialPort != undefined) {

            global.applogger.info(TAG, "init enocean driver ", " attempting to create serial port obj" );
            port = new SerialPort(comport, {
                baudRate: 57600
            });

            getHubInfo();
        }
        else
        {
            global.applogger.info(TAG, "init enocean driver ", " no valid com port ,  will not be activated" );
        }

        if(port != undefined) {
            port.on('open', function () {
                global.applogger.info(TAG, 'port has been opened ');
            });

            port.on('error', function (err) {
                global.applogger.info(TAG, 'Serial Error: ', err.message);
            })

            port.on('data', function (data) {
                //var hex = Buffer.from(data).toString('hex');
                pendingRx.push.apply(pendingRx, data);
                processPendingRx();
            });
        }


        if(periodictimer != undefined)
        {
            global.applogger.info(TAG, "Polling Timer cleared / stopped:",  "");
            clearInterval(periodictimer);
            periodictimer = undefined;
        }

        periodictimer = setInterval(function () {
            tranmitDequeueloop();
        }, 50);


    },
    getRxMessageFifo: function()
    {
        return last_rx_messages;
    },
    setOutputToLevel :function(outputid, level, apply, options)
    {
        // to do ,  use tx que. ???, to test .
        if(supported && port != undefined) {
            var element = {};
            element.id = outputid;
            element.level = level;
            transmitequeue.push(element);
           // var msg = enocean_util.constructRemoteCommand(hubid, outputid, "level", level);
           // var buf1 = new Buffer(msg, "hex"); // turn msg into a Buffer
           // port.write(buf1);
        }
    },
    // for teaching output devices ,
    teachFixture: function (enoceanid) {
        try {
            teachInOutputDevice(enoceanid);
        } catch (err)
        {
            global.applogger.error(TAG, "  teachFixture :",  err);
        }
    },
    // For learning inputs (sensors, rocker switches, ..etc),
    startLearning: function () {
        try {
            global.applogger.info(TAG, "  startLearning :","");
            storeRxMessage("learning mode started");
            if (port != undefined) {
                islearningmode = true;
                learntimer = setTimeout(function () {
                    cancelLearnMode();
                }, 15*1000);
            }
        } catch(err)
        {
            global.applogger.error(TAG, "  learning exception :",  err);
        }
    }
}




function processPendingRx()
{

   // console.log("############### --- process called" );

    var syncstart = undefined;
    for(var i = 0; i < pendingRx.length; i++)  // dig trhough all pending RX data.
    {
        if(pendingRx[i] == 0x55);
        {
            syncstart = i;
            // try to extract out the lengths,
            if(i < pendingRx.length-3) // if atleast 3 more bytes.
            {
                var data_length = (pendingRx[i+1] << 0x08) | pendingRx[i+2];
                var opt_length = pendingRx[i+3];

                // is there enough data to process entire packet.
                var total_length = 6 + data_length + opt_length + 1;
                if(pendingRx.length >= i+total_length)
                {
                    // copy packet out...
                    var end = i + total_length;
                    var packet = pendingRx.slice(i,end);
                    // remove items
                    pendingRx.splice(i,end);
                    //var hex = Buffer.from(packet).toString('hex');
                    // console.log("packet: " + hex );
                    processRxPacket(packet);


                    if(pendingRx.length > 0) {
                        i = 0; //reset proc index  9/5/17 ---
                        var hex = Buffer.from(pendingRx).toString('hex');
                        console.log("######################THERE IS STILL DATA IN THE BUFF,, try to  process  " + pendingRx.length + "   " + hex);
                    }
                    //}
                    //return;
                }
            }
        }
    }


    //var hex = Buffer.from(pendingRx).toString('hex');
    //console.log("^^^^^^^^^^^^^^ leaving process routine " +  pendingRx.length + "   " + hex);

    // console.log("no packet found");
}



function processRxPacket(packet)
{
    if(packet.length >= 4) {

        var data_length = (packet[1] << 0x08) | packet[2];
        var opt_length = packet[3];
        var total_length = 6 + data_length + opt_length + 1;
        var type = packet[4];
        if(packet.length >= total_length) {
            var dataend = 6+data_length;
            var optdata_start = dataend+1;
            var optdata_end = optdata_start+opt_length;

            var data = packet.slice(6, 6 + data_length);

            // console.log("data portion as buffer: "+ Buffer.from(data).toString('hex'));

            var senderid = "";

            // special case, (Hub info read) is a response packet
            if(data.length == 33 && packet[3] == 0 && packet[4] == 2)
            {
                   var rxhubid = packet.slice(15, 19);
                rxhubid = Buffer.from(rxhubid).toString('hex').toUpperCase();

                    var k = 0 ;
                hubid = rxhubid;
                console.log("Hub ID read out : " + hubid);
              // .. 019C415B


            }
            else if(data[0] == 0xA5)   //  4 bytes of comm,  followed by 4 bytes sender id,
            {
                var pktinfo = data.slice(1, 5);  //bytes 1:5
                var longval = enocean_util.ByteArrayToLong(pktinfo);
                var LRNbit = (longval >> 3) & 0x01; // if 0  then learn it,  if in learning mode.

                senderid = data.slice(5, 9);
                senderid = Buffer.from(senderid).toString('hex').toUpperCase();  // convert to single hex value.
                // console.log("A5 packet " + senderid + "   LRN BIT " + LRNbit);
                var device = enocean_util.isKnownInputDevice(senderid);
                if(LRNbit > 0)  // data telegram
                {
                    if (device != undefined) {
                        if (device.eep == "A5-06-02") {   // Daylight Sensorr Decode
                            var voltbyte = (longval >> 24) & 0xFF;   // 0--5.1 volts
                            var volts = ((5.1) / (255)) * (voltbyte);

                            var lux1byte = (longval >> 16) & 0xFF;   // 0 -- 510 range.(ILL2)
                            var ill2 = ((510) / (255)) * (lux1byte);

                            var lux2byte = (longval >> 8) & 0xFF;  // 0 - 1020 range  (ILL1)
                            var ill1 = ((1020) / (255)) * (lux2byte);

                            var illumsel = (longval >> 0) & 0x01;   // 0 : use ILL1,  1: use ILL2

                            var lux = "??";
                            if (illumsel == 0)
                                lux = ill1;
                            else
                                lux = ill2;

                            console.log("daylight sensor update message: (LUX) " + lux +   "supply volts: " + volts);

                            var voltage = convertLuxToVoltage(lux);  //5/26/17  // value is in lux,  so weneed to convert.
                            rxhandler("enocean","levelinput", senderid, voltage);
                        }
                        else if (device.eep == "A5-07-01") {
                            // page 36,
                            // byte 0  supply voltage  - 0..5V

                            // console.log("Raw occ buffer " +  Buffer.from(pktinfo).toString('hex').toUpperCase());

                            var voltbyte = (longval >> 24) & 0xFF;   // 0--5.1 volts  (
                            var volts = ((5) / (255)) * (voltbyte);


                            var pirstatebyte = (longval >> 8) & 0xFF;   // pir status
                            var pirstatus = (pirstatebyte <= 127) ? 0 : 1;


                            console.log("OCC Sensor Update,  Pir status is: " + pirstatus + "    supply volts: " + volts);

                            rxhandler("enocean", "contactinput", senderid, pirstatus);  // send off occ/vac to service.

                        }
                        else {
                            console.log("data telegram from unknown device: " + senderid);
                        }
                    }
                }
                else  // teach in telegram
                {
                    var type = (longval >> 26) & 0x3F;
                    var func = (longval >> 19) & 0x7F;
                    var eep = "a5-"+ enocean_util.pad(type,2) + "-" + enocean_util.pad(func,2);
                    if(device != undefined) {
                        console.log("Raw pkt info: " +  Buffer.from(pktinfo).toString('hex').toUpperCase());
                        console.log("Got Teach in Telegram(Known Device): " + senderid + "  : eep: " + eep);
                    }
                    else {
                        console.log("Raw pkt info: " +  Buffer.from(pktinfo).toString('hex').toUpperCase());
                        console.log("Got Teach in Telegram(UNKNOWN Device): " + senderid + "  : eep: " + eep);
                    }
                    if(islearningmode)
                    {
                        if(eep == "a5-06-02") // daylight sensor
                        {
                            storeRxMessage("learned device: " + senderid + "  eep:" + eep);
                            enocean_util.addInputDevice(senderid, eep);
                            cancelLearnMode();
                        }
                        else if(eep == "a5-07-01") // daylight sensor
                        {
                            storeRxMessage("learned device: " + senderid + "  eep:" + eep);
                            enocean_util.addInputDevice(senderid, eep);
                            cancelLearnMode();
                        }
                    }
                }
                // var opt_data = packet.slice(optdata_start, optdata_end);
                // var subtel = opt_data[0];
                // var dest_id = opt_data.slice(1, 4);
            }
            else if(data[0] == 0xF6)   //example from rockerf6 -02-02  (eg)
            {
                // F6 should always be Data byte |  sender (4 bytes)  | status byte
                // so length should always be 7 bytes,  with no teach in bit...,
                senderid = data.slice(2, 6);
                senderid = Buffer.from(senderid).toString('hex').toUpperCase();  // convert to single hex value.
                var device =  enocean_util.isKnownInputDevice(senderid);
                //
                var buttonaction = "";
                var buttondecode = (data[1] >> 5) & 0x03;  // bits 5-7
                var energybow = (data[1] >> 4) & 0x01;  // bits 5-7

                if(device == undefined) {

                    console.log("Got Teach in Telegram(UNKNOWN Rocker): " + senderid + "  : eep: " + eep);
                    if(islearningmode) {
                        storeRxMessage("learned device: " + senderid + "  eep:" + eep);
                        enocean_util.addInputDevice(senderid, "F6-02-02");  // hard coded, for now. , need to switch this...
                        cancelLearnMode();
                    }
                }
                else if(device != undefined) {


                    if (energybow == 0)
                        buttonaction = "released";
                    else {
                        var options = undefined;
                        var direction = undefined;
                        switch (buttondecode) {
                            case 0:
                                buttonaction = "A1 down";
                                options = "A";
                                direction = 1;
                                break;
                            case 1:
                                buttonaction = "A0 down";
                                options = "A";
                                direction = 0;
                                break;
                            case 2:
                                buttonaction = "B1 down";
                                options = "B";
                                direction = 1;
                                if(!device.isdouble)
                                {
                                    device.isdouble = true;
                                    data_utils.writeConfigToFile();
                                }
                                break;
                            case 3:
                                buttonaction = "B0 down";
                                options = "B";
                                direction = 0;
                                if(!device.isdouble)
                                {
                                    device.isdouble = true;
                                    data_utils.writeConfigToFile();
                                }
                                break;
                            default:
                                break;
                        }

                        rxhandler("enocean", "contactinput", senderid, direction,options);  //up

                    }
                    console.log("packet: Known Rocker: " + senderid + "   --- " + buttonaction);
                }
            }
            else
            {
                console.log("uknown packet type, ");
                //todo,
            }
        }
    }
}

function cancelLearnMode()
{
    if(learntimer != undefined)
    {
        clearTimeout(learntimer);
        learntimer = undefined;
    }
    islearningmode = false;
    storeRxMessage("learning mode stopped");
    global.applogger.info(TAG,"****learn mode stopped,  ",  "*************","");
}



function teachInOutputDevice(targetdev)
{
    if(teachstate != 0)
    {
        storeRxMessage("Cant start teach for: "+ targetdev + " system teaching device already.");
        return;
    }
    teachstate = 0;
    teachintarget = targetdev;
    teachtimer = setInterval(function () {
        var msg = undefined;
        switch(teachstate)
        {
            case 0: //unlock
                storeRxMessage("teach sequence started - device: " + teachintarget);
                global.applogger.error(TAG,"Teach in -- Start ");
                msg = enocean_util.constructRemoteCommand(hubid,teachintarget, "unlock");

                break;
            case 1:
                msg = enocean_util.constructRemoteCommand(hubid,teachintarget, "reset");

                break;
            case 2:
                msg = enocean_util.constructRemoteCommand(hubid,teachintarget, "unlock");

                break;
            case 3:
                msg = enocean_util.constructRemoteCommand(hubid,teachintarget, "link");

                break;
            case 4:
                msg = enocean_util.constructRemoteCommand(hubid,teachintarget, "apply");

                break;

            case 5:
                msg = enocean_util.constructRemoteCommand(hubid,teachintarget, "level", 100);
                break;
            case 6:
                // wait state
                break;
            case 7:
                msg = enocean_util.constructRemoteCommand(hubid,teachintarget, "level", 0);
                break;
            case 8:
                // wait state,
                break;
            case 9:
                msg = enocean_util.constructRemoteCommand(hubid,teachintarget, "level", 100);
                break;
            case 10:
                // wait state,
                break;
            case 11:
                msg = enocean_util.constructRemoteCommand(hubid,teachintarget, "level", 0);
                break;
            default:
                teachstate = 0;
                clearInterval(teachtimer);
                teachtimer = undefined;
               // global.applogger.error(TAG,"Teach in is now Done");
                storeRxMessage("teach sequence completed - device: " + teachintarget);
                // add item to config,
                // enocean_util.addOutputDevice(teachintarget);
                break;
        }  // end switch,

        if(msg != undefined) {
            var buf1 = new Buffer(msg, "hex"); // turn msg into a Buffer
            port.write(buf1);
        }


        teachstate++;
    }, 1000);
}
