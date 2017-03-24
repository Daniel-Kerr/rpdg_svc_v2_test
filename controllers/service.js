/**
 * Created by Nick on 2/24/2017.
 */
//var hal = require('./hal.js');
var path = require('path');
var pad = require('pad');
var moment = require('moment');
var TAG = pad(path.basename(__filename),15);

var enocean = require('./enocean.js');
var rpdg = require('./rpdg_board.js');
var InputMessage = require('../models/InputMessage.js');

var OccSensor = require('../models/OccSensor.js');
var MotionSensor = require('../models/MotionSensor.js');
var Dimmer = require('../models/Dimmer.js');
var DayLightSensor = require('../models/DayLightSensor.js');

var OnOffFixture = require('../models/OnOffFixture.js');
var DimFixture = require('../models/DimFixture.js');
var CCTFixture = require('../models/CCTFixture.js');
var RGBWFixture = require('../models/RGBWFixture.js');

var Configuration = require('../models/Configuration.js');
var FixtureParameters = require('../models/FixtureParameters.js');

var Group = require('../models/Group.js');
var ContactInput = require('../models/ContactInput.js');

var data_utils = require('../utils/data_utils.js');

var filter_utils = require('./../utils/filter_utils.js');

var schedule_mgr = require('./schedule_mgr.js');


var enocean_known_sensors = require('../enocean_db/knownSensors.json');

var daylightpollseconds = 5;     // global variable (can be set via api).
var daylightpolcount = 0;   // used for tracking of dl upddates. interval.

var schedulepollseconds = 60;
var schedulepollcount = 0;



var currentschedule_event = undefined;
var reinit_schedule_countdown = -1;
/***
 * this is where the messages from rpdg driver or the enocean hw come in ,  like (occ, vac...polling changes..etc),
 * @param interface  rpdg, / enocean
 * @param inputid
 * @param level
 * type -- level input, vs contact input,
 */
function incommingHWChangeHandler(interface, type, inputid,level)
{
    global.applogger.info(TAG, "rx handler -- interface:"+  interface + " type: " + type + "  inputid: " + inputid + "  level: " + level, "");
    // loop through inputdevices looking for device, then,
    // translate the message from a hw specific to a genreic input message pass to app layer.
    //e.g.


    if(type == "levelinput") {
        var levelinputs = global.currentconfig.levelinputs;
        for (var i = 0; i < levelinputs.length; i++) {
            // match up interface,
            var dev = levelinputs[i];
            if (dev.interface == interface) {
                if (dev.inputid == inputid) {
                    global.applogger.info(TAG, "(LEVEL INPUT) message handler found device ", dev.interface + " : " + dev.assignedname + " : at level: " + level);

                    // store value of the input device for reference.
                    dev.setvalue(level.toFixed(2));

                    if(dev.type == "dimmer")  // dimmer == wallstation.
                    {
                        // look through all devices conntect and set to level (wallstation)
                        for(var k = 0; k < global.currentconfig.fixtures.length; k++)
                        {
                            var fixobj = global.currentconfig.fixtures[k];
                            if(fixobj.isBoundToInput(dev.assignedname))
                            {
                                global.applogger.info(TAG, "(LEVEL INPUT) bound to this input", "wall station update" + fixobj.assignedname);
                                var reqobj = {};
                                reqobj.requesttype = "wallstation";
                                if(fixobj instanceof OnOffFixture || fixobj instanceof DimFixture)
                                {
                                    // the input level is 0 - 10, so mult by 10, and round to int,
                                    var targetlevel = level * 10;
                                    reqobj.level = targetlevel.toFixed(0);
                                    fixobj.setLevel(reqobj,true);
                                }
                                if(fixobj instanceof CCTFixture)
                                {
                                    // create request here iwthout a change to color temp,  tell driver to use last known,
                                    var targetlevel = level * 10;
                                    reqobj.brightness = targetlevel.toFixed(0);
                                    fixobj.setLevel(reqobj,true);
                                }
                            }
                        }
                    }
                    else if(dev.type == "daylight")  // check if input is a daylight sensor, and apply it, to global.
                    {
                        // this value will get polled via dl polling period timer,  and acted on within timer loop.
                        global.applogger.info(TAG, "(LEVEL INPUT) message handler found device ", "DAYLIGHT UPDATE");
                        //global.currentconfig.daylightlevelvolts = level.toFixed(2); //

                    }


                }
            }
        }
    }

    if(type == "contactinput") {
        var contactinputs = global.currentconfig.contactinputs;

        for (var i = 0; i < contactinputs.length; i++) {
            // match up interface,
            var dev = contactinputs[i];
            if (dev.interface == interface) {
                if (dev.inputid == inputid) {
                    global.applogger.info(TAG, "(CONTACT INPUT) message handler found device ", dev.interface + " : " + dev.assignedname + " : at level: " + level);
                    dev.setvalue(level);
                    // if type is momentary and == "active",  or maintained,  act on it,
                    if((dev.subtype == "momentary" && dev.value == 1)|| dev.subtype == "maintained" )
                    {
                        contactSwitchHandler(dev);
                        break; //done,
                    }
                }
            }
        }
    }

}


