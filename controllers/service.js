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

//var OccSensor = require('../models/OccSensor.js');
//var MotionSensor = require('../models/MotionSensor.js');

//var Dimmer = require('../models/Dimmer.js');
//var DayLightSensor = require('../models/DayLightSensor.js');
var LevelInput = require('../models/LevelInput.js');

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

var PERSIST_FILE = '../datastore/persist.json';

var enocean_known_sensors = require('../enocean_db/knownSensors.json');

var SunCalc = require('suncalc');

var daylightpollseconds = 5;     // global variable (can be set via api).
var daylightpolcount = 0;   // used for tracking of dl upddates. interval.

var schedulepollseconds = 60;
var schedulepollcount = 0;

var fs = require('fs');

var currentschedule_eventbundle = undefined;
//var reinit_schedule_countdown = -1;




var dim_bright_request_map = {};

var rpdg_service_moment = undefined; // used as time reference for vairous functions 4/11/17,
// can be either real time or virtual time,  for test.

// PERSISTAT SETTINGS (not config) ,
var persistantstore = undefined;



// 4/19/17, Networking start.
var upd_handler = undefined; //require('./udp_handler.js');


var sw_version = "???";
var firmware_version = "???";



function outputAvalibleCheck(inputlist, desiredstartoutput, type)
{
    // filter out any already used outputs.
    for(var i = 0; i < global.currentconfig.fixtures.length; i++)
    {
        var fixobj = global.currentconfig.fixtures[i];

        var outstart = Number(fixobj.outputid);
        if(fixobj.type == "on_off" || fixobj.type == "dim") {
            var idx = inputlist.indexOf(String(outstart));
            if(idx > -1) {
                inputlist.splice(idx, 1);
            }
        }
        if(fixobj.type == "cct") {
            var idx = inputlist.indexOf(String(outstart));
            if(idx > -1)
            {
                inputlist.splice(idx,1);
                inputlist.splice(idx,1);  // do it 2 times,  to remove both channels,
            }
        }
        if(fixobj.type == "rgbw") {
            var idx = inputlist.indexOf(String(outstart));
            if (idx > -1) {
                inputlist.splice(idx, 1);
                inputlist.splice(idx, 1);  // do it X times,
                inputlist.splice(idx, 1);
                inputlist.splice(idx, 1);
            }
        }
    }


    // filter based on edit type,
    if(type == "cct")
    {
        var ctemp = inputlist.indexOf(String(desiredstartoutput));
        if(ctemp < 0)
            return false;

        var bright = inputlist.indexOf(String(desiredstartoutput+1));
        if(bright < 0)
            return false;

    }
    else if(type == "rgbw")
    {
        var red = inputlist.indexOf(String(desiredstartoutput));
        if(red < 0)
            return false;

        var green = inputlist.indexOf(String(desiredstartoutput+1));
        if(green < 0)
            return false;

        var blue = inputlist.indexOf(String(desiredstartoutput+2));
        if(blue < 0)
            return false;

        var white = inputlist.indexOf(String(desiredstartoutput+3));
        if(white < 0)
            return false;
    }
    else {
        var out = inputlist.indexOf(String(desiredstartoutput));
        if(out < 0)
            return false;
    }

    return true;
}



