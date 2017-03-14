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
var RGBWFixture = require('../models/RGBWFixture.js');

var Configuration = require('../models/Configuration.js');
var FixtureParameters = require('../models/FixtureParameters.js');

var Group = require('../models/Group.js');
var ContactInput = require('../models/ContactInput.js');

var data_utils = require('../utils/data_utils.js');

var filter_utils = require('./../utils/filter_utils.js');


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


                    // check if input is a daylight sensor, and apply it, to global.
                    if(dev.type == "daylight")
                    {
                        global.applogger.info(TAG, "(LEVEL INPUT) message handler found device ", "DAYLIGHT UPDATE");
                        global.currentconfig.daylightlevelvolts = level.toFixed(2); //
                    }

                    dev.setvalue(level.toFixed(2));
                    // if dimmer, then make call to dim,

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


                    for(var k = 0; k < global.currentconfig.fixtures.length; k++)
                    {
                        var fixobj = global.currentconfig.fixtures[k];
                        if(fixobj.isBoundToInput(dev.assignedname))
                        {
                            global.applogger.info(TAG, "(CONTACT INPUT) bound to this input", "wall station update" + fixobj.assignedname);
                            var reqobj = {};
                            reqobj.requesttype = "wallstation";
                            if(fixobj instanceof OnOffFixture || fixobj instanceof DimFixture)
                            {
                                // the input level is 0 or 1, so mult by 10, and round to int,
                                var targetlevel = level * 100;
                                reqobj.level = targetlevel.toFixed(0);
                                fixobj.setLevel(reqobj,true);
                            }
                            if(fixobj instanceof CCTFixture)
                            {
                                // create request here iwthout a change to color temp,  tell driver to use last known,
                                var targetlevel = level * 100;
                                reqobj.brightness = targetlevel.toFixed(0);
                                fixobj.setLevel(reqobj,true);
                            }
                        }
                    }

                }
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


            // poll for pwm output power.(RPDG PWM ONLY)
            var power_watts = rpdg.getPWMPower(); // should be 8 doubles... to be inserted into fixture table,
            for(var i = 0; i < global.currentconfig.fixtures.length; i++) {
                var fixobj = global.currentconfig.fixtures[i];
                if(fixobj.interfacename == "rpdg-pwm") {
                    if (fixobj instanceof OnOffFixture || fixobj instanceof DimFixture) {

                        var power = power_watts[Number(fixobj.outputid) - 1];
                        fixobj.powerwatts = power;
                       // global.applogger.info(TAG, "polling", "updated power on device: " + fixobj.assignedname + "   " + power);

                    }
                    else if (fixobj instanceof CCTFixture) {
                        var powerwarm = power_watts[Number(fixobj.outputid) - 1];
                        var powercool = power_watts[Number(fixobj.outputid)];
                        fixobj.powerwatts = powerwarm + powercool;
                      //  global.applogger.info(TAG, "polling", "updated power on device: " + fixobj.assignedname + "   " + power);
                    }
                }
            }
            // in here we need to do the following,



            // poll check the current daylight sensor input, and update the daylight level volts inthe config.
            // every x min,  make call,
            //global.currentconfig.daylightlevelvolts
            //


            //  global.applogger.info(TAG, "TIMER LOOP :",  "timer fired");
        }, BasePollingPeriod);
    },

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
                    break;  // get out of group loop,
                }
            }
        }
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
    invokeScene : function(name) {
        var sceneobj = global.currentconfig.getSceneByName(name);
        var requesttype = "wallstation";
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
            }
        }
    },


    latchOutputValuesToHardware : function ()
    {
        rpdg.latchOutputLevelsToHW();
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

    /* updateConfigData : function() {
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
     */

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