function sendMessageToGroup(groupobj, requesttype, level)
{
    for (var i = 0; i < groupobj.fixtures.length; i++) {
        var fixname = groupobj.fixtures[i];
        var fixobj = global.currentconfig.getFixtureByName(fixname);
        if (fixobj != undefined) {
            // create a reqeuest obj, pass it in
            if (fixobj instanceof OnOffFixture || fixobj instanceof DimFixture) {
                var reqobj = {};
                reqobj.name = fixobj.assignedname;
                reqobj.level = level;
                reqobj.requesttype = requesttype;
                module.exports.setFixtureLevels(reqobj,false);
            }
            else if (fixobj instanceof CCTFixture) {
                var reqobj = {};
                reqobj.name = fixobj.assignedname;
                reqobj.brightness = level;
                reqobj.requesttype = requesttype;
                module.exports.setFixtureLevels(reqobj,false);
            }
            else if (fixobj instanceof RGBWFixture) {
                var reqobj = {};
                reqobj.name = fixobj.assignedname;
                reqobj.white = level;
                reqobj.requesttype = requesttype;
                module.exports.setFixtureLevels(reqobj,false);
            }
        }
    }
    module.exports.latchOutputValuesToHardware();
}





function contactSwitchHandler(contactdef)
{
    // this is really for maintained.......hold state,
    var value = contactdef.value;
    try {

        // ACTIVE STATE
        if (value == 1 && contactdef.active_action != undefined && contactdef.active_action != "noaction") {
            if (contactdef.active_action.includes("scene_")) {
                var scenename = contactdef.active_action.substring(6);
                global.applogger.info(TAG, "CONTACT INPUT HANDLER", "   invoke scene: " +scenename);
                module.exports.invokeScene(scenename, "wetdrycontact");
            }
            else if (contactdef.active_action.includes("occ_msg_")) {  // send occ message.
                var groupname = contactdef.active_action.substring(11);
                global.applogger.info(TAG, "CONTACT INPUT HANDLER", "   sending occ to group: " +groupname);
                module.exports.sendOccupancyMessageToGroup(groupname);
            }
            else if (contactdef.active_action.includes("vac_msg_")) {  // send vac message.
                var groupname = contactdef.active_action.substring(11);
                global.applogger.info(TAG, "CONTACT INPUT HANDLER", "   sending vac to group: " +groupname);
                module.exports.sendVacancyMessageToGroup(groupname);
            }
        }
        else if (value == 0 && contactdef.inactive_action != undefined && contactdef.inactive_action != "noaction") {  // INACTIVE STATE
            if (contactdef.inactive_action.includes("scene_")) {
                var scenename = contactdef.inactive_action.substring(6);
                global.applogger.info(TAG, "CONTACT INPUT HANDLER", "   invoke scene: " +scenename);
                module.exports.invokeScene(scenename, "wetdrycontact");
            }
            else if (contactdef.inactive_action.includes("occ_msg_")) {  // send occ message.
                var groupname = contactdef.inactive_action.substring(11);
                global.applogger.info(TAG, "CONTACT INPUT HANDLER", "   sending occ to group: " +groupname);
                module.exports.sendOccupancyMessageToGroup(groupname);
            }
            else if (contactdef.inactive_action.includes("vac_msg_")) {  // send vac message.
                var groupname = contactdef.inactive_action.substring(11);
                global.applogger.info(TAG, "CONTACT INPUT HANDLER", "   sending vac to group: " +groupname);
                module.exports.sendVacancyMessageToGroup(groupname);
            }
        }
    }
    catch(err)
    {
        global.applogger.error("rpdg_driver.js ", "contactSwitchHandler :",  err);
    }
}



