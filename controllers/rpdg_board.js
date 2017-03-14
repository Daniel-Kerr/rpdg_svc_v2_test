/**
 * Created by Nick on 2/24/2017.
 */
var path = require('path');
var pad = require('pad');
var TAG = pad(path.basename(__filename),15);


var platform = (process.arch == 'arm')?"RaspberryPI":"x86";
var data_utils = require('../utils/data_utils.js');  //1/15/17,
var boardmode = (data_utils.commandLineArgPresent("nohw"))?"HW NOT Present":"RPDG board present";
var boardvolts = (data_utils.commandLineArgPresent("hv"))?"HIGH":"LOW";

var nohw = data_utils.commandLineArgPresent("nohw");
var ishv = data_utils.commandLineArgPresent("hv");
var i2cwire = undefined;  // set at startup, for hw interface.

if(platform == "RaspberryPI" && !nohw) {
    var i2c = require('i2c');
}
// for debug info.
global.applogger.info(TAG,"Board TYPE: " + boardvolts + " Voltage Board", "");
global.applogger.info(TAG,"Board MODE: " + boardmode, "");
global.applogger.info(TAG,"PLATFORM: " + platform, "");

// OutPuts
var pmw_outputs_pct = new Uint8Array(8);   // 8 zone level pct(0--100%) of 16 bit,s
var plc_output_switch = new Uint8Array(1);

// Inputs
var pwm_current_amps = new Float32Array(8);
var Zero_to_Ten_Volt_inputs = new Float32Array(4);  // as of 12/21/16, this is now voltage levels, not raw bits.
var WetDryContacts = new Uint8Array(4);


var rxhandler = undefined;

global.applogger.info(TAG,"I2C VALID: " + getI2cWire(), "");


exports.init = function(callback)
{
    global.applogger.info(TAG, "init", "");
    rxhandler = callback;
    startHWPolling();
}

exports.setOutputToLevel = function(outputid, level, apply, options) {
    if (options != undefined && options == "plc") {
        var outindex = Number(outputid) - 1;
        var mask = 1 << outindex;
        if (level > 0) {
            plc_output_switch[0] |= mask;
        } else {
            plc_output_switch[0] &= ~mask;
        }
        global.applogger.info(TAG, "set output ", outputid + "  to  " + level + "   applied " + apply + "  opts  " + options);
        if (apply)
            setHW_PLC();
    }
    else {


        var outindex = Number(outputid)
        pmw_outputs_pct[outindex - 1] = level;

        global.applogger.info(TAG, "set output ", outputid + "  to  " + level + "   applied " + apply + "  opts  " + options);
        if (apply)
            setHW_PWMLevels();
    }

}

exports.latchOutputLevelsToHW = function() {
    setHW_PLC();
    setHW_PWMLevels();
}

exports.getPWMPower = function() {

    var watts = [];
    for (var i = 0; i < pwm_current_amps.length; i++) {
        var amps = pwm_current_amps[i];
        var power = (amps * 24);
        watts.push(power.toFixed(2))
    }
    return watts;
}


var tempcounter = 0;
function startHWPolling() {

    var BasePollingPeriod = 100;        // Time interval in mSec that we do the most frequent checks.
    global.applogger.info(TAG, "Polling :",  "polling timer started");
    periodictimer = setInterval(function () {
        readHW_0to10inputs();
        readHW_WetDryContactinputs();
        readHW_CurrentCounts();
        // global.applogger.info(TAG, "hw polling",  "timer fired");
    }, BasePollingPeriod);
}


// ********************************************PRIVATE FUNCS ******************************************
// *****************************************************************************************************

/***
 * write the hw PLC outputs
 */
function setHW_PLC()
{
    try {
        var wire = getI2cWire();
        if(wire != undefined) {
            wire.writeBytes(1, plc_output_switch, function (err) {
                if (err != null)
                    global.applogger.error(TAG, "Set PLC LEVELS:  ", err);
            });
            wire.writeBytes(1, plc_output_switch, function (err) {

                if (err != null)
                    global.applogger.error(TAG, "Set PLC LEVELS:  ", err);
            });
        }
    } catch(err)
    {
        global.applogger.error(TAG, "Set PLC LEVELS: (exception) ", err);
    }

    printPLCOutputLevels();
}




