/**
 * Created by Nick on 2/24/2017.
 */
var path = require('path');
var pad = require('pad');
var TAG = pad(path.basename(__filename),15);

var platform = (process.arch == 'arm')?"RaspberryPI":"x86";
var data_utils = require('../utils/data_utils.js');  //1/15/17,
//var boardmode = (data_utils.commandLineArgPresent("nohw"))?"HW NOT Present":"RPDG board present";

var attached_to_rpdg_board = true; //  8/3/17,  assume hw is attached, so we can try to read out. data_utils.commandLineArgPresent("nohw");
var i2cwire = undefined;  // set at startup, for hw interface.
var tempcounter = 0;
var polling_enabled = true;
var reset_tinsy_counter = -1;
var periodictimer = undefined;
var teensy_reset_line = undefined;  // obj that will toggle io to reset tennsy.
var i2c_error_count = 0;  // if > 3  call to reset teensy.


 // 8/3/17 moved to init func.
if(platform == "RaspberryPI") { //} && !nohw) {
    var i2c = require('i2c');

    try {
        global.applogger.info(TAG, "Initilizing the GPIO handler tied to tinsey", "","");
        var Gpio = require('onoff').Gpio; // Constructor function for Gpio objects.
        teensy_reset_line = new Gpio(11, 'out');   // Export GPIO #14 as an output...iv;

    } catch (ex1) {
        global.applogger.info(TAG, "error setting up the gpio", "","");
    }

}

// for debug info.
//global.applogger.info(TAG,"Board TYPE: " + boardvolts + " Voltage Board", "");
//global.applogger.info(TAG,"Board MODE: " + boardmode, "");
global.applogger.info(TAG,"PLATFORM: " + platform, "");

// OutPuts
var pmw_outputs_pct = new Uint8Array(8);   // 8 zone level pct(0--100%) of 16 bit,s
var plc_output_switch = new Uint8Array(1);

// Inputs
var pwm_current_amps = new Float32Array(8);
var Zero_to_Ten_Volt_inputs = new Float32Array(4);  // as of 12/21/16, this is now voltage levels, not raw bits.
var WetDryContacts = new Uint8Array(4);

var boardtype = "??";
var fwversion = "??";


var rxhandler = undefined;

//global.applogger.info(TAG,"I2C VALID: " + getI2cWire(), "");

var CMD_GET_INFO = 0;
var CMD_SETPWM = 1;
var CMD_SETPLC = 2;
var CMD_SET_PWM_POLARITY = 3;  //pwm pol lv -- / dim edge ctrl on hw
var CMD_SET_ZERO_2_TEN_DRIVE = 4;  //analog in drive level
var CMD_READ_ZERO_2_TENLEVEL = 5;
var CMD_READ_WET_DRY_CONTACTS = 6;
var CMD_READ_PWM_CURRENT = 7;  //
var CMD_SET_HV_DIM_MODE = 8;   // 8 bit bit mask, for setting between 0-10 v dim / vs  phase dimming, (fwd/ revers),



exports.init = function(callback)
{
    if(platform == "RaspberryPI") {
        global.applogger.info(TAG, "Platform is rpi, setting up i2c lib and gpio lib", "","");
        getI2cWire();  //force creation
        global.applogger.info(TAG, "Requesting HW info now", "","");
        read_HWInfo();  // 8/3/17, this is first i2c tx,  and will set  attached_to_rpdg_board
    }
    else
    {
        attached_to_rpdg_board = false;
    }

    global.applogger.info(TAG, "init", "");
    rxhandler = callback;
    module.exports.setPollingPeriod(100);
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
        if(global.loghw.pwmlevels)
            global.applogger.info(TAG, "set PLC output ", outputid + "  to  " + level + "   applied " + apply + "  opts  " + options);

        if (apply)
            setHW_PLC();
    }
    else {

        var outindex = Number(outputid)
        pmw_outputs_pct[outindex - 1] = level;

        if(global.loghw.pwmlevels)
            global.applogger.info(TAG, "set PWM output ", outputid + "  to  " + level + "   applied " + apply + "  opts  " + options);

        if (apply)
            setHW_PWMLevels();
    }

}

exports.latchOutputLevelsToHW = function() {
    global.applogger.info(TAG, "*** latching output values to hardware now *** ", "");
    setHW_PLC();
    setHW_PWMLevels();
}

exports.getPWMPower = function() {

    var watts = [];
    for (var i = 0; i < pwm_current_amps.length; i++) {
        var amps = pwm_current_amps[i];

        var power = (amps * global.currentconfig.generalsettings.boardvoltage); //24);
        watts.push(power.toFixed(2))
    }
    return watts;
}


