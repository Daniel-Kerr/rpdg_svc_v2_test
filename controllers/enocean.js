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


//var known_s = path.join(__dirname) + "/../enocean_db/knownSensors.json";
//var config = path.join(__dirname) + "/../enocean_db/enocean_config.json";

var supported = false;
var israspberrypi = (process.arch == 'arm');
var isready = false;
var comport = '/dev/ttyUSB0';
var last_rx_messages = [];
var enocean = undefined;
var Dimmer = undefined;

// if com port is present,
if(!israspberrypi && process.argv.length > 0 && data_utils.commandLineArgPresent("COM"))
{
    for(var i = 0; i < process.argv.length; i++)
    {
        var argval = process.argv[i];
        if(argval.includes("COM"))
        {
            comport = argval; //
            supported = true;
            break;// return true;
        }
    }
}
else if(israspberrypi)
{
    global.applogger.info(TAG, "checking if port is valid", "");
    var fs = require('fs');
    if (fs.existsSync(comport)) {
        global.applogger.info(TAG, "USB stick found, enabling enocean now", "");
        supported = true;
    }
}



function initDriver()
{
    // note:  construction of fdimmer needs absolute dir.  hence the path join, ..
    var known_s = path.join(__dirname) + "/../../datastore/enocean_db/knownSensors.json";
    var config = path.join(__dirname) + "/../../datastore/enocean_db/enocean_config.json";

    if(!israspberrypi) {
        enocean = require("../../crossplatform_modules/windows/node-enocean")(
            {sensorFilePath: known_s},
            {configFilePath: config},
            {timeout: 30}
        );

        Dimmer = require("../../crossplatform_modules/windows/node-enocean-dimmer");
    }
    else
    {
        enocean = require("../../crossplatform_modules/rpi/node-enocean")(
            {sensorFilePath:known_s},
            {configFilePath:config},
            {timeout:30}
        );

        Dimmer = require("../../crossplatform_modules/rpi/node-enocean-dimmer");
    }

    enocean.on("ready",function(data){
        global.applogger.info(TAG, "isReady", "  Enocean device is now Ready");
        isready = true;
    });

// ****************** Incomming data handler,  (from sensors, rockers..etc) ***************************
// ****************************************************************************************************
    enocean.on("known-data",function(data){

        storeRxMessage("known device: " + data.sensor.id);
        //  var message = {};
        if(data.sensor != undefined)
        {
            var sensor = data.sensor;
            var eep = sensor.eep;

            if(eep == 'f6-02-03')  // ROCKER SWITCH
            {
                var bla = JSON.stringify(sensor);
                var value = sensor.last[0].value;
                global.applogger.info(TAG, "@@@@@@@@ got ROCKER " +  value, "@@@@@@@@@@@@ " );

               // var idsuffix = "";
                var options = undefined;
                // double rocker support 6/20/17
                if(sensor.eepFunc.includes("2 Rocker")) {

                    if (sensor.last[0].value.includes('A'))  // if includes an 'A'
                        options = "A";
                       // idsuffix = "(A)";
                    if (sensor.last[0].value.includes('B'))  // if includes an 'A'
                        options = "B";
                       // idsuffix = "(B)";
                }

                var sensorid = sensor.id; // + idsuffix;

                if (sensor.last[0].value.includes('1') && sensor.last[0].value.includes('down')) {
                    rxhandler("enocean", "contactinput", sensorid, 1,options);  //up
                }
                else if (sensor.last[0].value.includes('0') && sensor.last[0].value.includes('down')) {
                    rxhandler("enocean", "contactinput", sensorid, 0,options);
                }
                // }
                //else {
                // Single Rocker case
                //    if (sensor.last[0].value.includes('1') && sensor.last[0].value.includes('down')) {
                //        rxhandler("enocean", "contactinput", sensor.id, 1);  //up

                //    }
                //     else if (sensor.last[0].value.includes('0')  && sensor.last[0].value.includes('down')) {
                //         rxhandler("enocean", "contactinput", sensor.id, 0);
                //     }
                // }
            }
            else if(eep == 'a5-07-01')  // OCC Sensor
            {
                for(var i = 0 ; i < data.values.length; i++)
                {
                    //extract pir status
                    var entry = data.values[i];
                    if(entry.type == "PIR Status")
                    {
                        var status = entry.value;
                        if(status == "on") {
                            global.applogger.info(TAG, "^^^^^^^ contact input value ON: " + sensor.id );
                            rxhandler("enocean", "contactinput", sensor.id, 1);  //occupancy
                        }
                        else if(status == "off") {
                            global.applogger.info(TAG, "^^^^^^ contact input value OFF: " + sensor.id );
                            rxhandler("enocean", "contactinput", sensor.id, 0);  //  //vacancy
                        }
                        break;
                    }
                }
            }
            else if(eep == 'a5-06-02')  // light sensor
            {
                if (sensor.last[0].unit != undefined && sensor.last[0].unit.includes('lux') && sensor.last[0].value != undefined)
                {
                    var voltage = convertLuxToVoltage(sensor.last[0].value);  //5/26/17  // value is in lux,  so weneed to convert.

                    rxhandler("enocean","levelinput", sensor.id, voltage);
                }

            }
            else
                global.applogger.info(TAG, "known data", "  not handled");
        }
        else
            global.applogger.info(TAG, "known data", "  not handled");

    })

// ******************************Enocean callback functions that are not used currently ******************
// *******************************************************************************************************
    enocean.on("unknown-data",function(data){
        global.applogger.info(TAG, "unknown data from enocean device id: ",data.senderId);
        storeRxMessage("unknown data from enocean device id: " + data.senderId);
    })

    enocean.on("unknown-teach-in",function(data){
        global.applogger.info(TAG, "unknown teach in  ",data);
    })

    enocean.on("learn-mode-start",function(){
        global.applogger.info(TAG, "learn mode has been started ","");
    })

    enocean.on("learn-mode-stop",function(data){
        global.applogger.info(TAG, "learn mode stopped: ",data.reason);

    })

    enocean.on("learned",function(data){
        global.applogger.info(TAG, "Device Learned: ",data);
        storeRxMessage("Device Learned: " + data);
    })

    enocean.on("forgotten",function(data){
        global.applogger.info(TAG, "Device Forgotton: ",data);
        storeRxMessage("Device Forgotton: " + data);
    })

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


function getSystemIDFromEnoceanID(enoceanid)
{
    for(var i = 0 ; i < global.currentconfig.enocean.length; i++)
    {
        if(global.currentconfig.enocean[i].enoceanid == enoceanid)
        {
            return global.currentconfig.enocean[i].systemid;
        }
    }
    return undefined;
}

var fixturemap = [];



// deque

function tranmitDequeueloop()
{
    if(transmitequeue.length > 0)
    {
        var element = transmitequeue[0];
        var dimmer = element.dimmer;
        var level = element.level;
        //   global.applogger.info(TAG, "tx deque item found ", "  ");
        dimmer.setValue(level);
        dimmer.setValue(level);

        transmitequeue.splice(0,1);  //remove index 0
    }
}

var periodictimer = undefined;
var transmitequeue = [];

module.exports = {

    init : function(callback)
    {

        global.applogger.info(TAG, "init enocean driver ", "  enocean support enabled on comport: " + comport);

        initDriver(); // 6/9/17

        rxhandler = callback;

        if(supported) {
            if(israspberrypi)
                enocean.listen(comport); //"/dev/ttyUSB0");
            else
                enocean.listen(comport); //"COM8");

        }

        if(periodictimer != undefined)
        {
            global.applogger.info(TAG, "Polling Timer cleared / stopped:",  "");
            clearInterval(periodictimer);
            periodictimer = undefined;
        }

        periodictimer = setInterval(function () {
            tranmitDequeueloop();
            //  global.applogger.info(TAG, "****** tx deque loop fired. ",  "*************");
        }, 50);


    },
    getRxMessageFifo: function()
    {
        return last_rx_messages;
    },
    setOutputToLevel :function(outputid, level, apply, options)
    {
        if(supported) {

            var k = fixturemap[outputid];

            // if its not there,
            if(fixturemap[outputid] == undefined)
            {
                var sysid = getSystemIDFromEnoceanID(outputid);
                if(sysid != undefined)
                {
                    var dimmer = new Dimmer(enocean, Number(sysid));
                    fixturemap[outputid] = dimmer;
                    global.applogger.info(TAG, "set new dimmer: ", outputid + "  sysid  " + sysid +   "  to  " + level); // + "   applied " + apply + "  opts: " + options);

                    // dimmer.setValue(level);


                    var element = {};
                    element.dimmer = dimmer;
                    element.level = level;
                    transmitequeue.push(element);
                }
            }
            else
            {
                var sysid = getSystemIDFromEnoceanID(outputid);
                global.applogger.info(TAG, "set existing dimmer: ", outputid + "  sysid  " + sysid +   "  to  " + level); // + "   applied " + apply + "  opts: " + options);

                var dimmer = fixturemap[outputid];
                // dimmer.setValue(level);

                var element = {};
                element.dimmer = dimmer;
                element.level = level;
                transmitequeue.push(element);
            }
        }
    },
    // for teaching output devices ,
    teachFixture: function (enoceanid) {   // will want to add callback,, of some kind,
        try {

            if(fixturemap[enoceanid] == undefined)
            {
                var sysid = getSystemIDFromEnoceanID(enoceanid);
                if(sysid != undefined)
                {
                    global.applogger.info(TAG, "  teachFixture","TEACHING / CREATING ENOCEAN DEVICE ID: " + enoceanid + "   system id :" + sysid);
                    var dimmer = new Dimmer(enocean, Number(sysid));
                    fixturemap[enoceanid] = dimmer;
                    dimmer.teach();
                }
            }
            else
            {
                var sysid = getSystemIDFromEnoceanID(enoceanid);
                global.applogger.info(TAG, "  teachFixture","TEACHING / CREATING ENOCEAN DEVICE ID: " + enoceanid + "   system id :" + sysid);

                var dimmer = fixturemap[enoceanid];
                dimmer.teach();
            }
            global.applogger.info(TAG, "  teachFixture","Teach command sent to hw" );
        } catch (err)
        {
            global.applogger.error(TAG, "  teachFixture :",  err);
        }
    },
    // For learning inputs (sensors, rocker switches, ..etc),
    startLearning: function () {
        try {
            global.applogger.error(TAG, "  startLearning :","");
            enocean.startLearning();
        } catch(err)
        {
            global.applogger.error(TAG, "  learning exception :",  err);
        }
    }
}