function setHW_PWMLevels()
{
    global.applogger.error(TAG, "trying to set pwm levels in hw", "");
    try {
        var zone_levels = new Uint8Array(16);  // convert pct to level values (16 bit).
        var zoneidx = 0;
        for (var i = 0; i < pmw_outputs_pct.length; i++) {
            var npct = pmw_outputs_pct[i];
            if(ishv && i < 7) { // dont invert output 8
                npct = 100 - npct;   //invert
                // if(i == 6) {    // for demo on 2/12/17,  only do scale / inversion  on channel 6 output 7
                npct = npct / 10;   // scale. 2/12/17

                if(npct > 9)
                    npct = 100;
            }

            var lev = (npct / 100) * 65535;
            var bytes = data_utils.intToByteArray(lev);
            //zone levels = 2 bytes per.
            zone_levels[zoneidx] = bytes[0];
            zone_levels[zoneidx + 1] = bytes[1];
            zoneidx += 2;
        }

        var wire = getI2cWire();
        if (wire != undefined) {
            wire.writeBytes(0, zone_levels, function (err) {
                if (err != null)
                    global.applogger.error(TAG, "setHW_PWMLevels:",  err);
            });
            wire.writeBytes(0, zone_levels, function (err) {
                if (err != null)
                    global.applogger.error(TAG, "setHW_PWMLevels:",  err);
            });
        }
        else {
            global.applogger.info(TAG, "setHW_PWMLevels:",  "no i2c wire");
        }
    } catch (err)
    {
        global.applogger.error(TAG, "setHW_PWMLevels:",  err);
    }

    if(global.loghw.pwmlevels)
        printPWMOutputLevels();
}




function setHW_ConfigureZero2TenDrive()
{
    try {

        global.applogger.info(TAG, "setHW_ConfigureZero2TenDrive ", "sending drive to hw");
        var config = new Uint8Array(4);

        if( global.currentconfig.inputcfg.zero2tendrive != undefined &&  global.currentconfig.inputcfg.zero2tendrive.length == 4) {
            //drive is .25 mA --> 20 mA ,
            config[0] = global.currentconfig.inputcfg.zero2tendrive[0] / .25;
            config[1] = global.currentconfig.inputcfg.zero2tendrive[1] / .25;
            config[2] = global.currentconfig.inputcfg.zero2tendrive[2] / .25;
            config[3] = global.currentconfig.inputcfg.zero2tendrive[3] / .25;
            // console.log("drive config sending to hw(byte0) :  " + config[0] );
            var wire = getI2cWire();
            if (wire != undefined) {
                wire.writeBytes(3, config, function (err) {
                    if (err != null)
                        global.applogger.error(TAG, "setHW_ConfigureZero2TenDrive",  err);

                });
                wire.writeBytes(3, config, function (err) {
                    if (err != null)
                        global.applogger.error(TAG, "setHW_ConfigureZero2TenDrive",  err);
                });
            }
            else {
                global.applogger.info(TAG, "setHW_ConfigureZero2TenDrive", "no i2c hw");
            }
        }
        else
        {
            global.applogger.info(TAG, "setHW_ConfigureZero2TenDrive ", "cant set,  no config info to set");
        }
    } catch (err)
    {
        global.applogger.error(TAG, "setHW_ConfigureZero2TenDrive",  err);
    }
}




function readHW_CurrentCounts()
{
    try {
        var wire = getI2cWire();
        if(wire != undefined) {
            wire.readBytes(2, 17, function (err, res) {
                if (res != null) {
                    var length = res[0];
                    var index = 0;
                    for (var i = 1; i < res.length;) {
                        var msb = res[i];
                        var lsb = res[i + 1];
                        var val = (msb << 8) | lsb;
                        // 2/12/17
                        if(val > 2048)
                        {
                            val = val - 2048;
                        }
                        else
                        {
                            val = 2048-val;
                        }
                        i += 2;
                        var amps = val / 310;
                        pwm_current_amps[index] = amps;  //12/30/16, chnaged to current, stuff,
                        index++;
                    }
                     printCurrentCounts();
                }
                if (err != null)
                    global.applogger.error(TAG, "readHW_CurrentCounts",  err);
            });
        }
    } catch(err)
    {
        global.applogger.error(TAG, "read hw current:",  err);
    }
}


// NOte this one is polled currently,  and we are reding in file,,, every time,  need to move it ot memory...asap. see below,
function readHW_0to10inputs() {

    try {

        var wire = getI2cWire();
        if (wire != undefined) {

            wire.readBytes(0, 9, function (err, res) {
                if (res != null) {
                    var length = res[0];
                    var index = 0;
                    // read the latest  value into our array.
                    for (var i = 1; i < res.length;) {
                        var msb = res[i];
                        var lsb = res[i + 1];
                        var val = (msb << 8) | lsb;
                        i += 2;
                        // 12/9/16 offset fix .
                        val = val * 1.1;
                        var pct = (val * 100) / 4096;
                        var voltage = pct / 10;
                        var absdelta = Math.abs(voltage - Zero_to_Ten_Volt_inputs[index]);
                        // update the stored value.
                        if (absdelta > .50) {  //for historisis (this is volts),
                            global.applogger.info(TAG, "Input Delta > .50:  ", "abs delta: " + absdelta.toFixed(2) + "  " + Zero_to_Ten_Volt_inputs[index].toFixed(2) + " : " + voltage.toFixed(2));
                            Zero_to_Ten_Volt_inputs[index] = voltage;  // NOTE,  this is voltage,
                            rxhandler("rpdg","levelinput", index+1, voltage);
                        }

                        if (err != null)
                            global.applogger.error(TAG, "readHW_0to10inputs",  err);

                        index++;
                    }
                    print0_10inputs();
                }
            });
        }
    } catch(err)
    {
        global.applogger.error(TAG, "read hw zero 2 ten:",  err);
    }
}