exports.setZero2TenDrive = function(inputs)
{
    try {


        var config = new Uint8Array(4);

        if(inputs.length == 4) {
            //drive is .25 mA --> 20 mA ,
            config[0] = inputs[0] / .25;
            config[1] = inputs[1] / .25;
            config[2] = inputs[2] / .25;
            config[3] = inputs[3] / .25;

            var hex = Buffer.from(config).toString('hex');
            global.applogger.info(TAG, "setHW_ConfigureZero2TenDrive ", "sending drive 4 bytes to hw: " + hex);
            // console.log("drive config sending to hw(byte0) :  " + config[0] );
            var wire = getI2cWire();
            if (wire != undefined) {
                wire.writeBytes(CMD_SET_ZERO_2_TEN_DRIVE, config, function (err) {
                    TeensyI2cErrorHandler("Set Config 0 to 10 drive",err);
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


// bitfield:  1 common anode,  0 common cathod (default)
exports.setPWMOutputPolarity = function(polconfig)
{
    try {

        var config = new Uint8Array(1);
        //if(polconfig.length == 1) {
        config[0] = polconfig;

        var hex = Buffer.from(config).toString('hex');
        global.applogger.info(TAG, "setPWMOutputPolarity ", "sending output config to hw: byte " + hex);
        var wire = getI2cWire();
        if (wire != undefined) {
            wire.writeBytes(CMD_SET_PWM_POLARITY, config, function (err) {
                TeensyI2cErrorHandler("Set PWM Polarity",err);


            });

        }
        else {
            global.applogger.info(TAG, "setPWMOutputPolarity", "no i2c hw");
        }
    } catch (err)
    {
        global.applogger.error(TAG, "setPWMOutputPolarity",  err);
    }
}




// bitfield:  1 = phase dim , / 0  = 0-10 volt dc dim,
exports.setHVDimMode = function(dimmodemask)
{
    try {
        global.applogger.info(TAG, "setHVDimMode ", "sending output config to hw");
        var config = new Uint8Array(1);
        config[0] = dimmodemask;
        var wire = getI2cWire();
        if (wire != undefined) {
            wire.writeBytes(CMD_SET_HV_DIM_MODE, config, function (err) {
                    TeensyI2cErrorHandler("Set HV Dim Mode",err);

            });

        }
        else {
            global.applogger.info(TAG, "setHVDimMode", "no i2c hw");
        }

    } catch (err)
    {
        global.applogger.error(TAG, "setHVDimMode",  err);
    }
}

exports.enableHardwarePolling = function(enable)
{
    polling_enabled = enable;
}


exports.getBoardType = function()
{

   // if(getI2cWire() == undefined || boardtype == undefined)
    if(!attached_to_rpdg_board)
        return "N/A";

    if(boardtype.toLowerCase().includes("high"))
        return "HV";
    else
        return "LV";
}



exports.getFWVersionNumber = function()
{
    try {
        if(fwversion == "??" || !attached_to_rpdg_board)
            return "n/a";

        return parseFloat(fwversion);
    } catch(ex)
    {
        return 0.0;
    }
}

exports.resetTinsey = function()
{
    reset_tinsy_counter = 0;
}


exports.setPollingPeriod = function(timerperiodms)
{
    if(periodictimer != undefined)
    {
        global.applogger.info(TAG, "Polling Timer cleared / stopped:",  "");
        clearInterval(periodictimer);
        periodictimer = undefined;
    }

    global.applogger.info(TAG, "Polling :",  "Polling Timer ", "started at rate: " + timerperiodms);
    periodictimer = setInterval(function () {
        peroidicHWPollingLoop();
        // global.applogger.info(TAG, "hw polling ---",  "timer fired");
    }, timerperiodms);
}


exports.readWetDryContacts = function()
{
    readHW_WetDryContactinputs();
}


function peroidicHWPollingLoop()
{
    if(polling_enabled) {
        readHW_0to10inputs();
       readHW_WetDryContactinputs();
       readHW_CurrentCounts();

        // ****************************************TINSEY RESET CODE  *****************************
        // check if the reset is in progress, or needs to get started..

        if(reset_tinsy_counter > -1)  //reset it active
        {
            if (reset_tinsy_counter == 0)  // 0 = start/active.
            {
                global.applogger.info(TAG, "@@@@@@@@@@@@@ setting Teensy line LOW (reset start) @@@@@@@@@@ ", "&&&&&&&&&&&&&&&&&&&&&&&&&");
                if (teensy_reset_line != undefined) {
                    global.applogger.info(TAG, "HW gpio line is valid ", "");
                    teensy_reset_line.writeSync(1);   // start.  lo
                }
                reset_tinsy_counter++;
            }
            else if(reset_tinsy_counter == 6)  // x * 100 ms, go high again,
            {
                global.applogger.info(TAG, "releasing Teensy line to HIGH (reset stop)",  "");
                if(teensy_reset_line != undefined)
                    teensy_reset_line.writeSync(0);   // start.

               // reset_tinsy_counter = -1;  //stop
            }
            else if(reset_tinsy_counter == 20)  // give the reset time to settle  before starting the checks again,
            {
                reset_tinsy_counter = -1;  //stop,  this will allow the checks to start again, below.
            }
            else
                reset_tinsy_counter++;
        }
        else
        {
            // if(i2c_error_count > 3)
            // {
            //     i2c_error_count = 0;
            //    global.applogger.info(TAG, "Teensy reset initiated because of i2c errors", "");
            //    module.exports.resetTinsey(); // this will set the counter to 0, ..to start the reset sequence...
            // }
        }

        // ***************************** END RESET CODE *************************

    }
}





/*
 function startHWPolling() {

 var BasePollingPeriod = 100;        // Time interval in mSec that we do the most frequent checks.
 global.applogger.info(TAG, "Polling :",  "polling timer started");
 periodictimer = setInterval(function () {
 peroidicHWPollingLoop();
 global.applogger.info(TAG, "hw polling ---",  "timer fired");
 }, BasePollingPeriod);
 }
 */

// ********************************************PRIVATE FUNCS ******************************************
// *****************************************************************************************************

function read_HWInfo() {
    try {
        //length,  then  byte 0 hw/ lv...etc,  2 bytes of version number of fw.
        var wire = getI2cWire();
        if (wire != undefined) {
            wire.readBytes(CMD_GET_INFO, 4, function (err, res) {
                if (res != null) {
                    var length = res[0];
                    global.applogger.info(TAG, "read_HWInfo -- length of return ",  length);
                   // var statebits = res[1];
                    if(length >= 3) {

                        if (res[1] == 0)
                            boardtype = "Low Voltage";
                        else
                            boardtype = "High Voltage";

                        // mask in next two bytes
                        var major = res[2];
                        var minor = res[3];
                        fwversion = major + "." + minor;
                    }
                    else
                    {
                        attached_to_rpdg_board = false;
                        global.applogger.error(TAG, "read_HWInfo -- no valid data came back(length) ",  " res is null");
                    }

                    printHWInfo();
                }
                else
                {
                    attached_to_rpdg_board = false;
                    global.applogger.error(TAG, "read_HWInfo -- no data back ",  " res is null");
                }

                if (err != null) {
                    attached_to_rpdg_board = false;
                    global.applogger.error(TAG, "read_HWInfo - exception", err);
                }
            });
        }
        else
        {
            global.applogger.error(TAG, "read_HWInfo -- now i2c wire", err);
        }

    } catch(err)
    {
        attached_to_rpdg_board = false;
        global.applogger.error(TAG, "read_HWInfo -- exception",  err);
    }
}


function TeensyI2cErrorHandler(message, err)
{
    if(err != null) {
        i2c_error_count++;
        global.applogger.error(TAG, "I2C Error: " + message, err);
    }
    else
        i2c_error_count = 0;
}

/***
 * write the hw PLC outputs
 */
function setHW_PLC()
{
    try {
        var wire = getI2cWire();
        if(wire != undefined) {
            wire.writeBytes(CMD_SETPLC, plc_output_switch, function (err) {
                TeensyI2cErrorHandler("Set PLC",err);
            });
           // wire.writeBytes(CMD_SETPLC, plc_output_switch, function (err) {
           //     TeensyI2cErrorHandler("Set PLC",err);
           // });
        }
    } catch(err)
    {
        global.applogger.error(TAG, "Set PLC LEVELS: (exception) ", err);
    }

    printPLCOutputLevels();
}


function setHW_PWMLevels()
{
    // global.applogger.error(TAG, "trying to set pwm levels in hw", "");
    try {
        var zone_levels = new Uint8Array(16);  // convert pct to level values (16 bit).
        var zoneidx = 0;
        for (var i = 0; i < pmw_outputs_pct.length; i++) {
            var npct = pmw_outputs_pct[i];

            // removed 6/23/17,  not needed any more.
            /* if(ishv && i < 7) { // dont invert output 8
                npct = 100 - npct;   //invert
                // if(i == 6) {    // for demo on 2/12/17,  only do scale / inversion  on channel 6 output 7
                npct = npct / 10;   // scale. 2/12/17

                if(npct > 9)
                    npct = 100;
            }  */

            var lev = (npct / 100) * 65535;
            var bytes = data_utils.intToByteArray(lev);
            //zone levels = 2 bytes per.
            zone_levels[zoneidx] = bytes[0];
            zone_levels[zoneidx + 1] = bytes[1];
            zoneidx += 2;
        }


         // var buff = "buffer: ";
         //for (var i = 0; i < zone_levels.length; i++) {
         //      buff += zone_levels[i] + "|";
         //}
         // global.applogger.info(TAG, "DEBUG pwm output set levels " , buff);




        var wire = getI2cWire();
        if (wire != undefined) {
            wire.writeBytes(CMD_SETPWM, zone_levels, function (err) {
                TeensyI2cErrorHandler("Set PWM",err);

            });

           // wire.writeBytes(CMD_SETPWM, zone_levels, function (err) {
           //     TeensyI2cErrorHandler("Set PWM",err);
           // });
        }
        // else {
        //     global.applogger.info(TAG, "setHW_PWMLevels:",  "no i2c wire");
        // }
    } catch (err)
    {
        global.applogger.error(TAG, "setHW_PWMLevels:",  err);
    }

    if(global.loghw.pwmlevels)
        printPWMOutputLevels();
}


function readHW_CurrentCounts()
{
    try {
        var wire = getI2cWire();
        if(wire != undefined) {
            wire.readBytes(CMD_READ_PWM_CURRENT, 17, function (err, res) {
                if (res != null) {
                    var length = res[0];

                   //   var buff = "buffer: " + res.length + "   -- ";
                   //  for (var i = 0; i < res.length; i++) {
                   //        buff += res[i] + "|";
                   //  }
                   //   global.applogger.info(TAG, "DEBUG(PWMCURRENT BUFF) " , buff);



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

                TeensyI2cErrorHandler("Read Current Counts",err);
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

            wire.readBytes(CMD_READ_ZERO_2_TENLEVEL, 9, function (err, res) {
                if (res != null) {
                    var length = res[0];
                    var index = 0;

                   // global.applogger.info(TAG, "DEBUG got 0 - 10 volt length " , res.length);

                  //  var buff = "buffer: ";
                   // for (var i = 0; i < res.length; i++) {
                   //       buff += res[i] + "|";
                   // }
                   //  global.applogger.info(TAG, "DEBUG" , buff);


                    // read the latest  value into our array.
                    for (var i = 1; i < res.length;) {
                        var msb = res[i];
                        var lsb = res[i + 1];
                        var val = (msb << 8) | lsb;
                      //  global.applogger.info(TAG, "DEBUG  " + msb + "  " + lsb,  "");
                        i += 2;
                        // 12/9/16 offset fix .
                        val = val * 1.1;
                        var pct = (val * 100) / 4096;
                        var voltage = pct / 10;
                        var absdelta = Math.abs(voltage - Zero_to_Ten_Volt_inputs[index]);
                        // update the stored value.
                        if (absdelta > .50) {  //for historisis (this is volts),
                            //global.applogger.info(TAG, "Input Delta > .50:  ", "abs delta: " + absdelta.toFixed(2) + "  " + Zero_to_Ten_Volt_inputs[index].toFixed(2) + " : " + voltage.toFixed(2));



                            Zero_to_Ten_Volt_inputs[index] = voltage;  // NOTE,  this is voltage,

                            var txvalue = voltage;

                            if(txvalue > 10.0)
                                txvalue = 10;

                            rxhandler("rpdg","levelinput", index+1, txvalue, undefined);
                        }

                        TeensyI2cErrorHandler("Read 0 to 10 inputs",err);

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
            wire.readBytes(CMD_READ_WET_DRY_CONTACTS, 2, function (err, res) {
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
                            rxhandler("rpdg", "contactinput", i + 1, state, undefined);
                        }
                        WetDryContacts[i] = state;
                    }
                    printWetDryContacts();
                }
                else
                {
                    TeensyI2cErrorHandler("Read Wet Dry Contacts","no data");
                }

                TeensyI2cErrorHandler("Read Wet Dry Contacts",err);

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

      //  global.applogger.info(TAG, "Board Voltage: ", Number(global.currentconfig.generalsettings.boardvoltage));

        var msg = "";
        // console.log("Current Counts: " + pwm_current_amps.length);
        for (var i = 0; i < pwm_current_amps.length; i++) {
            var amps = pwm_current_amps[i];

            var power = (amps * Number(global.currentconfig.generalsettings.boardvoltage));
            msg += "\nzone: " + i + " current: " + amps.toFixed(2) + " (amps)  power: " + power.toFixed(2) + " watts";
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



function printHWInfo()
{
    global.applogger.info(TAG, "***** HW INFO FROM RPDG BOARD*****", "");
    global.applogger.info(TAG, "Board Type: " + boardtype, "");
    global.applogger.info(TAG, "FW Version: " + fwversion, "");
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
    if (platform == "RaspberryPI" && attached_to_rpdg_board) {
        var address = 102;
        if(i2cwire == undefined)
            i2cwire = new i2c(address, {device: '/dev/i2c-1'});

        return i2cwire;
    }

    return undefined;
}

function resetTinsyProcessor()
{

}
