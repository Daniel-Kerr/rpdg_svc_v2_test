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

var fixturemap = {};  //keyd off id
var isready = false;

var enocean = require("node-enocean")(
    {sensorFilePath:known_s},
    {configFilePath:config},
    {timeout:30}
);

var Dimmer   = require("node-enocean-dimmer");




// ***************************FROM OLD ver ****************

enocean.on("ready",function(data){
    global.applogger.info(TAG, "isReady", "  Enocean device is now Ready");
    isready = true;
    module.exports.initFixtureList();
    // enocean.startLearning();
});

enocean.on("known-data",function(data){   // Incomming data handler,  (from sensors, rockers..etc)



    var message = {};
    //  console.log("known Data:", data)
    if(data.sensor != undefined)
    {
        var sensor = data.sensor;
        var eep = sensor.eep;
        /*
        switch(sensor.id)     // valid range is  output device are 100 - 125,  all input are 50 and up,
        {
            case '002d8f46':
                message.id = 50;   // rocker switch id start.  50-- 69
                break;
            case '002c0e0d':
                message.id = 51;
                break;
            case '002c0d1f':
                message.id = 52;
                break;
            case '018eb546':   // occ/ vac sensor start id,  70 -- 89
                message.id = 70;
                break;
            case '0193f05e':
                message.id = 71;
                break;
            case '01994c2f':  // daylight sensor.  90 - 100 ,
                message.id = 90;
                break;
            default:
                break;
        }


        if(eep == 'f6-02-03')  // ROCKER SWITCH
        {
            if( (sensor.last[0].value.includes('A1') || sensor.last[0].value.includes('B1')) && sensor.last[0].value.includes('down'))  // NOTE INversion,
                message.command = "ROCKER_UP";
            else  if((sensor.last[0].value.includes('A0') || sensor.last[0].value.includes('B0')) && sensor.last[0].value.includes('down'))
                message.command = "ROCKER_DOWN";

            if(message.command != undefined)
                parentcallback(message);
        }
         */
        if(eep == 'a5-07-01')  // OCC Sensor
        {

            //if(sensor.id == '018eb546' || sensor.id == '0193f05e')
            //{
            //console.log("known occ Data:", data)
            //parentcallback("OCC SENSOR CHANGE");
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
            if(message.command != undefined)
                parentcallback(message);
        }
       /* else if(eep == 'a5-06-02')  // light sensor
        {
            //if(sensor.id == '01994c2f') {
            if (sensor.last[0].unit != undefined && sensor.last[0].unit.includes('lux') && sensor.last[0].value != undefined)
            {
                message.command = "DAYLIGHT: " +sensor.last[0].value;
                //parentcallback("DAYLIGHT:" +  sensor.last[0].value);
            }
            // }
            if(message.command != undefined)
                parentcallback(message);
        }
        else
            console.log("known Data(not handled):", data)
            */
    }
    else
        console.log("known Data(not handled):", data)

})

enocean.on("unknown-data",function(data){
    console.log("unknown Data(raw) from: ",data.senderId);
})

enocean.on("unknown-teach-in",function(data){
    console.log("unknown teach in: ",data)
})

enocean.on("learn-mode-start",function(){
    console.log("learn mode start:  press a teach in button on a device...")
})

enocean.on("learn-mode-stop",function(data){
    console.log("learning stoped: ",data.reason)
})

enocean.on("learned",function(data){
    console.log("learned: ",data)
})

enocean.on("forgotten",function(data){
    console.log("forgotten: ",data)
})


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
        }
    },
    initFixtureList: function()
    {
        try{
            if(isready) {
                for (var i = 0; i < global.currentconfig.fixtures.length; i++) {
                    if (global.currentconfig.fixtures[i].assignment[0] >= 100) {
                        var dimmer = new Dimmer(enocean, global.currentconfig.fixtures[i].assignment[0]);
                        //   dimmer.speed = "80"
                        fixturemap[currentconfig.fixtures[i].assignment[0]] = dimmer;
                    }
                }
            }
        } catch (err)
        {
            global.applogger.error(TAG, "  initFixtureList :",  err);
        }
    },
    setFixtureToLevel: function (id, level) {
        try {
            global.applogger.info(TAG, "  setFixtureToLevel :",  id + "   " + level);
            var fixobj = fixturemap[id];
            if (fixobj != undefined) {
                fixobj.setValue(level);
            }
        } catch(err)
        {
            global.applogger.error("hal_enocean.js ", "  setFixtureToLevel :",  err);
        }
    },
    teachFixture: function (id) {   // will want to add callback,, of some kind,
        try {
            global.applogger.info(TAG, "  teachFixture","TEACHING / CREATING ENOCEAN DEVICE ID: " + id);
            var dimmer = new Dimmer(enocean, id);
            // dimmer.speed = "80"
            dimmer.teach();
            global.applogger.info(TAG, "  teachFixture","Teach command sent to hw" );
            fixturemap[id] = dimmer;
        } catch (err)
        {
            global.applogger.error(TAG, "  teachFixture :",  err);
        }
    },
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