function readHW_WetDryContactinputs() {
    try {
        var wire = getI2cWire();
        if (wire != undefined) {
            wire.readBytes(1, 2, function (err, res) {
                if (res != null) {
                    var length = res[0];
                    // console.log("got back resp " + res[0] + "    " +  res[1] );
                    // second byte should have lower 4 bits set according to inputs.
                    // read the latest  value into our array.
                    //  WetDryContacts // is array of 4 uints, one fore each inputs.
                    var statebits = res[1];
                    // console.log("statebits "  +  res[1] );
                    for (var i = 0; i < 4; i++) {
                        var state = ((statebits >> i) & 0x01);

                        if(state != WetDryContacts[i]) {
                            rxhandler("rpdg", "contactinput", i + 1, state);
                        }
                        WetDryContacts[i] = state;
                    }
                    printWetDryContacts();
                }
                else
                {
                    global.applogger.error(TAG, "readHW_WetDryContactinputs",  " res is null");
                }

                if (err != null)
                    global.applogger.error(TAG, "readHW_WetDryContactinputs",  err);
            });
        }

    } catch(err)
    {
        global.applogger.error(TAG, "readHW_WetDryContactinputs",  err);
    }
}



/*  STUB FOR HW BOARD .... todo ,
 function setDimmerEdgeConfig()
 {
 try {

 var configbyte = 0x00;
 for (var i = 0; i < global.currentconfig.fixtures.length; i++) {

 var fix = global.currentconfig.fixtures[i];
 var dimsetting = fix.parameters.dimoptions;


 var k = 0;
 k = k  =1;

 }
 } catch (err)
 {
 global.log.error("rpdg_driver.js ", "setDimmerEdgeConfig",  err);
 }
 }
 */


function printPWMOutputLevels()
{
    var msg = "";
    for (var i = 0; i < pmw_outputs_pct.length; i++) {
        msg += pmw_outputs_pct[i] + " ";
    }
    global.applogger.info(TAG, "pwm output level pct   ", msg);

}


function printCurrentCounts()
{
    if(global.loghw.pwmcurrent) {
        var msg = "";
        // console.log("Current Counts: " + pwm_current_amps.length);
        for (var i = 0; i < pwm_current_amps.length; i++) {
            var amps = pwm_current_amps[i];
            var power = (amps * 24);
            msg += "zone: " + i + " current: " + amps.toFixed(2) + " (amps)  power: " + power.toFixed(2) + " watts";
        }
        global.applogger.info(TAG, "PWM Current / Power Levels   ", msg);
    }
}

function print0_10inputs()
{
    if(global.loghw.zero2teninput) {
        var msg = "";
        for (var i = 0; i < Zero_to_Ten_Volt_inputs.length; i++) {
            msg +=  Zero_to_Ten_Volt_inputs[i].toFixed(2) + " volts" + "   ";
        }
        global.applogger.info(TAG, "Zero2Ten Inputs(V):  ", msg);
    }
}

function printWetDryContacts()
{
    if(global.loghw.wetdrycontacts) {
        var msg = ""
        for (var i = 0; i < WetDryContacts.length; i++) {
            msg += WetDryContacts[i] + "   |    ";
        }
        global.applogger.info(TAG, "Wet Dry Contacts:  ", msg);
    }
}

function printPLCOutputLevels()
{
    if(global.loghw.plcoutputlevels) {
        var msg = ""

        for(var i = 0; i < 4; i++) {
            var mask = 1 << i;
            var state = mask & plc_output_switch[0];
            if(state)
                msg +=  i + " true   | ";
            else
                msg +=  i + " false  |  ";
        }

        global.applogger.info(TAG, "PLC LEVELS:  ", msg);
    }
}


/***
 * for hw only,
 * @returns {*}
 */
function getI2cWire() {
    if (platform == "RaspberryPI" && !nohw) {
        var address = 102;
        if(i2cwire == undefined)
            i2cwire = new i2c(address, {device: '/dev/i2c-1'});

        return i2cwire;
    }

    return undefined;
}