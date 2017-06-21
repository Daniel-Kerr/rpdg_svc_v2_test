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

//var PERSIST_FILE = '../datastore/persist.json';
//var enocean_known_sensors = require('../enocean_db/knownSensors.json');

var SunCalc = require('suncalc');

var daylightpolcount = 0;   // used for tracking of dl upddates. interval.

var schedulepollseconds = 60;
var schedulepollcount = 0;

var fs = require('fs');

var currentschedule_eventbundle = undefined;

var availbilescripts = [];


var dim_bright_request_map = {};

var rpdg_service_moment = undefined; // used as time reference for vairous functions 4/11/17,
// can be either real time or virtual time,  for test.
var udp_handler = undefined;
var sw_version = "???";

var delayedHW_InitCount = 3;

var reInitSchedMgrCount = 0; // counter used to periodically reinit the sched mgr.  cache. list


var fixtureimagefilecount = 0;

var networkmap = [];  // 6/20/17  map   ip key,  name


function incommingUDPMessageHandler(messageobj)
{
    var ip = require('ip');
    // stub for now,  but will act on group / scene messages ..
    // add filter to check for group id, ..etc, and if found,,,
    global.applogger.info(TAG, "UDP rx handler got message", JSON.stringify(messageobj));

    // is it a group msg
    if(messageobj.groupname != undefined) {

        // check if group is gloal or not, only apply if global?,
        var groupobj = global.currentconfig.getGroupByName(messageobj.groupname);
        if(groupobj != undefined && groupobj.isglobal) {
            if (messageobj.type == "brightness") {
                global.applogger.info(TAG, "applying broadcasted group brightness command", "");
                module.exports.setGroupToBrightnessLevel(messageobj.groupname, messageobj.level, messageobj.requesttype, false);
            }
            else if (messageobj.type == "colortemp") {
                global.applogger.info(TAG, "applying broadcasted group color temp command", "");
                service.setGroupToColorTemp(messageobj.groupname, messageobj.colortemp, messageobj.brightness, false);
            }
        }
        // element.groupname = groupname;
        // element.colortemp = colortemp;
        // element.brightness = brightness;
        // element.requesttype = "wallstation";


        //     var element = {};
        //    element.groupname = groupname;
        //    element.level = level;
        //    element.requesttype = requesttype;
        //    element.type = "brightness";


    }
    else if(messageobj.scenename != undefined)
    {
        global.applogger.info(TAG, "applying broadcasted scene command" , "");
        var sceneobj = global.currentconfig.getSceneByName(messageobj.scenename);
        if(sceneobj != undefined && sceneobj.isglobal) {
            module.exports.invokeScene(messageobj.scenename, messageobj.requesttype, false);
        }
    }
    else if(messageobj.nodediscover != undefined)
    {
        networkmap[ip.address()] = global.currentconfig.generalsettings.nodename // update my entry.
        global.applogger.info(TAG, "Got Node Discovery Command, will dispatch my info " , "");

        if(messageobj.nodeinfo != undefined) {
            networkmap[messageobj.nodeinfo.ip] = messageobj.nodeinfo.name;
            printNetworkMap();
        }


        var element = {};
        element.nodeinfo = {};
        element.nodeinfo.ip = ip.address();
        element.nodeinfo.name = global.currentconfig.generalsettings.nodename;
        var packet = JSON.stringify(element);
        udp_handler.transmitData(packet);
    }
    else if(messageobj.nodeinfo != undefined)
    {

        networkmap[ip.address()] = global.currentconfig.generalsettings.nodename; // update my entry.
        //global.applogger.info(TAG, "Rx Node Info:  " , messageobj.nodeinfo.ip + " : "  +  messageobj.nodeinfo.name);
        networkmap[messageobj.nodeinfo.ip] = messageobj.nodeinfo.name;
        printNetworkMap();
    }

}


