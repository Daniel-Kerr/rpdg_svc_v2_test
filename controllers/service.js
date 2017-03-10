/**
 * Created by Nick on 2/24/2017.
 */
//var hal = require('./hal.js');
var path = require('path');
var pad = require('pad');
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

var Configuration = require('../models/Configuration.js');
var FixtureParameters = require('../models/FixtureParameters.js');

var Group = require('../models/Group.js');
var ContactInput = require('../models/ContactInput.js');

var data_utils = require('../utils/data_utils.js');

//var OnOffFixture3 = require('../models/OnOffFixture3.js').OnOffFixture3;

//var inputdevices = [];
//var outputdevices = [];


/***
 * this is where the messages from rpdg driver or the enocean hw come in ,  like (occ, vac...polling changes..etc),
 * @param interface  rpdg, / enocean
 * @param inputid
 * @param level
 * type -- level input, vs contact input,
 */
function incommingHWChangeHandler(interface, type, inputid,level)
{
    global.applogger.info(TAG, "incomming hw change handler: " + type + "  " + interface +  "  " + inputid, "");
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
                }
            }
        }
    }

}


var service = module.exports =  {

    setOnOffFixture: function(name, level, apply)
    {
        for(var i = 0; i < outputdevices.length; i++) {
            // match up interface,
            var dev = outputdevices[i];
            if (dev.assignedname == name && dev instanceof OnOffFixture) {
                dev.setLevel(level,apply);
                break;
            }
        }
    },

    setDimFixture: function(name, level, apply)
    {
        for(var i = 0; i < outputdevices.length; i++) {
            // match up interface,
            var dev = outputdevices[i];
            if (dev.assignedname == name && dev instanceof DimFixture) {
                dev.setLevel(level,apply);
                break;
            }
        }
    },

    setCCTFixture : function(name, ctemp, brightness, apply)
    {
        for(var i = 0; i < outputdevices.length; i++) {
            // match up interface,
            var dev = outputdevices[i];
            if (dev.assignedname == name && dev instanceof CCTFixture) {
                dev.setvalue(ctemp,brightness,apply);
                break;
            }
        }
    },


    setBrightnessGroup : function(name, level)
    {
        // stub
        module.exports.setDimFixture("dimA",level,false);
        module.exports.setDimFixture("dimB",level,false);
        module.exports.setDimFixture("dim_enocean",level,false);
    },

    initService : function () {

        global.applogger.info(TAG, " --init---", "");
        enocean.init(incommingHWChangeHandler);
        rpdg.init(incommingHWChangeHandler);

        var cfg = data_utils.getConfigFromFile();
        var active_cfg = new Configuration(cfg);

        active_cfg.initHWInterfaces(rpdg,enocean);
        global.currentconfig = active_cfg;

        //var fix = new OnOffFixture3();
        //fix.create("bla",enocean,"enocean","1",undefined);
        // fix.setLevel(34,false);
        //var newfix = OnOffFixture3.create("bla",enocean,"enocean","1",undefined);

        // test functions.
        var fix = global.currentconfig.getFixtureByName("jkjj0988999");
        if(fix != undefined)
        {
            var k = 0;
            k = k = + 1;

        }
        //  data_utils.writeConfigToFile();
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

        var BasePollingPeriod = 5000;        // Time interval in mSec that we do the most frequent checks.
        // var PWMCurrentPollingPeriodSec = Math.round ((5 * 1000) / BasePollingPeriod);  // period of polling pwm current from hw

        // global.applogger.info(TAG, "TIMER LOOP :",  "polling timer started");
        // console.log("starting driver periodic poller");
        periodictimer = setInterval(function () {
            //  global.applogger.info(TAG, "TIMER LOOP :",  "timer fired");
        }, BasePollingPeriod);
    },




// *********************************************************************************************************************
// *********************************************************************************************************************
// *********************************************************************************************************************
// *********************************************************************************************************************
    // FROM OLD RPDG DRIVER <<<< public exposed,
// *********************************************************************************************************************
// *********************************************************************************************************************
// *********************************************************************************************************************
// *********************************************************************************************************************
// *********************************************************************************************************************
// *********************************************************************************************************************

    setGroupToBrightnessLevel : function (groupname, level)
    {
        if(groupname != undefined)
        {
            for(var i = 0 ; i < global.currentconfig.groups.length; i++)  //find the group.
            {
                if(groupname == global.currentconfig.groups[i].name)
                {
                    var groupobj =  global.currentconfig.groups[i]; //extract group obj .
                    var requesttype = "wallstation";

                    // iter through full fix list,
                    for(var fixidx = 0; fixidx < global.currentconfig.fixtures.length; fixidx++)
                    {
                        // if in side of this group.
                        var fix = global.currentconfig.fixtures[fixidx];
                        var fixstatusobj = fixture_status_map[fix.uid];

                        if(groupobj.fixtures.indexOf(fix.uid) > -1)
                        {
                            var type = fix.type;

                            if(type == "on_off")
                            {
                                var adjlevel = 0;
                                if(level != 0)
                                    adjlevel = 100;


                                fixstatusobj.status.lastuserintensity = adjlevel;
                                setGenericFixtureLevels(requesttype, fix.uid, adjlevel, false);
                            }
                            else if(type == "dim")
                            {
                                fixstatusobj.status.lastuserintensity = level;
                                setGenericFixtureLevels(requesttype, fix.uid, level, false);
                            }
                            else if (type == "cct") {
                                // use existing settinsg for ctemp.

                                var colortemp =  fixstatusobj.status.currentlevels.ctemp;  // use last known hw level, dont mess with it,
                                fixstatusobj.status.lastuserintensity = level;


                                setCCTFixtureLevels(requesttype, fix.uid, level, colortemp, false);
                            }
                            else if (type == "rgbw") {

                                //  fix.status.lastuserintensity = level;
                                //use existing r/ g/ b,  and only update the white,
                                var fixstatusobj = fixture_status_map[fix.uid];
                                var red = fixstatusobj.status.currentlevels.red;
                                var green = fixstatusobj.status.currentlevels.green;
                                var blue = fixstatusobj.status.currentlevels.blue;
                                setRGBWFixtureLevels(requesttype, fix.uid, red, green, blue, level);
                            }
                        }
                    }

                    break;  // get out of loop
                }
            }
            setHW_PWMLevels();  // update pwm at hw level.
        }

        printZoneLevels();
        // 1/2/17, return the full status pkg.
        var package = this.getStatus2();
        var dataset = JSON.stringify(package, null, 2);
        return dataset;
    },

    setGroupToColorTemp :  function (groupname, colortemp)
    {
        if(groupname != undefined)
        {
            for(var i = 0 ; i < global.currentconfig.groups.length; i++)  //find the group.
            {
                if(groupname == global.currentconfig.groups[i].name)
                {
                    var groupobj =  global.currentconfig.groups[i]; //extract group obj .
                    var requesttype = "override";

                    // iter through full fix list,
                    for(var fixidx = 0; fixidx < global.currentconfig.fixtures.length; fixidx++)
                    {
                        // if in side of this group.
                        var fix = global.currentconfig.fixtures[fixidx];
                        if(groupobj.fixtures.indexOf(fix.uid) > -1)
                        {
                            var type = fix.type;
                            if (type == "cct") {
                                // use existing settinsg for brightness
                                var fixstatusobj = fixture_status_map[fix.uid];
                                var currbrightlevel =  fixstatusobj.status.currentlevels.levelpct;  // pull last known HW Level,

                                // 2/22/17
                                fixstatusobj.status.lastusercolortemp = colortemp;
                                setCCTFixtureLevels(requesttype, fix.uid, currbrightlevel, colortemp, false);
                            }
                        }
                    }
                    break;  // get out of loop
                }
            }
            setHW_PWMLevels();  // update pwm at hw level.
        }

        printZoneLevels();
        // 1/2/17, return the full status pkg.
        var package = this.getStatus2();
        var dataset = JSON.stringify(package, null, 2);
        return dataset;
    },


    setMultipleFixtureLevels : function (requestobj, applytohw)
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

            if(updatehw)
                setHW_PWMLevels();  // update pwm at hw level.
        }

        printZoneLevels();
        // 1/2/17, return the full status pkg.
        var package = this.getStatus2();
        var dataset = JSON.stringify(package, null, 2);
        return dataset;
    },
    /***
     *
     * @param requestobj-- json obj contains everything, uid..etc, uid, requesttype,
     * @returns {Uint8Array}
     */
    setFixtureLevels : function (requestobj, applytohw)
    {
        // var bla = zone_levels_pct;
        //printZoneLevels();
        global.applogger.info(TAG, "set fixture levels " ,JSON.stringify(requestobj));
        if(requestobj != undefined) {
            if(requestobj.name != undefined) {

                var fix = global.currentconfig.getFixtureByName(requestobj.name);

                global.applogger.info(TAG, "found fixture wil ltry  to set level" ,"");
                //if(fix instanceof OnOffFixture)
                fix.setLevel(requestobj, true);
                /*
                 var fixstatobj = fixture_status_map[requestobj.uid];
                 if(fixstatobj != undefined) {   // check uid is on this machine,
                 var fixtype = fixstatobj.fixture.type;

                 var reqtype = requestobj.requesttype;




                 var uid = requestobj.uid;
                 //var intensity = requestobj.intensity;
                 switch(fixtype)
                 {
                 case "on_off":
                 if(requestobj.on_off != undefined)
                 {
                 var levelpct = requestobj.on_off.levelpct;  // should be 0 or 100 (off/on)

                 //sainity check,
                 if(levelpct > 0)
                 levelpct = 100;

                 if(reqtype == "wallstation" || reqtype == "override")
                 fixstatobj.status.lastuserintensity = levelpct;  // record intensity


                 setGenericFixtureLevels(reqtype, uid, levelpct, applytohw);
                 }
                 break;
                 case "dim":
                 if(requestobj.dim != undefined)
                 {
                 var levelpct = requestobj.dim.levelpct;  // should be 0 -- > 100

                 if(reqtype == "wallstation"|| reqtype == "override")
                 fixstatobj.status.lastuserintensity = levelpct;  // record intensity

                 setGenericFixtureLevels(reqtype, uid, levelpct, applytohw);
                 }
                 break;
                 case "cct":
                 if(requestobj.cct != undefined)
                 {
                 var levelpct = requestobj.cct.levelpct;  // should be 0 --> 100
                 var ctemp = requestobj.cct.ctemp;  // should be 2500 --> 6500

                 if(reqtype == "wallstation"|| reqtype == "override") {
                 fixstatobj.status.lastuserintensity = levelpct;  // record intensity
                 fixstatobj.status.lastusercolortemp = ctemp;  // 2/22/17, store ctemp too
                 }
                 setCCTFixtureLevels(reqtype, uid, levelpct, ctemp, applytohw);
                 }
                 break;
                 case "rgbw":
                 if(requestobj.rgbw != undefined)
                 {
                 var red = requestobj.rgbw.red;  // should be 0 --> 100 (pct)
                 var green = requestobj.rgbw.green;  // should be 0 --> 100
                 var blue = requestobj.rgbw.blue;  // should be 0 --> 100
                 var white = requestobj.rgbw.white;  // should be 0 --> 100

                 if(reqtype == "wallstation"|| reqtype == "override")
                 fixstatobj.status.lastuserintensity = white;  // record intensity

                 if(red != undefined && green != undefined && blue != undefined && white != undefined)
                 setRGBWFixtureLevels(reqtype, uid, red, green,blue,white, applytohw);
                 }
                 break;
                 default:
                 break;
                 }
                 }*/
            }
        }
        //for debug,
        // console.log("modified zone levels (pct)");
        // printZoneLevels();
        // 1/2/17, return the full status pkg.
        var package = this.getStatus2();
        var dataset = JSON.stringify(package, null, 2);
        return dataset;

    },

    getStatus2 : function() {
        try {

            var outputlevels = [];
            ////plc output switches
            for (var outidx = 0; outidx < 4; outidx++) {
                var bit = (plc_output_switch[0] >> outidx) & 0x01;
                if (bit > 0)
                    outputlevels.push("ON");
                else
                    outputlevels.push("OFF");
            }
            // 12/30/16,
            // status is now fixture based,
            // data is structured per fixture:
            // current for each fixture is stuffed into its status
            var statuspackage = {};
            statuspackage.fixtures = fixture_status_map;
            statuspackage.zero2ten = Zero_to_Ten_Volt_inputs;
            statuspackage.plcoutput = outputlevels;

            var dllevel = Zero_to_Ten_Volt_inputs[daylightSensorInputNumber-1];
            statuspackage.daylightlevelvolts = dllevel;
            statuspackage.occupancy = "Not Occupied";

            // 1/2/17, place latest pwm output levels into status pkg,
            statuspackage.pwmzonelevelspct = zone_levels_pct;


            statuspackage.wetdrycontacts = WetDryContacts;
            return statuspackage;
        } catch(err)
        {

            global.log.error("rpdg_driver.js ", "getStatus2 :",  err);
            // console.log("!!! - exception: " + err);
        }
    },


    setHW_PLC_Switch : function(plcnumber, state) {
        // mask in value
        //console.log("driver called to set plc switch")

        try {

            var outindex = plcnumber - 1;

            var mask = 1 << outindex;
            if (state == 1) {
                plc_output_switch[0] |= mask;
            } else {
                plc_output_switch[0] &= ~mask;
            }

            printPLCOutputLevels();
            setHW_PLC();   //consolidated 1/8/17,

        } catch(err)
        {
            global.log.error("rpdg_driver.js ", "setHW_PLC_Switch :",  err);
            // console.log("!!! - exception: " + err);
        }

        var package = this.getStatus2();
        var dataset = JSON.stringify(package, null, 2);
        return dataset;
    },

    initFixtureStatusMap : function(fixtures) {

        fixture_status_map = {}; // blank it out.
        for (var i = 0; i < fixtures.length; i++) {

            var fix = fixtures[i];
            var base = {}; // status container
            base.fixture = fix;
            var status = {};
            status.lastusercolortemp = 3500; // changed on 2/28/170;
            status.lastuserintensity = 100; // changed on 2/28/17 ,,,,0;
            status.current = 0;

            // 1/20/17,
            var levels = {};
            if(fix.type == "on_off" || fix.type == "dim")
            {
                levels.levelpct = 100; // changed on 2/28/100 0;
            }
            else if(fix.type == "cct")
            {
                levels.levelpct = 100; // 2/28/17 ,0;
                levels.ctemp = 3500;
            }
            else if(fix.type == "rgbw")
            {
                levels.red = 0;
                levels.green = 0;
                levels.blue = 0;
                levels.white = 100; // 2/28/170;
            }

            status.currentlevels = levels;

            base.status = status;
            status.isdaylightlimited = false;
            fixture_status_map[fix.uid] = base;
        }
    },
    /*
     exports.startPolling: function() {

     var BasePollingPeriod = 100;        // Time interval in mSec that we do the most frequent checks.
     var PWMCurrentPollingPeriodSec = Math.round ((5 * 1000) / BasePollingPeriod);  // period of polling pwm current from hw

     global.log.info("rpdg_driver.js ", "TIMER LOOP :",  "polling timer started");
     // console.log("starting driver periodic poller");
     periodictimer = setInterval(function () {

     // moved in here, can be updated externally, via api,
     // Under Normal circumstances,  this would be set to something like 10 minutes,  very
     var DaylightPollingPeriod = Math.round ((DaylightPollingConfigSeconds * 1000) / BasePollingPeriod);      // Number of seconds for daylight level adjustment
     // read the 0-10 volt input values and stuff into local copy
     readHW_0to10inputs();

     // if any input changed by > delta,  run ws update func on that input number,
     while(queue_zero_to_ten_inputchanged.length > 0)
     {
     var index = queue_zero_to_ten_inputchanged.shift();
     if(global.loghw.zero2teninputchanged)
     global.log.info("rpdg_driver.js ", "TIMER LOOP :",  "zero2ten input changed on index: " + index);

     // if inptut is a ws ,  run it, now. .. todo...
     var inputtype = global.currentconfig.inputcfg.zero2ten[index];  // if index is wallstation,
     if (inputtype == "wallstation") { //} || inputtype == "daylight") {
     updateWallStationBoundOutputs(index);
     }

     }

     readHW_WetDryContactinputs();
     //wet dry contact change detection
     while(queue_wet_dry_contact_inputchanged.length > 0)
     {
     var index = queue_wet_dry_contact_inputchanged.shift();
     var value = WetDryContacts[index];

     if(global.loghw.wetdrycontactchanged)
     global.log.info("rpdg_driver.js ", "TIMER LOOP :",  "wet dry contact changed on index: " + index + "  state : " + value);

     //console.log("DEBUG: wet dry contact state change on index: " + index   + "  state : " + value);
     // 1/15/17, check config ,and act on it,
     if(global.currentconfig.inputcfg.contact != undefined && global.currentconfig.inputcfg.contact.length > 0)
     {
     for(var i = 0; i < global.currentconfig.inputcfg.contact.length; i++)
     {
     var contactdef = global.currentconfig.inputcfg.contact[i];  // look for contact number that just changed.
     if(contactdef.inputnum == index+1)
     {
     if(global.loghw.wetdrycontactchanged)
     global.log.info("rpdg_driver.js ", "TIMER LOOP :",  "found contact def obj, acting now." );

     // determine if this is a momentray of maintained,
     if(contactdef.subtype == "maintained") {
     contactSwitchHandler(contactdef,value);
     } // end maintained handler.
     else
     {
     // momemtary only acts on active state, so check value,
     if(value == 1)
     {
     contactSwitchHandler(contactdef,1);
     }
     }

     break; //break out of search for contact def.
     }
     }
     }
     }


     // 2/5/17, temp, handler for enocean wet/dry types,


     // ***********************************************

     periodicpollcount++;
     if (periodicpollcount >= 20*30) {
     //console.log("periodic poller running from rpdg driver");
     periodicpollcount = 0;
     }

     daylightpolcount++;

     if (DaylightPollingPeriod > 0 && daylightpolcount == DaylightPollingPeriod) {
     daylightpolcount = 0;

     // test code
     var now = moment();
     var currenthour = now.hour();
     if(global.virtualbasetime != undefined) {

     var deltams = now - global.virtualtimeset;
     //console.log("diff " + deltams);
     var virtualclocktime = global.virtualbasetime.add(deltams, 'ms');
     // console.log("new virt clock time : " + virtualclocktime.format());
     currenthour = virtualclocktime.hour();
     }
     // global.log.info("rpdg_driver.js ", "TIMER LOOP", " --Periodic Wall Station Update call");

     // for gating dl update based on dl hours.
     // var today = new Date();
     // var h = today.getHours();
     //  console.log ("Current hour of the day is: ",currenthour);
     //     if (currenthour >= 8 && currenthour<= 17) {     // only run the daylight sensor between the hours of 8am and 5pm
     // console.log ("Running Daylight Check Now....");
     updateWallStationBoundOutputs(daylightSensorInputNumber-1);
     }

     pwmcurrentpolcount++;
     if(pwmcurrentpolcount == PWMCurrentPollingPeriodSec)
     {
     pwmcurrentpolcount = 0;
     readHW_CurrentCounts();
     }
     }, BasePollingPeriod);
     },
     */

    updateConfigData : function() {
        //  current_config = config;

        this.initFixtureStatusMap(global.currentconfig.fixtures);

        daylightSensorInputNumber = getDayLightSensorInputNumber(); //update global.


        // console.log("daylight sensor input number  updated to: " + daylightSensorInputNumber);

        // 1/8/1
        if(daylightSensorInputNumber > 0)
        {
            Zero_to_Ten_Volt_inputs[daylightSensorInputNumber-1] = 10; // default set to 10 volts for daylight, (= dark),
        }

        hal_enocean.initFixtureList();


        // 2/8/17, update config data for each fixture.
        setDimmerEdgeConfig();

        setHW_ConfigureZero2TenDrive();

    },

    updateScenelist :function(scenelist) {
        current_scenelist = scenelist;
    },


    setTestDayLightLevel : function (dlinputnumber, dl_levelvolts)
    {
        daylightSensorInputNumber = Number(dlinputnumber);
        Zero_to_Ten_Volt_inputs[daylightSensorInputNumber-1] = dl_levelvolts;

        global.log.info("rpdg_driver.js ", "setTestDayLightLevel", dl_levelvolts);
        //  console.log("DAylight level changed for test to: " + dl_levelvolts);
    },

    setTestDimmerLevel : function (inputnumber, dimmerlevelvolts)
    {
        Zero_to_Ten_Volt_inputs[inputnumber-1] = dimmerlevelvolts;

        // for test, no hysterisis.  assume change
        var index = inputnumber-1;
        queue_zero_to_ten_inputchanged.push(index);

    },

    getFixtureStatusLevels : function (fixtureUID)
    {
        var fixobj = fixture_status_map[fixtureUID];
        if(fixobj == undefined)
            return "fixture not found";

        // var assign = fixobj.fixture.assignment[0];
        // var level = zone_levels_pct[assign-1];
        return fixobj.status.currentlevels;
    },
    setTestWetDryContactLevel: function (inputnumber, level)
    {
        var index = inputnumber-1;
        if(WetDryContacts[index] != level)
            queue_wet_dry_contact_inputchanged.push(index);

        WetDryContacts[index] = level;
    },

    sendOccupancyMessageToGroup : function (groupname)
    {
        setOccVacancyToGroup(groupname, true);
    },
    sendVacancyMessageToGroup : function (groupname)
    {
        setOccVacancyToGroup(groupname, false);
    },
    setTestRandomPWMCurrentValues : function() {
        for(var i = 0 ; i < pwm_current_amps.length; i++) {
            var randomamps = Math.floor(Math.random() * (10 - 0 + 1)) + 0;
            pwm_current_amps[i] = randomamps;
        }
        updateFixtureCurrentStatus();

    },

    setDayLightPollingPeriodSeconds : function(intervalsec) {
        DaylightPollingConfigSeconds = intervalsec;
        daylightpolcount = 0;
    },
    invokeScene : function(sceneobj, requesttype) {

        // ... todo   add hold set hw ,  until after we are done setting levels,  (levels only )
        for (var i = 0; i < sceneobj.fixtures.length; i++) {

            var fix = sceneobj.fixtures[i];

            var fixobj = fixture_status_map[fix.uid];
            if (fixobj != undefined) {

                var type = fixobj.fixture.type;
                // if fix type is cct, then run color tomep
                //decode
                // type.// now set its level into hw.
                // 2/22//17,  for scene invoke, we save the last setting , this is treated as "user requested" levels.
                if(type == "on_off" || type == "dim")
                {
                    global.log.info("rpdg_driver.js ", "invokeScene", " saving user intensity: " +  fix.settings.level);
                    fixobj.status.lastuserintensity = fix.settings.level;
                    setGenericFixtureLevels(requesttype, fix.uid, fix.settings.level, false);
                }
                else if (type == "cct") {

                    global.log.info("rpdg_driver.js ", "invokeScene", " saving user intensity: " +  fix.settings.level);
                    global.log.info("rpdg_driver.js ", "invokeScene", " saving user ctemp: " +  fix.settings.ctemp);
                    fixobj.status.lastusercolortemp = fix.settings.ctemp;  // 2/22/17,
                    fixobj.status.lastuserintensity = fix.settings.level;
                    setCCTFixtureLevels(requesttype, fix.uid, fix.settings.level, fix.settings.ctemp, false);
                }
                else if (type == "rgbw") {
                    setRGBWFixtureLevels(requesttype, fix.uid, fix.settings.red, fix.settings.green, fix.settings.blue, fix.settings.white, false);
                }
            }
        }

        setHW_PWMLevels(); // now apply changes .
        printZoneLevels();


        // now plc set
        if(sceneobj.plcstate != undefined)
        {
            if(sceneobj.plcstate._1 != "ignore")
            {
                var set = sceneobj.plcstate._1;
                var mask = 1 << 0;
                if (set) {
                    plc_output_switch[0] |= mask;
                } else {
                    plc_output_switch[0] &= ~mask;
                }
            }
            if(sceneobj.plcstate._2 != "ignore")
            {
                var set = sceneobj.plcstate._2;
                var mask = 1 << 1;
                if (set) {
                    plc_output_switch[0] |= mask;
                } else {
                    plc_output_switch[0] &= ~mask;
                }

            }
            if(sceneobj.plcstate._3 != "ignore")
            {
                var set = sceneobj.plcstate._3;
                var mask = 1 << 2;
                if (set) {
                    plc_output_switch[0] |= mask;
                } else {
                    plc_output_switch[0] &= ~mask;
                }

            }
            if(sceneobj.plcstate._4 != "ignore")
            {
                var set = sceneobj.plcstate._4;
                var mask = 1 << 3;
                if (set) {
                    plc_output_switch[0] |= mask;
                } else {
                    plc_output_switch[0] &= ~mask;
                }
            }

            setHW_PLC();   //consolidated 1/8/17,
        }  // end plc update part.

        var package = this.getStatus2();
        var dataset = JSON.stringify(package, null, 2);
        return dataset;
    },
    teachEnoceanDevice : function(id)
    {
        try {
            hal_enocean.teachFixture(id);

            var package = this.getStatus2();
            var dataset = JSON.stringify(package, null, 2);
            return dataset;
        } catch (err)
        {
            global.log.error("rpdg_driver.js ", "teachEnoceanDevice :",  err);
        }
    },
    startLearning : function(id)
    {
        try {
            hal_enocean.startLearning();
            var package = this.getStatus2();
            var dataset = JSON.stringify(package, null, 2);
            return dataset;
        } catch (err)
        {
            global.log.error("rpdg_driver.js ", "teachEnoceanDevice :",  err);
        }
    },
    testZero2TenVoltDriver : function()
    {
        setHW_ConfigureZero2TenDrive();
    },
    testDimmerEdgeConfig : function()
    {
        setDimmerEdgeConfig();
    }

// END FROM OLD DRIVER FILE
// ********************************************************************************************************************
// ********************************************************************************************************************



};