function incommingUDPMessageHandler(messageobj)
{
   // stub for now,  but will act on group / scene messages ..
    // add filter to check for group id, ..etc, and if found,,,
    global.applogger.info(TAG, "UDP rx handler got message", JSON.stringify(messageobj));
}
//
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

                    if(!dev.enabled)
                    {
                        global.applogger.info(TAG, "(LEVEL INPUT) " , dev.assignedname , "device is disabled, changed ignored ##########");
                        continue;
                    }
                    else {

                        if (dev.type == "dimmer")  // dimmer == wallstation.
                        {
                            // 4/26/17,   group action now.

                            var groupname = dev.group; //req.body.name;
                            if(groupname != undefined) {
                                var groupobj = global.currentconfig.getGroupByName(groupname);
                                if (groupobj != undefined) {
                                    if(groupobj.type == "brightness") {
                                        var targetlevel = level * 10;
                                        service.setGroupToBrightnessLevel(groupname, targetlevel);
                                    }
                                    else if(groupobj.type == "ctemp") {
                                        //scale color temp. between 2200 / 6500
                                        var scale = level / 10;
                                        var targetctemp = ((6500-2200) * scale) + 2200;
                                        service.setGroupToColorTemp(groupname,targetctemp,100);
                                    }
                                }
                            }

                            /*
                            // look through all devices conntect and set to level (wallstation)
                            for (var k = 0; k < global.currentconfig.fixtures.length; k++) {
                                var fixobj = global.currentconfig.fixtures[k];
                                if (fixobj.isBoundToInput(dev.assignedname)) {
                                    global.applogger.info(TAG, "(LEVEL INPUT) bound to this input", "wall station update" + fixobj.assignedname);
                                    var reqobj = {};
                                    reqobj.requesttype = "wallstation";
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
                                }
                            } */
                        }
                        else if (dev.type == "daylight")  // check if input is a daylight sensor, and apply it, to global.
                        {
                            // this value will get polled via dl polling period timer,  and acted on within timer loop.
                            global.applogger.info(TAG, "(LEVEL INPUT) message handler found device ", "DAYLIGHT LEVEL CHANGED");
                        }
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
                    if((dev.type == "momentary" && dev.value == 1)|| dev.type == "maintained" )
                    {
                        if(!dev.enabled)
                        {
                            global.applogger.info(TAG, "(CONTACT INPUT) " , dev.assignedname , "device is disabled, changed ignored");
                            continue;
                        }
                        else
                            contactSwitchHandler(dev);
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
    var action = "";

    if(value == 1)
        action = contactdef.active_action;
    else
        action = contactdef.inactive_action;

    if(action == undefined || action == "action_none")
        return;

    try {
        // ACTIVE STATE
        //if (value == 1 && contactdef.active_action != undefined && contactdef.active_action != "action_none") {
        var parts = action.split("_@@_");
        switch (parts[0]) {

            case "msg":
                if (parts.length == 4) {
                    var msgtype = parts[1];
                    var groupname = parts[2];
                    var delaymin = parts[3];

                    if (msgtype.includes("Occ")) {

                        global.applogger.info(TAG, "CONTACT INPUT HANDLER", "   sending occ to: " +groupname + " and cleared pending vacancy calls");
                        module.exports.sendOccupancyMessageToGroup(groupname);
                        contactdef.active_pending_vancancy = undefined;  //clear any pending,  may need to clear others?, ask joe,
                        contactdef.inactive_pending_vancancy = undefined;
                    }
                    else {
                        if(Number(delaymin) <= 0) {
                            global.applogger.info(TAG, "CONTACT INPUT HANDLER", "   sending vac to: " + groupname);
                            module.exports.sendVacancyMessageToGroup(groupname);
                        }
                        else
                        {
                            global.applogger.info(TAG, "CONTACT INPUT HANDLER", "   vacancy future message registered **************************" );

                            // var future = new moment();
                            // future.add(Number(delaymin),'minutes');
                            rpdg_service_moment.add(Number(delaymin),'minutes');
                            if(value == 1)
                                contactdef.active_pending_vancancy = rpdg_service_moment.clone(); //future;
                            else
                                contactdef.inactive_pending_vancancy = rpdg_service_moment.clone(); //future;
                        }
                    }
                }
                break;

            case "scene":
                if (parts.length == 2) {
                    var scenename = parts[1];
                    global.applogger.info(TAG, "CONTACT INPUT HANDLER", "  invoking scene: " +scenename);
                    module.exports.invokeScene(scenename, "wetdrycontact");
                }
                break;

            case "scenelist":
                if (parts.length == 4) {
                    var list = parts[1];
                    var dir = parts[2];
                    var rollover = (parts[3] == "yes")?true:false;

                    // get the list, inc the pointer ,get invoke name and invoke,
                    var sl = global.currentconfig.getSceneListByName(list);
                    if (sl != undefined) {
                        if (dir.includes("down")) {
                            global.applogger.info(TAG, "CONTACT INPUT HANDLER", "  inc scene list: " +list);
                            sl.incrementActiveIndex(rollover);

                        }
                        else {
                            global.applogger.info(TAG, "CONTACT INPUT HANDLER", "  dec scene list: " +list);
                            sl.decrementActiveIndex(rollover);
                        }

                        var targetscene = sl.getActiveSceneName();
                        if(targetscene != undefined)
                        {
                            global.applogger.info(TAG, "CONTACT INPUT HANDLER", "  invoking scene from list: " +targetscene);
                            module.exports.invokeScene(targetscene, "wetdrycontact");
                        }
                    }
                }

                break;

            default:
                break;

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
                //reqobj.colortemp = 3500;
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


// build out any misc directories,  that maybe missing,
function constructMiscDirs()
{
    if (!fs.existsSync('../datastore/object_logs/')) {
        try {
            fs.mkdirSync('../datastore/object_logs/')
        } catch (err) {
            if (err.code !== 'EEXIST') throw err
        }
    }

    if (!fs.existsSync('../datastore/object_logs/input/')) {
        try {
            fs.mkdirSync('../datastore/object_logs/input/')
        } catch (err) {
            if (err.code !== 'EEXIST') throw err
        }
    }

    if (!fs.existsSync('../datastore/object_logs/output/')) {
        try {
            fs.mkdirSync('../datastore/object_logs/output/')
        } catch (err) {
            if (err.code !== 'EEXIST') throw err
        }
    }

    if (!fs.existsSync('../datastore/schedule/')) {
        try {
            fs.mkdirSync('../datastore/schedule/')
        } catch (err) {
            if (err.code !== 'EEXIST') throw err
        }
    }


    if (!fs.existsSync(PERSIST_FILE)) {
        try {
            var target = path.resolve(PERSIST_FILE);
            var blank = {};
            var output = JSON.stringify(blank, null, 4);
            fs.writeFileSync(target, output);
        } catch (err) {
            if (err.code !== 'EEXIST') throw err
        }
    }
    // setup persistant store point, (may move to global. ),
    var obj = JSON.parse(fs.readFileSync(PERSIST_FILE, 'utf8'));
    persistantstore = obj;




}



function constructPWMPolarityMask()
{
    var fixlist = global.currentconfig.fixtures;
    var mask = 0x00;
    for(var i = 0 ; i <  fixlist.length; i++)
    {
        var fix = fixlist[i];
        if(fix.interfacename == "rpdg-pwm") {
            if(fix.commonanode == true) {
                if (fix.type == "rgbw") {
                    var baseidx = fix.outputid - 1; // zero based index.
                    for (var k = baseidx; k < baseidx + 4; k++) {
                        mask |= (0x01 << k);
                    }
                }
                else if (fix.type == "cct") {
                    var baseidx = fix.outputid - 1; // zero based index.
                    for (var k = baseidx; k < baseidx + 2; k++) {
                        mask |= (0x01 << k);
                    }
                }
            }
        }
    }
    return mask;
}

var service = module.exports =  {


    initService : function () {

        constructMiscDirs();

        global.applogger.info(TAG, " --init---", "");
        enocean.init(incommingHWChangeHandler);
        rpdg.init(incommingHWChangeHandler);

        if(data_utils.commandLineArgPresent("udp"))
        {
            global.applogger.info(TAG, " Initilizing the udp handler now. ", "");
            upd_handler  = require('./udp_handler.js');
            upd_handler.init(incommingUDPMessageHandler);
        }

        var cfg = data_utils.getConfigFromFile();
        var active_cfg = undefined;
        var created = false;
        //if(cfg == undefined)
        // {
        active_cfg = new Configuration();
        if(cfg != undefined)
        {
            active_cfg.fromJson(cfg); // load from file,
        }
        else
            created = true;

        active_cfg.initHWInterfaces(rpdg,enocean);
        global.currentconfig = active_cfg;

        if(created)
            data_utils.writeConfigToFile();


        //setup the 0-10 v drive values for current config,
        module.exports.updateRPDGInputDrive();


        module.exports.updatePWMPolarity();
        //global.applogger.info(TAG, "writing pwm pol mask now", "");
       // var pwmpolmask = constructPWMPolarityMask();
       //  global.applogger.info(TAG, "PWM polarity Mask: " + pwmpolmask.toString(16), "");
       //rpdg.setPWMOutputPolarity(pwmpolmask);

        //
        schedule_mgr.initManager();
        // test code
        // module.exports.getEnoceanKnownContactInputs();


        //4/17/17/
        module.exports.invokeScene("ALL_ON","override");


        var ip = require('ip');
        global.applogger.info(TAG, "IP ADDRESS IS: " + ip.address(), "");
        //data_utils.generateFauxDataSeries();

        sw_version = data_utils.getVersionFromFile();

        var list = ["1","2","3","4","5","6","7","8"];
       var k = outputAvalibleCheck(list, "2","dim");

        var j = 0;



    },
    getVersionObject: function()
    {

        var ele = {};
        ele.controller = sw_version;
        ele.firmware = firmware_version;
        return ele;
    },
    updatePWMPolarity : function()
    {
        var pwmpolmask = constructPWMPolarityMask();
        global.applogger.info(TAG, "PWM polarity Mask: " + pwmpolmask.toString(16), "");
        rpdg.setPWMOutputPolarity(pwmpolmask);
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
        //global.applogger.info(TAG, "Polling started", "");

        var BasePollingPeriod = 1000;        // Time interval in mSec that we do the most frequent checks.
        periodictimer = setInterval(function () {

            // moved here so others can use virtual time.
            var now = moment();  // single "now " var.
            // ********************* VIRTUAL TIME ********FOR TESTING ONLY *************
            var currenthour = now.hour();

            if (global.virtualbasetime != undefined) {
                var deltams = now - global.virtualtimeset;
                global.applogger.info(TAG, "time check", deltams);
                var bla = global.virtualbasetime.clone();
                now = bla.add(deltams, 'ms');  // < ----- set now to virtual time,
                currenthour = now.hour();
            }

            rpdg_service_moment = now.clone();
            //global.applogger.info(TAG, "time check", now.toISOString()  + "   vbt: " + global.virtualbasetime);

            // END VIRTUAL TIME *********************************************************

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
                        var totalpower = (Number(powerwarm) + Number(powercool));
                        fixobj.powerwatts = totalpower.toFixed(2);

                        // global.applogger.info(TAG, "polling", "updated power on cct device: " + fixobj.assignedname + "   outid=" + fixobj.outputid + "   " + powerwarm + "  +  " + powercool + "  = " + totalpower);
                    }
                    else if (fixobj instanceof RGBWFixture) {
                        var powerred = power_watts[Number(fixobj.outputid) - 1];
                        var powergreen = power_watts[Number(fixobj.outputid)];
                        var powerblue = power_watts[Number(fixobj.outputid) + 1];
                        var powerwhite = power_watts[Number(fixobj.outputid) + 2];

                        var totalpower = (Number(powerred) + Number(powergreen) + Number(powerblue) + Number(powerwhite));
                        if(fixobj.twelvevolt)
                            totalpower /= 2;

                        fixobj.powerwatts = totalpower.toFixed(2);

                        // global.applogger.info(TAG, "polling", "updated power on cct device: " + fixobj.assignedname + "   outid=" + fixobj.outputid + "   " + powerwarm + "  +  " + powercool + "  = " + totalpower);
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
                //  global.applogger.info(TAG, "DAYLIGHT POLL CHECK", "");
                // get the dl sensor

                // get each of the daylight sensors, in the config.
                for(var levelidx = 0; levelidx < global.currentconfig.levelinputs.length; levelidx++ ) {
                    var inputobj = global.currentconfig.levelinputs[levelidx];
                    if (inputobj.type == "daylight") {

                       // 4/26/17 -- changed to group ..a
                        var level = inputobj.value;

                        var groupname = inputobj.group; //req.body.name;
                        if(groupname != undefined) {
                            var groupobj = global.currentconfig.getGroupByName(groupname);
                            if (groupobj != undefined) {

                                if(groupobj.type == "brightness") {
                                    //inverted 100 - (level*10)
                                    var targetlevel = 100- (level * 10);
                                  //  var targetlevel = level * 10;
                                    service.setGroupToBrightnessLevel(groupname, targetlevel);
                                }
                               // removed 4/27/17
                                // else if(groupobj.type == "ctemp") {
                                //    //scale color temp. between 2200 / 6500
                                //    var scale = level / 10;
                               //     var targetctemp = ((6500-2200) * scale) + 2200;
                               //     service.setGroupToColorTemp(groupname,targetctemp,100);
                               // }
                            }
                        }

                           /*
                        // look through all fixtures connected to DL sensor.  and set to level (wallstation)
                        for (var k = 0; k < global.currentconfig.fixtures.length; k++) {
                            var fixobj = global.currentconfig.fixtures[k];
                            if (fixobj.isBoundToInput(inputobj.assignedname)) {
                                global.applogger.info(TAG, "(DAYLIGHT INPUT) bound", "daylight update" + fixobj.assignedname);
                                var reqobj = {};
                                reqobj.requesttype = "daylight";

                                if (fixobj instanceof OnOffFixture || fixobj instanceof DimFixture) {
                                    //global.applogger.info(TAG, "(DAYLIGHT INPUT) bound", " fixture set level is :" + fixobj.level);
                                    fixobj.setLevel(reqobj, true);
                                }
                                if (fixobj instanceof CCTFixture) {
                                    // create request here iwthout a change to color temp,  tell driver to use last known,
                                    fixobj.setLevel(reqobj, true);
                                }
                                if (fixobj instanceof RGBWFixture) {
                                    // create request here iwthout a change to color temp,  tell driver to use last known,
                                    fixobj.setLevel(reqobj, true);
                                }
                            }
                        }*/
                        // }
                        // }
                    }  // end if daylight type.
                }
            }
            // ****************************************END DL POLLING ******************************************


            // 3/17/17/    Schedule manage polling,*******************************************************************
            //********************************************************************************************************
            if(persistantstore != undefined && persistantstore.schedulemode != undefined && persistantstore.schedulemode) {

                if (schedule_mgr.scheduleCacheReset())
                    currentschedule_eventbundle = undefined;


                schedulepollcount++;
                var schedulepollperiod = Math.round((schedulepollseconds * 1000) / BasePollingPeriod);
                if (schedulepollcount >= schedulepollperiod || currentschedule_eventbundle == undefined) {  // periodic or , at start
                    schedulepollcount = 0;
                    var eventbundle = schedule_mgr.getCurrentEvent(now);
                    if (eventbundle != undefined && eventbundle.events.length > 0) {
                        if (currentschedule_eventbundle == undefined || eventbundle.date_time.diff(currentschedule_eventbundle.date_time) != 0) {

                            global.applogger.info(TAG, "Sched Event Bunlde INVOKE Start -- : ", "", "");
                            currentschedule_eventbundle = eventbundle; // store it,

                            for (var i = 0; i < eventbundle.events.length; i++) {
                                var event = eventbundle.events[i];
                                var parts = event.text.split(":");
                                if (event.action == "scene") {
                                    if (parts.length == 2) {
                                        var scenename = parts[1].trim();
                                        global.applogger.info(TAG, "Sched Event INVOKE -- : ", scenename, "");
                                        module.exports.invokeScene(scenename, "wallstation");
                                    }
                                }

                                // for inputs, we set/ get the enabled bit on the input.
                                //for contact inputs the only type is contactinput type.
                                if (event.action == "disable") {
                                    if (parts.length == 2) {
                                        var inputname = parts[1].trim();
                                        global.applogger.info(TAG, "Sched Event --- INPUT DISABLE -- : ", inputname, "");

                                        var inputobj = global.currentconfig.getInputByName(inputname);
                                        if (inputobj != undefined)
                                            inputobj.enabled = false;


                                    }
                                    // to do , get input name, and set / clear flag.
                                }
                                else if (event.action == "enable") {
                                    if (parts.length == 2) {
                                        var inputname = parts[1].trim();
                                        global.applogger.info(TAG, "Sched Event ---- INPUT ENABLE -- : ", inputname, "");

                                        var inputobj = global.currentconfig.getInputByName(inputname);
                                        if (inputobj != undefined)
                                            inputobj.enabled = true;
                                    }
                                }

                            }
                        }
                    }
                }
            }
            // ******************************************** END SCHEDULE POLLING ***************************************
            // *********************************************************************************************************


            // 3/28/17  Polling of future vacancy messages
            var contactinputs = global.currentconfig.contactinputs;
            for (var i = 0; i < contactinputs.length; i++) {

                var dev = contactinputs[i];
                if(dev.active_pending_vancancy != undefined)
                {
                    // compare the time, if after thta time , trigger.

                    // global.applogger.info(TAG, "time compare ", dev.active_pending_vancancy + "   " + now, "");
                    if(now.isAfter(dev.active_pending_vancancy))
                    {
                        dev.active_pending_vancancy = undefined;
                        var parts = dev.active_action.split("_@@_");
                        if(parts.length == 4)
                        {
                            var groupname = parts[2];
                            global.applogger.info(TAG, "Delayed Vacancy Message ", "   sending vac to: " + groupname);
                            module.exports.sendVacancyMessageToGroup(groupname);
                        }
                    }
                }

                if(dev.inactive_pending_vancancy != undefined)
                {
                    // compare the time, if after thta time , trigger.
                    if(now.isAfter(dev.inactive_pending_vancancy))
                    {
                        dev.inactive_pending_vancancy = undefined;
                        var parts = dev.inactive_action.split("_@@_");
                        if(parts.length == 4)
                        {
                            var groupname = parts[2];
                            global.applogger.info(TAG, "Delayed Vacancy Message ", "   sending vac to: " + groupname);
                            module.exports.sendVacancyMessageToGroup(groupname);
                        }
                    }
                }

            }

            // end poll. for delayed vacancy. ************************************************************************
            // *******************************************************************************************************



            // ******************* SUN RISE *** SET CALC *****

            //  var times = SunCalc.getTimes(new Date(), Number(global.currentconfig.sitelatt), Number(global.currentconfig.sitelong));
            //  var sunriseStr = times.sunrise.getHours() + ':' + times.sunrise.getMinutes();
            //  var duskstr = times.sunsetStart.getHours() + ':' + times.sunsetStart.getMinutes();
            //  global.applogger.info(TAG, "SunRise Time: " , sunriseStr + "  ---> " + duskstr);
            // end calc,


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

                if(fixturelevelsetobj.requesttype == undefined)
                {
                    fixturelevelsetobj.requesttype = 'override';
                }
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
                    // global.applogger.info(TAG, "found fixture wil ltry  to set level", "");
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
        if(name == "ALL_10")
        {
            invokeAllToLevel(10,requesttype);
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
// ,
// reinitScheduleMgr : function()
// {
//     reinit_schedule_countdown = 2;
//     s
//
// },
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

        var active_cfg = new Configuration();
        active_cfg.fromJson(cfg);

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
    },
    incrementSceneList : function(scenelistname)
    {
        // get eh scl object,
        var sl = global.currentconfig.getSceneListByName(scenelistname);
        if(sl != undefined) {
            sl.incrementActiveIndex(true);

            var targetscene = sl.getActiveSceneName();
            if (targetscene != undefined) {
                global.applogger.info(TAG, "Override", "  invoking scene from list: " + targetscene);
                module.exports.invokeScene(targetscene, "wallstation");
            }
        }
    },
    decrementSceneList : function(scenelistname)
    {
        // get eh scl object,
        var sl = global.currentconfig.getSceneListByName(scenelistname);
        if(sl != undefined) {
            sl.decrementActiveIndex(true);
            var targetscene = sl.getActiveSceneName();
            if (targetscene != undefined) {
                global.applogger.info(TAG, "Override", "  invoking scene from list: " + targetscene);
                module.exports.invokeScene(targetscene, "wallstation");
            }
        }
    },
    setScheduleModeEnable : function(enable)
    {
        var obj = JSON.parse(fs.readFileSync(PERSIST_FILE, 'utf8'));
        if(obj.schedulemode != undefined)
        {
            if(obj.schedulemode == enable)
                return;
        }
        obj.schedulemode = enable;
        persistantstore = obj;
        var output = JSON.stringify(obj, null, 4);
        fs.writeFile(PERSIST_FILE, output, function (err) {
            if (err) {
                console.log(err);
            }
            else {

            }
        });
    },
    getPersistantStore : function()
    {
        return JSON.stringify(persistantstore, null, 4);
    },
    getEnoceanRxQue : function()
    {
        if(enocean != undefined)
            return enocean.getRxMessageFifo();
        else
        {
            var k = [];
            return k;
        }
    }
};