function printNetworkMap() {
    global.applogger.info(TAG, "Network Map " , "");
    for(var key in networkmap)
    {
        var name = networkmap[key];
        global.applogger.info(TAG, key + " : " + name , "");
    }
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
    //global.applogger.info(TAG, "rx handler -- interface:"+  interface + " type: " + type + "  inputid: " + inputid + "  level: " + level, "");
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
                                        service.setGroupToBrightnessLevel(groupname, targetlevel, "wallstation",true);
                                    }
                                    else if(groupobj.type == "ctemp") {
                                        //scale color temp. between 2200 / 6500
                                        var scale = level / 10;
                                        var targetctemp = ((6500-2200) * scale) + 2200;
                                        service.setGroupToColorTemp(groupname,targetctemp,100,true);
                                    }
                                }
                            }


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
                    module.exports.invokeScene(scenename, "wallstation",true);
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
                            module.exports.invokeScene(targetscene, "wallstation",true);
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

        // if(fixobj.interfacename == "enocean")  //6/9/17
        // {

        //  }
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
                //reqobj.colortemp = 3500;
                reqobj.requesttype = requesttype;
                module.exports.setFixtureLevels(reqobj,false);
            }
            else if (fixobj instanceof RGBWFixture) {
                var reqobj = {};
                reqobj.name = fixobj.assignedname;
                reqobj.red = level;
                reqobj.green = level;
                reqobj.blue = level;
                reqobj.white = level;
                reqobj.requesttype = requesttype;
                module.exports.setFixtureLevels(reqobj,false);
            }

        }
    }

    module.exports.latchOutputValuesToHardware();  // 6/7/17
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

    /*
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
     */

    // moved here from enocean module,  6/14/17,
    if (!fs.existsSync('../datastore/enocean_db/')) {
        try {
            fs.mkdirSync('../datastore/enocean_db/')
            try {
                var target = path.resolve("../datastore/enocean_db/knownSensors.json");
                var blank = {};
                var output = JSON.stringify(blank, null, 4);
                fs.writeFileSync(target, output);
            } catch (err) {
                if (err.code !== 'EEXIST') throw err
            }
        } catch (err) {
            if (err.code !== 'EEXIST') throw err
        }
    }

    // setup persistant store point, (may move to global. ),
    // removed 6/19/17
    // var obj = JSON.parse(fs.readFileSync(PERSIST_FILE, 'utf8'));
    // persistantstore = obj;

}


/*
 function writePersistantStore()
 {
 var output = JSON.stringify(persistantstore, null, 4);
 fs.writeFile(PERSIST_FILE, output, function (err) {
 if (err) {
 console.log(err);
 }
 else {

 }
 });
 }
 */

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



function constructHV_PhaseDimMask()
{
    var fixlist = global.currentconfig.fixtures;
    var mask = 0x00;
    for(var i = 0 ; i <  fixlist.length; i++)
    {
        var fix = fixlist[i];
        if(fix.interfacename == "rpdg-pwm") {
            //global.applogger.info(TAG, " fixture dim opts : " + fix.parameters.dimoptions, "");
            if(fix.parameters.dimoptions == "1") {
                var baseidx = fix.outputid - 1; // zero based index.
                mask |= (0x01 << baseidx);
            }
        }
    }
    return mask;
}


function constructHV_DimModeMask()
{
    var fixlist = global.currentconfig.fixtures;
    var mask = 0x00;
    for(var i = 0 ; i <  fixlist.length; i++)
    {
        var fix = fixlist[i];
        if(fix.interfacename == "rpdg-pwm") {
            if(fix.parameters.dimoptions == "0") {
                var baseidx = fix.outputid - 1; // zero based index.
                mask |= (0x01 << baseidx);
            }
        }
    }
    return mask;
}



