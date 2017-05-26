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
var known_s = path.join(__dirname) + "/../enocean_db/knownSensors.json";
var config = path.join(__dirname) + "/../enocean_db/enocean_config.json";

var supported = false; //(data_utils.commandLineArgPresent("enocean"))?true:false;
var israspberrypi = (process.arch == 'arm');

var isready = false;

var comport = '/dev/ttyUSB0';

// 4/18/17,  console window for encean config,

var last_rx_messages = [];


// 4/27/17 added enocean db
if (!fs.existsSync('enocean_db/')) {
    try {
        fs.mkdirSync('enocean_db/')
    } catch (err) {
        if (err.code !== 'EEXIST') throw err
    }
}


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



var enocean = undefined;
var Dimmer = undefined;


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






//var Dimmer = require("node-enocean-dimmer");

enocean.on("ready",function(data){
    global.applogger.info(TAG, "isReady", "  Enocean device is now Ready");
    isready = true;
});

// ****************** Incomming data handler,  (from sensors, rockers..etc) ***************************
// ****************************************************************************************************
enocean.on("known-data",function(data){

    //  var message = {};
    if(data.sensor != undefined)
    {
        var sensor = data.sensor;
        var eep = sensor.eep;

        if(eep == 'f6-02-03')  // ROCKER SWITCH
        {
            if ((sensor.last[0].value.includes('A1') || sensor.last[0].value.includes('B1')) && sensor.last[0].value.includes('down')) {
                rxhandler("enocean","contactinput", sensor.id, 1);  //up

            }
            else  if((sensor.last[0].value.includes('A0') || sensor.last[0].value.includes('B0')) && sensor.last[0].value.includes('down')) {
                rxhandler("enocean","contactinput", sensor.id, 0);
            }
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
                    if(status == "on")
                        rxhandler("enocean","contactinput", sensor.id, 1);  //occupancy

                    else if(status == "off")
                        rxhandler("enocean","contactinput", sensor.id, 0);  //  //vacancy
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
})

enocean.on("forgotten",function(data){
    global.applogger.info(TAG, "Device Forgotton: ",data);
})


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
    for (var dimIndex = 0; dimIndex < Zero2TenLevels.length; dimIndex++) {
        if (footcandles <= Zero2TenLevels[dimIndex][1]) {
            voltage = Zero2TenLevels[dimIndex][0];
        }
    }
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


module.exports = {

    init : function(callback)
    {

        global.applogger.info(TAG, "init enocean driver ", "  enocean support enabled on comport: " + comport);
        rxhandler = callback;

        if(supported) {
            if(israspberrypi)
                enocean.listen(comport); //"/dev/ttyUSB0");
            else
                enocean.listen(comport); //"COM8");

        }
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
                    global.applogger.info(TAG, "set new dimmer", outputid + "  sysid  " + sysid +   "  to  " + level + "   applied " + apply + "  opts: " + options);

                    dimmer.setValue(level);
                }
            }
            else
            {
                var sysid = getSystemIDFromEnoceanID(outputid);
                global.applogger.info(TAG, "set existing dimmer", outputid + "  sysid  " + sysid +   "  to  " + level + "   applied " + apply + "  opts: " + options);

                var dimmer = fixturemap[outputid];
                dimmer.setValue(level);
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



// this is just for debug,  will be async messgae from enocean...serial cb.
/*
 var tempcounter = 0;
 function startHWPolling() {


 var BasePollingPeriod = 2000000;        // Time interval in mSec that we do the most frequent checks.
 // global.applogger.info(TAG, "HW Polling Started :",  "polling timer started");
 periodictimer = setInterval(function () {

 tempcounter += 1;
 if(tempcounter % 2 == 0)
 {
 tempcounter = 0;
 rxhandler("enocean", "3543545542", 3.3);  // input numbers on rpdg board will be numbered uniquily,  (0----10, ).
 }

 // contact input
 if(tempcounter % 4 == 0)
 {
 rxhandler("enocean", "3", 1);
 }


 if(tempcounter > 100)
 tempcounter = 0;

 // global.applogger.info(TAG, "hw polling",  "timer fired");
 }, BasePollingPeriod);
 }
 */