function invokeAllToLevel(level, requesttype)
{
    for (var i = 0; i < global.currentconfig.fixtures.length; i++) {
        var fixobj = global.currentconfig.fixtures[i];
        if (fixobj != undefined) {
            // create a reqeuest obj, pass it in
            if (fixobj instanceof OnOffFixture || fixobj instanceof DimFixture) {
                var reqobj = {};
                reqobj.name = fixobj.assignedname;
                reqobj.level = level;
                reqobj.requesttype = requesttype;
                module.exports.setFixtureLevels(reqobj,true);
            }
            else if (fixobj instanceof CCTFixture) {
                var reqobj = {};
                reqobj.name = fixobj.assignedname;
                reqobj.brightness = level;
                reqobj.colortemp = 3500;
                reqobj.requesttype = requesttype;
                module.exports.setFixtureLevels(reqobj,true);
            }
            else if (fixobj instanceof RGBWFixture) {
                var reqobj = {};
                reqobj.name = fixobj.assignedname;
                reqobj.red = level;
                reqobj.green = level;
                reqobj.blue = level;
                reqobj.white = level;
                reqobj.requesttype = requesttype;
                module.exports.setFixtureLevels(reqobj,true);
            }

        }
    }
}


var service = module.exports =  {


    initService : function () {

        global.applogger.info(TAG, " --init---", "");
        enocean.init(incommingHWChangeHandler);
        rpdg.init(incommingHWChangeHandler);

        var cfg = data_utils.getConfigFromFile();
        var active_cfg = new Configuration(cfg);

        active_cfg.initHWInterfaces(rpdg,enocean);
        global.currentconfig = active_cfg;

        //setup the 0-10 v drive values for current config,
        module.exports.updateRPDGInputDrive();


        schedule_mgr.initManager();
        // test code
        // module.exports.getEnoceanKnownContactInputs();

    },

    setupHWInterface : function(fixturename)
    {
        var fix = global.currentconfig.getFixtureByName(fixturename);
        if(fix != undefined)
        {
            if(fix.interfacename == "enocean")
                fix.interface = enocean;
            else
                fix.interface = rpdg;
        }
    },

    startPolling : function() {

        var BasePollingPeriod = 1000;        // Time interval in mSec that we do the most frequent checks.
        periodictimer = setInterval(function () {


            // *********************************************RPDG PWM CURRENT DRAW POLLING*********************************
            // poll for pwm output power.(RPDG PWM ONLY)
            var power_watts = rpdg.getPWMPower(); // should be 8 doubles... to be inserted into fixture table,
            for(var i = 0; i < global.currentconfig.fixtures.length; i++) {
                var fixobj = global.currentconfig.fixtures[i];
                if(fixobj.interfacename == "rpdg-pwm") {
                    if (fixobj instanceof OnOffFixture || fixobj instanceof DimFixture) {

                        var power = power_watts[Number(fixobj.outputid) - 1];
                        fixobj.powerwatts = Number(power).toFixed(2);
                        // global.applogger.info(TAG, "polling", "updated power on device: " + fixobj.assignedname + "   " + power);

                    }
                    else if (fixobj instanceof CCTFixture) {
                        var powerwarm = power_watts[Number(fixobj.outputid) - 1];
                        var powercool = power_watts[Number(fixobj.outputid)];
                        fixobj.powerwatts = Number(Number(powerwarm) + Number(powercool)).toFixed(2);
                        //  global.applogger.info(TAG, "polling", "updated power on device: " + fixobj.assignedname + "   " + power);
                    }
                }
            }

            // **************************************************** END PWM POLLING**********************************

            // DAYLIGHT POLLING******************************************************************************************
            // poll check the current daylight sensor input,
            // ********************************************************************************************************
            daylightpolcount++;
            var DaylightPollingPeriod = Math.round ((daylightpollseconds * 1000) / BasePollingPeriod);
            if (DaylightPollingPeriod > 0 && daylightpolcount >= DaylightPollingPeriod) {
                daylightpolcount = 0;
                global.applogger.info(TAG, "DAYLIGHT POLL CHECK", "");
                // get the dl sensor
                //var dlsensor = undefined; //global.currentconfig.getDayLightSensor();

                // get each of the daylight sensors, in the config.
                for(var levelidx = 0; levelidx < global.currentconfig.levelinputs.length; levelidx++ ) {
                    var inputobj = global.currentconfig.levelinputs[levelidx];
                    if (inputobj.type == "daylight") {
                        //if (dlsensor != undefined) {
                        var now = moment();
                        var currenthour = now.hour();
                        if (global.virtualbasetime != undefined) {
                            var deltams = now - global.virtualtimeset;
                            var virtualclocktime = global.virtualbasetime.add(deltams, 'ms');
                            currenthour = virtualclocktime.hour();
                        }

                        if (currenthour >= 8 && currenthour <= 17) {     // only run the daylight sensor between the hours of 8am and 5pm

                            var level = inputobj.value;
                            // look through all fixtures connected to DL sensor.  and set to level (wallstation)
                            for (var k = 0; k < global.currentconfig.fixtures.length; k++) {
                                var fixobj = global.currentconfig.fixtures[k];
                                if (fixobj.isBoundToInput(inputobj.assignedname)) {
                                    global.applogger.info(TAG, "(DAYLIGHT INPUT) bound", "daylight update" + fixobj.assignedname);
                                    var reqobj = {};
                                    reqobj.requesttype = "daylight";
                                    if (fixobj instanceof OnOffFixture || fixobj instanceof DimFixture) {
                                        // the input level is 0 - 10, so mult by 10, and round to int,
                                        var targetlevel = level * 10;
                                        reqobj.level = targetlevel.toFixed(0);
                                        fixobj.setLevel(reqobj, true);
                                    }
                                    if (fixobj instanceof CCTFixture) {
                                        // create request here iwthout a change to color temp,  tell driver to use last known,
                                        var targetlevel = level * 10;
                                        reqobj.brightness = targetlevel.toFixed(0);
                                        fixobj.setLevel(reqobj, true);
                                    }
                                    if (fixobj instanceof RGBWFixture) {
                                        // create request here iwthout a change to color temp,  tell driver to use last known,
                                        var targetlevel = level * 10;
                                        reqobj.white = targetlevel.toFixed(0);
                                        fixobj.setLevel(reqobj, true);
                                    }
                                }
                            }
                        }
                        // }
                    }  // end if daylight type.
                }
            }
            // ****************************************END DL POLLING ******************************************


            // 3/17/17/    Schedule manage polling,*******************************************************************
            //********************************************************************************************************
            if(reinit_schedule_countdown >= 0)
            {
                reinit_schedule_countdown--;
                if(reinit_schedule_countdown < 0)
                {
                    global.applogger.info(TAG, "---- Schedule Re init----", "");
                    schedule_mgr.initManager();
                    currentschedule_event = undefined;
                }
            }


            schedulepollcount++;
            var schedulepollperiod = Math.round ((schedulepollseconds * 1000) / BasePollingPeriod);
            if (schedulepollcount >= schedulepollperiod || currentschedule_event == undefined) {  // periodic or , at start
                schedulepollcount = 0;
                var event = schedule_mgr.getCurrentEvent();
                if (event != undefined) {
                    if (currentschedule_event == undefined || event.title != currentschedule_event.title) {
                        global.applogger.info(TAG, "Sched Event INVOKE -- : ", event.type + "   " + event.title + "   " + event.start);
                        currentschedule_event = event;
                        module.exports.invokeScene(event.title, "wallstation");
                    }
                }
            }

            // ******************************************** END SCHEDULE POLLING ***************************************
            // *********************************************************************************************************



        }, BasePollingPeriod);
    },

    setGroupToBrightnessLevel : function (groupname, level)
    {
        if(groupname != undefined)
        {
            var groupobj = global.currentconfig.getGroupByName(groupname);
            if(groupobj != undefined && groupobj.type == "brightness") {
                sendMessageToGroup(groupobj,"wallstation",level);
            }
        }
    },

    setGroupToColorTemp :  function (groupname, colortemp, brightness)
    {
        if(groupname != undefined )
        {
            var groupobj = global.currentconfig.getGroupByName(groupname);
            if(groupobj != undefined && groupobj.type == "ctemp") {
                for (var i = 0; i < groupobj.fixtures.length; i++) {
                    var fixname = groupobj.fixtures[i];
                    var fixobj = global.currentconfig.getFixtureByName(fixname);
                    if (fixobj != undefined) {
                        // create a reqeuest obj, pass it in
                        if (fixobj instanceof CCTFixture) {
                            var reqobj = {};
                            reqobj.name = fixobj.assignedname;
                            reqobj.colortemp = colortemp;
                            reqobj.brightness = brightness;
                            reqobj.requesttype = "wallstation";
                            module.exports.setFixtureLevels(reqobj,false);
                        }
                    }
                }
                module.exports.latchOutputValuesToHardware();
            }
        }
    },

    setMultipleFixtureLevels : function (requestobj)
    {
        if(requestobj != undefined)
        {
            var fixturesetlist = requestobj; //this should be an array
            var updatehw = false;
            for(var i = 0; i < fixturesetlist.length; i++)
            {
                var fixturelevelsetobj = fixturesetlist[i];
                this.setFixtureLevels(fixturelevelsetobj,false);
                updatehw = true;
            }
        }

        if(updatehw)
            module.exports.latchOutputValuesToHardware();


    },
    /***
     *
     * @param requestobj-- json obj contains everything, uid..etc, uid, requesttype,
     * @returns {Uint8Array}
     */
    setFixtureLevels : function (requestobj, applytohw)
    {
        global.applogger.info(TAG, "set fixture levels " ,JSON.stringify(requestobj));
        if(requestobj != undefined) {
            if(requestobj.name != undefined) {
                var fix = global.currentconfig.getFixtureByName(requestobj.name);
                if(fix != undefined) {
                    global.applogger.info(TAG, "found fixture wil ltry  to set level", "");
                    fix.setLevel(requestobj, applytohw);
                }
            }
        }
    },
    invokeScene : function(name, requesttype) {

        if(name == "ALL_ON")
        {
            invokeAllToLevel(100,requesttype);
            return;
        }
        if(name == "ALL_OFF")
        {
            invokeAllToLevel(0,requesttype);
            return;
        }
        if(name == "ALL_50")
        {
            invokeAllToLevel(50,requesttype);
            return;
        }



        var sceneobj = global.currentconfig.getSceneByName(name);



        // var requesttype = "wallstation";
        if(sceneobj == undefined)
        {
            global.applogger.info(TAG, "cant invoke scene: " + name ,"");
            return;
        }
        // ... todo   add hold set hw ,  until after we are done setting levels,  (levels only )
        for (var i = 0; i < sceneobj.fixtures.length; i++) {
            var scenefix = sceneobj.fixtures[i];
            // rewrite,  get fixobj from master list,
            var fixobj = global.currentconfig.getFixtureByName(scenefix.name);
            if (fixobj != undefined) {
                // create a reqeuest obj, pass it in
                if (fixobj instanceof OnOffFixture || fixobj instanceof DimFixture) {
                    var reqobj = {};
                    reqobj.name = fixobj.assignedname;
                    reqobj.level = scenefix.level;
                    reqobj.requesttype = requesttype;
                    module.exports.setFixtureLevels(reqobj,true);
                }
                else if (fixobj instanceof CCTFixture) {
                    var reqobj = {};
                    reqobj.name = fixobj.assignedname;
                    reqobj.brightness = scenefix.brightness;
                    reqobj.colortemp = scenefix.colortemp;
                    reqobj.requesttype = requesttype;
                    module.exports.setFixtureLevels(reqobj,true);
                }
                else if (fixobj instanceof RGBWFixture) {
                    var reqobj = {};
                    reqobj.name = fixobj.assignedname;
                    reqobj.red = scenefix.red;
                    reqobj.green = scenefix.green;
                    reqobj.blue = scenefix.blue;
                    reqobj.white = scenefix.white;
                    reqobj.requesttype = requesttype;
                    module.exports.setFixtureLevels(reqobj,true);
                }

            }
        }
    },

    latchOutputValuesToHardware : function ()
    {
        rpdg.latchOutputLevelsToHW();
    },

    // **********************************************************TEST HARNESS APIS ***********************************
    // ***************************************************************************************************************

    // this handles all level / contact inputs.
    testSetInputLevelVolts : function (interface, type, inputid, level)
    {
        incommingHWChangeHandler(interface, type, inputid,level);
    },
    sendOccupancyMessageToGroup : function (groupname)
    {
        var groupobj = global.currentconfig.getGroupByName(groupname);
        if(groupobj != undefined)
        {
            sendMessageToGroup(groupobj, "occupancy", 100); // default value for occ is 100, but will use params
        }
    },
    sendVacancyMessageToGroup : function (groupname)
    {
        var groupobj = global.currentconfig.getGroupByName(groupname);
        if(groupobj != undefined)
        {
            sendMessageToGroup(groupobj, "vacancy", 0); // default value for vacc is 0, but will use params
        }
    },
    setDayLightPollingPeriodSeconds : function(intervalsec) {
        daylightpollseconds = intervalsec;
        daylightpolcount = 0;
    },
    reinitScheduleMgr : function()
    {
        reinit_schedule_countdown = 2;

    },
    enableRPDGHardwarePolling : function(enable)
    {
        global.applogger.error("rpdg_driver.js ", "enable rpdg polling : " + enable,  "");
        rpdg.enableHardwarePolling(enable);
    },
    // ******************************************ENOCEAN SUPPORT **********************************************
    // ********************************************************************************************************
    teachEnoceanDevice : function(enoceanid)
    {
        try {
            enocean.teachFixture(enoceanid);

            //var package = this.getStatus2();
            //var dataset = JSON.stringify(package, null, 2);
            // return dataset;
        } catch (err)
        {
            global.applogger.error("rpdg_driver.js ", "teachEnoceanDevice :",  err);
        }
    },
    startEnoceanLearning : function()
    {
        try {
            enocean.startLearning();
        } catch (err)
        {
            global.log.error("rpdg_driver.js ", "teachEnoceanDevice :",  err);
        }
    },

    updateRPDGInputDrive : function()
    {
        var inputdrives = new Float32Array(4);
        for (var i = 0; i < global.currentconfig.levelinputs.length; i++) {
            var input = global.currentconfig.levelinputs[i];
            if (input.interface == "rpdg") {
                var index = Number(input.inputid) - 1;
                inputdrives[index] = Number(input.drivelevel);
            }
        }
        rpdg.setZero2TenDrive(inputdrives);
    },
    getEnoceanKnownContactInputs : function()    // contacts are occ and rocker switches
    {
        var contactinputs = [];
        // refresh
        enocean_known_sensors = require('../enocean_db/knownSensors.json');

        for(var key in enocean_known_sensors)
        {
            var device = enocean_known_sensors[key];
            if(device.eepFunc.includes("Occupancy") || device.eepFunc.includes("Rocker Switch"))
            {
                contactinputs.push(key);
            }
        }
        return contactinputs;
    },
    getEnoceanKnownLevelInputs : function()    // level is light sensors.
    {
        var levelinputs = [];
        // refresh
        enocean_known_sensors = require('../enocean_db/knownSensors.json');
        for(var key in enocean_known_sensors)
        {
            var device = enocean_known_sensors[key];
            if(device.eepFunc.includes("Light Sensors"))
            {
                levelinputs.push(key);
            }
        }
        return levelinputs;
    },
    getEnoceanKnownOutputDevices : function()
    {
        var outputdevs = [];
        for(var i = 0; i < global.currentconfig.enocean.length; i++)
        {
            var dev = global.currentconfig.enocean[i];
            outputdevs.push(dev.enoceanid);
        }
        return outputdevs;
    },
    testmode_SetConfig : function(cfg)
    {
        var active_cfg = new Configuration(cfg);
        active_cfg.initHWInterfaces(rpdg,enocean);
        global.currentconfig = active_cfg;
        //setup the 0-10 v drive values for current config,
        module.exports.updateRPDGInputDrive();
    },
    setRPDGPWMOutput : function(output, level)
    {
        rpdg.setOutputToLevel(output, level,false, undefined);
    }
    ,
    setRPDGPLCOutput : function(output, level)
    {
        rpdg.setOutputToLevel(output, level,false, "plc");
    }

    //testZero2TenVoltDriver : function()
    // {
    //     setHW_ConfigureZero2TenDrive();
    // },
    //testDimmerEdgeConfig : function()
    // {
    // setDimmerEdgeConfig();
    // }

};