var activescript = undefined;
function ScriptResultHandler(name, result)
{
    global.applogger.info(TAG, " Script: " + name + "  result: " + result, "");
    activescript = undefined;
}
var service = module.exports = {


    initService: function () {

        constructMiscDirs();

        global.applogger.info(TAG, " --init---", "");
        enocean.init(incommingHWChangeHandler);
        rpdg.init(incommingHWChangeHandler);

        if (data_utils.commandLineArgPresent("udp")) {
            var sender = data_utils.commandLineArgPresent("sender");
            global.applogger.info(TAG, " Initilizing the udp handler now. ", "is sender: " +sender);
            udp_handler = require('./udp_handler.js');
            udp_handler.init(incommingUDPMessageHandler, sender);
        }

        var cfg = data_utils.getConfigFromFile();
        var active_cfg = undefined;
        var created = false;
        //if(cfg == undefined)
        // {
        active_cfg = new Configuration();
        if (cfg != undefined) {
            active_cfg.fromJson(cfg); // load from file,
        }
        else
            created = true;

        active_cfg.initHWInterfaces(rpdg, enocean);
        global.currentconfig = active_cfg;

        if (created)
            data_utils.writeConfigToFile();


        //setup the 0-10 v drive values for current config,

        // 5/8/17 mvoed to timer loop on delay
        //  module.exports.updateRPDGInputDrive();
        //  module.exports.updatePWMPolarity();
        //global.applogger.info(TAG, "writing pwm pol mask now", "");
        // var pwmpolmask = constructPWMPolarityMask();
        //  global.applogger.info(TAG, "PWM polarity Mask: " + pwmpolmask.toString(16), "");
        //rpdg.setPWMOutputPolarity(pwmpolmask);

        //

        schedule_mgr.requestScheduleCacheReset(new Date());
        // schedule_mgr.initManager();
        // test code
        // module.exports.getEnoceanKnownContactInputs();


        //4/17/17/
        module.exports.invokeScene("ALL_ON", "override",false);


        var ip = require('ip');
        global.applogger.info(TAG, "IP ADDRESS IS: " + ip.address(), "");


        // ************************************************** FAUX ****************DATA ***
          //  data_utils.generateFauxDataSeries();
        // **********************************************************************************


        sw_version = data_utils.getVersionFromFile();


        //  rpdg.getRPDG_HWInfo();

        // firmware_version = rpdg.getFWVersionNumber();

        //  global.applogger.info(TAG, "FW Version from Board: " + firmware_version, "");
        //var alarmmode = require('../scripts/alarmmode.js');
        // alarmmode.run(ScriptResultHandler);

        //var bla = module.exports.getScriptNames();
        //setup scripts dir,
        var pk = path.resolve('scripts');
        try {
            fs.readdir(pk, function (err, items) {
                for (var i = 0; i < items.length; i++) {
                    availbilescripts.push(items[i]);
                }
            });
        } catch (ex1) {

        }


        if (global.currentconfig != undefined) {

            if(global.currentconfig.generalsettings == undefined)
                global.currentconfig.generalsettings = {};
            else {
                if (global.currentconfig.generalsettings.hotspotenable != undefined) {
                    if (!global.currentconfig.generalsettings.hotspotenable) {
                        global.applogger.info(TAG, "Boot - attepting to disable Hot spot ", "");
                        module.exports.enableHotspot(false);  // disable hs if not enabled.
                    }
                }
                else {
                    global.currentconfig.generalsettings.hotspotenable = true;
                    data_utils.writeConfigToFile();
                }
            }

        }


        //var k =  global.currentconfig.daylightpollsec;
        // FOR DEV DEBUG
        //  rpdg.resetTinsey();
        // ***********************************END DBBUG teensy.


        // read out fixture img.
        var fiximg = path.resolve('public/fixtureimg');
        // const dir = '../public/fixtureimg';
        fs.readdir(fiximg, function (err, files) {                    //List all files in the target directory
            if(err) {
                var k = 0;                               //Abort if error
            } else {
                fixtureimagefilecount = files.length;
            }
        })



        // debug stub.
      //  networkmap["192.168.50.200"] = "test_node_1";
      //  networkmap["192.168.50.201"] = "test_node_2";
      //  networkmap["192.168.50.202"] = "test_node_3";
      //  networkmap["192.168.50.203"] = "test_node_4";

        // 6/14/17
        // * stub for setting static ip address **********************************************
        //     module.exports.setLANIPAddress('192.168.20.202', '192.168.20.1');
        // * **********************************************************************************

    },
    getVersionObject: function () {

        var ele = {};
        ele.controller = sw_version;
        var verstring = rpdg.getBoardType() + "-";
        ele.firmware = verstring + " " + rpdg.getFWVersionNumber(); // firmware_version;
        ele.boardtype = rpdg.getBoardType();
        return ele;
    },
    updatePWMPolarity: function () {
        var mask = 0;
        if (rpdg.getBoardType() == "HV") {
            mask = constructHV_PhaseDimMask();
            global.applogger.info(TAG, "HV Phase Direction Mask: " + mask.toString(16), "");

            //5/10/17
            var dimmodemask = constructHV_DimModeMask();
            global.applogger.info(TAG, "HV Dim Mode Phase Mask: " + dimmodemask.toString(16), "");
            rpdg.setHVDimMode(dimmodemask);
        }
        else {
            mask = constructPWMPolarityMask();
            global.applogger.info(TAG, "PWM polarity Mask: " + mask.toString(16), "");
        }
        rpdg.setPWMOutputPolarity(mask);

    },
    setupHWInterface: function (fixturename) {
        var fix = global.currentconfig.getFixtureByName(fixturename);
        if (fix != undefined) {
            if (fix.interfacename == "enocean")
                fix.interface = enocean;
            else
                fix.interface = rpdg;
        }
    },

    startPolling: function () {
        //global.applogger.info(TAG, "Polling started", "");

        var BasePollingPeriod = 1000;        // Time interval in mSec that we do the most frequent checks.
        periodictimer = setInterval(function () {


            // rpdg.testToggleGPIO();  // for test only

            if (delayedHW_InitCount > 0) {
                delayedHW_InitCount--;
                if (delayedHW_InitCount <= 0) {
                    global.applogger.info(TAG, "************** executing delayed hw init **************", "");

                    module.exports.updateRPDGInputDrive();
                    //   rpdg.readWetDryContacts();
                    module.exports.updatePWMPolarity();
                }
            }

            // moved here so others can use virtual time.
            var now = moment();  // single "now " var.
            // ********************* VIRTUAL TIME ********FOR TESTING ONLY *************
            var currenthour = now.hour();

            if (global.virtualbasetime != undefined) {
                var deltams = now - global.virtualtimeset;
                //global.applogger.info(TAG, "time check", deltams);
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
            for (var i = 0; i < global.currentconfig.fixtures.length; i++) {
                var fixobj = global.currentconfig.fixtures[i];
                if (fixobj.interfacename == "rpdg-pwm") {
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
                        if (fixobj.twelvevolt)
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
            var DaylightPollingPeriod = Math.round((global.currentconfig.daylightpollsec * 1000) / BasePollingPeriod);
            if (DaylightPollingPeriod > 0 && daylightpolcount >= DaylightPollingPeriod) {
                daylightpolcount = 0;
                //  global.applogger.info(TAG, "DAYLIGHT POLL CHECK", "");
                // get the dl sensor

                // get each of the daylight sensors, in the config.
                for (var levelidx = 0; levelidx < global.currentconfig.levelinputs.length; levelidx++) {
                    var inputobj = global.currentconfig.levelinputs[levelidx];
                    if (inputobj.type == "daylight") {

                        // 4/26/17 -- changed to group ..a
                        //var level = inputobj.value;

                        var groupname = inputobj.group; //req.body.name;
                        if (groupname != undefined) {
                            var groupobj = global.currentconfig.getGroupByName(groupname);
                            if (groupobj != undefined) {
                                if (groupobj.type == "brightness") {
                                    var targetlevel = 0; // the level is irrelelevent since its a dl request type.. level * 10;
                                    service.setGroupToBrightnessLevel(groupname, targetlevel, "daylight", true);
                                }

                            }
                        }
                    }  // end if daylight type.
                }
            }
            // ****************************************END DL POLLING ******************************************


            // 3/17/17/    Schedule manage polling,*******************************************************************
            //********************************************************************************************************
            if (global.currentconfig.generalsettings.schedulemode != undefined && global.currentconfig.generalsettings.schedulemode) {

                reInitSchedMgrCount++;
                if (reInitSchedMgrCount > 120 * 60)  //for now every X hours,minutes
                {
                    global.applogger.info(TAG, "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^", "", "");
                    global.applogger.info(TAG, "^^^^^^^^^^^^^ Periodic Sched Init Call ^^^^^^^^^^^^^^^^^^", "", "");
                    global.applogger.info(TAG, "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^", "", "");
                    schedule_mgr.requestScheduleCacheReset(now.toDate());
                    reInitSchedMgrCount = 0;
                }


                if (schedule_mgr.scheduleCacheReset()) // if its just been reinitilzed,  set the current event bundle.. to null,
                    currentschedule_eventbundle = undefined;


                schedulepollcount++;
                var schedulepollperiod = Math.round((schedulepollseconds * 1000) / BasePollingPeriod);
                if (schedulepollcount >= schedulepollperiod || currentschedule_eventbundle == undefined) {  // periodic or , at start
                    schedulepollcount = 0;
                    var eventbundle = schedule_mgr.getCurrentEvent(now);
                    if (eventbundle != undefined && eventbundle.events.length > 0) {
                        if (currentschedule_eventbundle == undefined || eventbundle.date_time.diff(currentschedule_eventbundle.date_time) != 0) {

                            global.applogger.info(TAG, "**New or different Schedule Bundle Found**", eventbundle.date_time, "event count: " + eventbundle.events.length);
                            global.applogger.info(TAG, "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$", "", "virtual time is : " + (global.virtualbasetime != undefined));
                            // for debug only
                            var eventidlist = "";
                            for (var i = 0; i < eventbundle.events.length; i++) {
                                var event = eventbundle.events[i];
                                var id = event.id;
                                if (event.repeat != 'none')
                                    id = event.base_id;

                                eventidlist += id + " | ";
                            }
                            global.applogger.info(TAG, " ", "Event Bundle ID LIST: " + eventidlist, "", "");

                            currentschedule_eventbundle = eventbundle; // store it,

                            for (var i = 0; i < eventbundle.events.length; i++) {
                                var event = eventbundle.events[i];
                                var parts = event.text.split(":");
                                if (event.action == "scene") {
                                    if (parts.length == 2) {
                                        var scenename = parts[1].trim();
                                        global.applogger.info(TAG, "Sched Event INVOKE -- : ", scenename, "");
                                        module.exports.invokeScene(scenename, "wallstation",true);
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
                if (dev.active_pending_vancancy != undefined) {
                    // compare the time, if after thta time , trigger.

                    // global.applogger.info(TAG, "time compare ", dev.active_pending_vancancy + "   " + now, "");
                    if (now.isAfter(dev.active_pending_vancancy)) {
                        dev.active_pending_vancancy = undefined;
                        var parts = dev.active_action.split("_@@_");
                        if (parts.length == 4) {
                            var groupname = parts[2];
                            global.applogger.info(TAG, "Delayed Vacancy Message ", "   sending vac to: " + groupname);
                            module.exports.sendVacancyMessageToGroup(groupname);
                        }
                    }
                }

                if (dev.inactive_pending_vancancy != undefined) {
                    // compare the time, if after thta time , trigger.
                    if (now.isAfter(dev.inactive_pending_vancancy)) {
                        dev.inactive_pending_vancancy = undefined;
                        var parts = dev.inactive_action.split("_@@_");
                        if (parts.length == 4) {
                            var groupname = parts[2];
                            global.applogger.info(TAG, "Delayed Vacancy Message ", "   sending vac to: " + groupname);
                            module.exports.sendVacancyMessageToGroup(groupname);
                        }
                    }
                }

            }

            // end poll. for delayed vacancy. ************************************************************************
            // *******************************************************************************************************


            // if(led != undefined)
            //     led.writeSync(led.readSync() ^ 1); // 1 = on, 0 = off :)

            // if(button0 != undefined)
            //{
            //     var btlevel = button0.readSync();
            //    global.applogger.info(TAG, "Button 0 READ: ", btlevel ,"");
            //}


            // ******************* SUN RISE *** SET CALC *****

            //  var times = SunCalc.getTimes(new Date(), Number(global.currentconfig.sitelatt), Number(global.currentconfig.sitelong));
            //  var sunriseStr = times.sunrise.getHours() + ':' + times.sunrise.getMinutes();
            //  var duskstr = times.sunsetStart.getHours() + ':' + times.sunsetStart.getMinutes();
            //  global.applogger.info(TAG, "SunRise Time: " , sunriseStr + "  ---> " + duskstr);
            // end calc,


        }, BasePollingPeriod);
    },

    setGroupToBrightnessLevel: function (groupname, level, requesttype, broadcast) {
        if (groupname != undefined) {
            var groupobj = global.currentconfig.getGroupByName(groupname);
            if (groupobj != undefined && groupobj.type == "brightness") {
                sendMessageToGroup(groupobj, requesttype, level);

                // construct group msg.
                if(broadcast && groupobj.isglobal && udp_handler != undefined) {
                    global.applogger.info(TAG, "@@@@ ---- Broadcasting group level request out to others ", "");
                    var element = {};
                    element.groupname = groupname;
                    element.level = level;
                    element.requesttype = requesttype;
                    element.type = "brightness";
                    var packet = JSON.stringify(element);
                    udp_handler.transmitData(packet);
                }
            }
        }
    },

    setGroupToColorTemp: function (groupname, colortemp, brightness, broadcast) {
        if (groupname != undefined) {
            var groupobj = global.currentconfig.getGroupByName(groupname);
            if (groupobj != undefined && groupobj.type == "ctemp") {
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
                            module.exports.setFixtureLevels(reqobj, false);
                        }
                    }
                }
                module.exports.latchOutputValuesToHardware();



                // construct group msg.
                if(broadcast && groupobj.isglobal && udp_handler != undefined) {
                    global.applogger.info(TAG, "@@@@ ---- Broadcasting group color temp request out to others ", "");
                    var element = {};
                    element.groupname = groupname;
                    element.colortemp = colortemp;
                    element.brightness = brightness;
                    element.requesttype = "wallstation";  // not used currently,
                    element.type = "colortemp";
                    var packet = JSON.stringify(element);
                    udp_handler.transmitData(packet);
                }
            }
        }
    },

    setMultipleFixtureLevels: function (requestobj) {
        if (requestobj != undefined) {
            var fixturesetlist = requestobj; //this should be an array
            var updatehw = false;
            for (var i = 0; i < fixturesetlist.length; i++) {
                var fixturelevelsetobj = fixturesetlist[i];

                if (fixturelevelsetobj.requesttype == undefined) {
                    fixturelevelsetobj.requesttype = 'override';
                }
                this.setFixtureLevels(fixturelevelsetobj, false);
                updatehw = true;
            }
        }

        if (updatehw)
            module.exports.latchOutputValuesToHardware();


    },
    /***
     *
     * @param requestobj-- json obj contains everything, uid..etc, uid, requesttype,
     * @returns {Uint8Array}
     */
    setFixtureLevels: function (requestobj, applytohw) {

        // global.applogger.info(TAG, "set fixture levels ", JSON.stringify(requestobj));

        if (requestobj != undefined) {
            if (requestobj.name != undefined) {
                var fix = global.currentconfig.getFixtureByName(requestobj.name);
                if (fix != undefined) {
                    // global.applogger.info(TAG, "found fixture wil ltry  to set level", "");
                    fix.setLevel(requestobj, applytohw);
                }
            }
        }
    },
    invokeScene: function (name, requesttype, broadcast) {

        if (name == "ALL_ON") {
            invokeAllToLevel(100, requesttype);
            return;
        }
        if (name == "ALL_OFF") {
            invokeAllToLevel(0, requesttype);
            return;
        }
        if (name == "ALL_50") {
            invokeAllToLevel(50, requesttype);
            return;
        }
        if (name == "ALL_10") {
            invokeAllToLevel(10, requesttype);
            return;
        }


        var sceneobj = global.currentconfig.getSceneByName(name);


        // var requesttype = "wallstation";
        if (sceneobj == undefined) {
            global.applogger.info(TAG, "cant invoke scene: " + name, "");
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
                    module.exports.setFixtureLevels(reqobj, false);
                }
                else if (fixobj instanceof CCTFixture) {
                    var reqobj = {};
                    reqobj.name = fixobj.assignedname;
                    reqobj.brightness = scenefix.brightness;
                    reqobj.colortemp = scenefix.colortemp;
                    reqobj.requesttype = requesttype;
                    module.exports.setFixtureLevels(reqobj, false);
                }
                else if (fixobj instanceof RGBWFixture) {
                    var reqobj = {};
                    reqobj.name = fixobj.assignedname;
                    reqobj.red = scenefix.red;
                    reqobj.green = scenefix.green;
                    reqobj.blue = scenefix.blue;
                    reqobj.white = scenefix.white;
                    reqobj.requesttype = requesttype;
                    module.exports.setFixtureLevels(reqobj, false);
                }

            }
        }


        // construct scene broadcast obj
        if(sceneobj.isglobal && broadcast && udp_handler != undefined) {
            global.applogger.info(TAG, "@@@@ ---- Broadcasting scene request out to others ", "");
            var element = {};
            element.scenename = name;
            element.requesttype = requesttype;
            var packet = JSON.stringify(element);
            udp_handler.transmitData(packet);
        }

        module.exports.latchOutputValuesToHardware();  // 6/7/17
    },

    latchOutputValuesToHardware: function () {
        rpdg.latchOutputLevelsToHW();
    },

// **********************************************************TEST HARNESS APIS ***********************************
// ***************************************************************************************************************

// this handles all level / contact inputs.
    testSetInputLevelVolts: function (interface, type, inputid, level) {
        incommingHWChangeHandler(interface, type, inputid, level);
    },
    sendOccupancyMessageToGroup: function (groupname) {
        var groupobj = global.currentconfig.getGroupByName(groupname);
        if (groupobj != undefined) {
            sendMessageToGroup(groupobj, "occupancy", 100); // default value for occ is 100, but will use params
        }
    },
    sendVacancyMessageToGroup: function (groupname) {
        var groupobj = global.currentconfig.getGroupByName(groupname);
        if (groupobj != undefined) {
            sendMessageToGroup(groupobj, "vacancy", 0); // default value for vacc is 0, but will use params
        }
    },
    resetDayLightPollCount: function () {
        daylightpolcount = 0;
    },
    enableRPDGHardwarePolling: function (enable) {
        global.applogger.error("rpdg_driver.js ", "enable rpdg polling : " + enable, "");
        rpdg.enableHardwarePolling(enable);
    },
// ******************************************ENOCEAN SUPPORT **********************************************
// ********************************************************************************************************
    teachEnoceanDevice: function (enoceanid) {
        try {
            enocean.teachFixture(enoceanid);

            //var package = this.getStatus2();
            //var dataset = JSON.stringify(package, null, 2);
            // return dataset;
        } catch (err) {
            global.applogger.error("rpdg_driver.js ", "teachEnoceanDevice :", err);
        }
    },
    startEnoceanLearning: function () {
        try {
            enocean.startLearning();
        } catch (err) {
            global.log.error("rpdg_driver.js ", "teachEnoceanDevice :", err);
        }
    },

    updateRPDGInputDrive: function () {
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
    getEnoceanKnownContactInputs: function ()    // contacts are occ and rocker switches
    {
        var contactinputs = [];
        // refresh
        var enocean_known_sensors = require('../../datastore/enocean_db/knownSensors.json');

        for (var key in enocean_known_sensors) {
            var device = enocean_known_sensors[key];

            if (device.eepFunc.includes("Rocker Switch") && device.eepFunc.includes("2 Rocker")) {
                contactinputs.push(key + "(A)");
                contactinputs.push(key + "(B)");
            }
            else if (device.eepFunc.includes("Occupancy") || device.eepFunc.includes("Rocker Switch")) {
                contactinputs.push(key);
            }
        }
        return contactinputs;
    },
    getEnoceanKnownLevelInputs: function ()    // level is light sensors.
    {
        var levelinputs = [];
        // refresh
        var enocean_known_sensors = require('../../datastore/enocean_db/knownSensors.json');
        for (var key in enocean_known_sensors) {
            var device = enocean_known_sensors[key];
            if (device.eepFunc.includes("Light Sensors")) {
                levelinputs.push(key);
            }
        }
        return levelinputs;
    },
    getEnoceanKnownOutputDevices: function () {
        var outputdevs = [];
        for (var i = 0; i < global.currentconfig.enocean.length; i++) {
            var dev = global.currentconfig.enocean[i];
            outputdevs.push(dev.enoceanid);
        }
        return outputdevs;
    },
    testmode_SetConfig: function (cfg) {

        var active_cfg = new Configuration();
        active_cfg.fromJson(cfg);

        active_cfg.initHWInterfaces(rpdg, enocean);
        global.currentconfig = active_cfg;
        //setup the 0-10 v drive values for current config,
        module.exports.updateRPDGInputDrive();
    },
    setRPDGPWMOutput: function (output, level) {
        rpdg.setOutputToLevel(output, level, false, undefined);
    },
    setRPDGPLCOutput: function (output, level) {
        rpdg.setOutputToLevel(output, level, false, "plc");
    },
    incrementSceneList: function (scenelistname) {
        // get eh scl object,
        var sl = global.currentconfig.getSceneListByName(scenelistname);
        if (sl != undefined) {
            sl.incrementActiveIndex(true);

            var targetscene = sl.getActiveSceneName();
            if (targetscene != undefined) {
                global.applogger.info(TAG, "Override", "  invoking scene from list: " + targetscene);
                module.exports.invokeScene(targetscene, "wallstation",true);
            }
        }
    },
    decrementSceneList: function (scenelistname) {
        // get eh scl object,
        var sl = global.currentconfig.getSceneListByName(scenelistname);
        if (sl != undefined) {
            sl.decrementActiveIndex(true);
            var targetscene = sl.getActiveSceneName();
            if (targetscene != undefined) {
                global.applogger.info(TAG, "Override", "  invoking scene from list: " + targetscene);
                module.exports.invokeScene(targetscene, "wallstation",true);
            }
        }
    },
    setScheduleModeEnable: function (enable) {
        // persistantstore.schedulemode = enable;

        global.currentconfig.generalsettings.schedulemode = enable;
        data_utils.writeConfigToFile();
        //  writePersistantStore();
        // fs.writeFile(PERSIST_FILE, output, function (err) {
        //    if (err) {
        //        console.log(err);
        //    }
        //   else {
//
        //   }
        //});
    },
    //,
    // getPersistantStore: function () {
    //     return JSON.stringify(persistantstore, null, 4);
    // },
    getEnoceanRxQue: function () {
        if (enocean != undefined)
            return enocean.getRxMessageFifo();
        else {
            var k = [];
            return k;
        }
    },
    runScript: function (name) {
        if (activescript != undefined)  // if not undefinded it needs to be canceled.
        {
            activescript.cancel();
            activescript = undefined;
        }
        activescript = require('../scripts/' + name);
        if (activescript != undefined) {
            activescript.run(ScriptResultHandler);
        }
    },
    setVirtualTime: function (timestring) {
        global.applogger.info(TAG, "Setting Virtual Time to: " + timestring, "");
        if (timestring != undefined) {
            global.virtualbasetime = moment(timestring);
            global.virtualtimeset = moment();
            schedule_mgr.requestScheduleCacheReset(global.virtualbasetime.toDate());
        }
        else {
            global.virtualbasetime = undefined;
            schedule_mgr.requestScheduleCacheReset(new Date());  // 5/9/17
        }

        currentschedule_eventbundle = undefined; //reset,  5/5/17
    },
    getScriptNames: function () {
        return availbilescripts;
    },
    enableHotspot: function (enable) {
        var command = (enable) ? "start" : "stop";
        try {
            global.applogger.info(TAG, " **** Attempting to enable wlan0 ****", "");

            if (process.arch == 'arm') {
                var childProcess = require('child_process'),
                    ls;

                ls = childProcess.exec('sudo service hostapd ' + command, function (error, stdout, stderr) {
                    if (error) {
                        console.log(error.stack);
                        console.log('Error code: ' + error.code);
                        console.log('Signal received: ' + error.signal);
                    }
                    console.log('Child Process STDOUT: ' + stdout);
                    console.log('Child Process STDERR: ' + stderr);
                });

                ls.on('exit', function (code) {
                    console.log('Child process exited with exit code ' + code);
                });
            }

        } catch (ex1) {
            global.applogger.info(TAG, " ****EXception:  disable wlan0 ****", ex1);
        }
    },
    getGPSFromZipcode: function (zipcode, res) {
        // zipcode to 2 gps.
        var foundzip = false;
        try {
            var objectpath = 'utils/zipcode2gps.csv';
            var target = path.resolve(objectpath);
            if (fs.existsSync(target)) {

                var lineReader = require('readline').createInterface({
                    input: require('fs').createReadStream(target)
                });

                lineReader.on('line', function (line) {
                    // console.log('Line from file:', line);
                    var parts = line.split(',');
                    if (parts.length == 3) {
                        if (parts[0].trim() == zipcode) {
                            foundzip = true;
                            var element = {};
                            element.location = parts;
                            res.status(200).send(element);
                            return;
                        }
                    }
                }).on('close', function () {
                    if (!foundzip) {
                        console.log('ERROR zip code not found !!!!');
                        res.status(400).send("error not found");
                    }
                    // console.log('Have a great day!');
                    //  process.exit(0);
                });


            }
        } catch (ex1) {
            global.applogger.info(TAG, " error reading file " + ex1, "");
        }
        //    res.status(200).send("not found");
    },

    isScriptRunning: function () {
        return activescript != undefined;
    },
    setRPDGHWPollingPeriod: function (periodms) {
        rpdg.setPollingPeriod(periodms);
    },
    forcecrash: function () {
        process.exit(1);
    },
    i2c_test1: function () {
        var value = 0;
        var direction = true;
        rpdg.setOutputToLevel(1,0,true,undefined);  // set to 0
        for(var i = 0; i < 500; i++)
        {
            rpdg.setOutputToLevel(1,value,true,undefined);
            if(direction) {
                value++;

                if(value >= 100)
                    direction = false;
            }
            else
            {
                value--;

                if(value <= 0)
                    direction = true;
            }
        }
    },
    getFixtureImageCount: function()
    {
        return fixtureimagefilecount;
    },
    setLANIPAddress: function(ipaddr, routerip)
    {
        if(process.arch == 'arm') {

            global.applogger.info(TAG, " attempting to set static ip address (TEST)", "");
            var gold = path.resolve('/etc/dhcpcd.gold');
            var temp = path.resolve('/etc/dhcpcd.temp');
            var active_file = path.resolve('/etc/dhcpcd.conf');
            try {
                var data = fs.readFileSync(gold, 'utf-8');
                fs.writeFileSync(temp, data);
                global.applogger.info(TAG, "gold  file copied to temp", "");

                // # interface eth0
                //# static ip_address=192.168.20.200/24
                //# static routers=192.168.20.1
                //# static domain_name_servers=192.168.20.1
                //  var  dataline = '\r\ninterface eth0\n static ip_address=192.168.20.200/24\n static routers=192.168.20.1\nstatic domain_name_servers=192.168.20.1\n';

                var dataline = '\r\ninterface eth0\nstatic ip_address=' + ipaddr + '/24\nstatic routers=' + routerip +
                    '\nstatic domain_name_servers=' + routerip + '\n';


                if (ipaddr.length <= 0 || routerip.length <= 0)
                    dataline = ""; //
                // / if set to -1,  set to  dhcp.

                // var objectpath = '/etc/dhcpcd.conf';
                // var target = path.resolve(objectpath);
                global.applogger.info(TAG, "appending temp file ", dataline);
                fs.appendFileSync(temp, dataline, 'utf-8');


                var data = fs.readFileSync(temp, 'utf-8');
                fs.writeFileSync(active_file, data);
                global.applogger.info(TAG, "temp file copied to active file.. need to reboot ", "");


                // restart of service here.
                global.applogger.info(TAG, " **** Attempting to restart dhcpcd service ****", "");


                var childProcess = require('child_process'),
                    ls;

                ls = childProcess.exec('sudo dhclient -r eth0; sudo /etc/init.d/dhcpcd restart', function (error, stdout, stderr) {
                    if (error) {
                        console.log(error.stack);
                        console.log('Error code: ' + error.code);
                        console.log('Signal received: ' + error.signal);
                    }
                    console.log('Child Process STDOUT: ' + stdout);
                    console.log('Child Process STDERR: ' + stderr);
                });

                ls.on('exit', function (code) {
                    console.log('Child process exited with exit code ' + code);
                });

            } catch (ex1) {
                global.applogger.info(TAG, " error writing DHCPCD CONF FILE " + ex1, "");
            }
        }
        else
        {
            global.applogger.info(TAG, "cant update ip address on non-pi system", "");
        }

    },
    cleanupServer: function() {

        console.log( " Server cleanup start ");
        if(udp_handler != undefined)
        {
            console.log( " udp server valid, cleanup call  ");
            udp_handler.cleanup();
        }
    },
    nodeDiscoverStart: function() {
        global.applogger.info(TAG,  "Node Discovery started ", "");
        if(udp_handler != undefined)
        {
            var ip = require('ip');
            var element = {};
            element.nodediscover = true;
            element.nodeinfo = {};
            element.nodeinfo.name = global.currentconfig.generalsettings.nodename;
            element.nodeinfo.ip = ip.address();
            var packet = JSON.stringify(element);
            udp_handler.transmitData(packet);
        }
        else {
            global.applogger.info(TAG,  "Node Discovery cant be started, no udp handler ", "");
        }
    },
    getNetworkMap: function() {
       // global.applogger.info(TAG,  "get net work called,  " + networkmap.length, "");
       // printNetworkMap();
        var element = {};
        var nodes = [];
        for(var key in networkmap)
        {
            var name = networkmap[key];

            var node = {};
            node.ip = key;
            node.name = name;
            nodes.push(node);
        }

        element.nodes = nodes;
       return element;
    }

};