/**
 * Created by Nick on 2/24/2017.
 */
var path = require('path');
var pad = require('pad');
var TAG = pad(path.basename(__filename),15);
var rxhandler = undefined;
var data_utils = require('../utils/data_utils.js');  //1/15/17,

var known_s = path.join(__dirname) + "/../enocean_db/knownSensors.json";
var config = path.join(__dirname) + "/../enocean_db/enocean_config.json";

var supported = (data_utils.commandLineArgPresent("enocean"))?true:false;
var israspberrypi = (process.arch == 'arm');

var isready = false;

var enocean = require("node-enocean")(
    {sensorFilePath:known_s},
    {configFilePath:config},
    {timeout:30}
);

var Dimmer   = require("node-enocean-dimmer");

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
                rxhandler("enocean","levelinput", sensor.id, sensor.last[0].value);  //  //vacancy
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

        global.applogger.info(TAG, "init enocean driver ", "  enocean support enabled: " + supported);
        rxhandler = callback;

        if(supported) {
            if(israspberrypi)
                enocean.listen("/dev/ttyUSB0");
            else
                enocean.listen("COM4");


            // startHWPolling();  //for debug only
        }
    },
    setOutputToLevel :function(outputid, level, apply, options)
    {
        if(supported) {
            global.applogger.info(TAG, "set output ", outputid + "  to  " + level + "   applied " + apply + "  opts: " + options);

            // if its not there,
            if(fixturemap[outputid] == undefined)
            {
                var sysid = getSystemIDFromEnoceanID(outputid);
                if(sysid != undefined)
                {
                    var dimmer = new Dimmer(enocean, Number(sysid));
                    fixturemap[outputid] = dimmer;
                    dimmer.setValue(level);
                }
            }
            else
            {
                var dimmer = fixturemap[outputid];
                dimmer.setValue(level);
            }
        }
    },
    // for teaching output devices ,
    teachFixture: function (enoceanid) {   // will want to add callback,, of some kind,
        try {
            global.applogger.info(TAG, "  teachFixture","TEACHING / CREATING ENOCEAN DEVICE ID: " + enoceanid);
            if(fixturemap[enoceanid] == undefined)
            {
                var sysid = getSystemIDFromEnoceanID(enoceanid);
                if(sysid != undefined)
                {
                    var dimmer = new Dimmer(enocean, Number(sysid));
                    fixturemap[enoceanid] = dimmer;
                    dimmer.teach();
                }
            }
            else
            {
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