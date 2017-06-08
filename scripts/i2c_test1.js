/**
 * Created by Nick on 4/19/2017.
 */

var path = require('path');
var pad = require('pad');
var ip = require('ip');
var TAG = pad(path.basename(__filename),15);

var resultcb = undefined;
var scripttimer = undefined;

exports.run = function(callback) {

    resultcb = callback;
    runscript();
}


exports.cancel = function() {

    global.applogger.info(TAG, "Script Force Cancelled Requested" , "");
    cancelScriptTimer();  // dont do cb,
}


exports.setInputLevel = function(inputname, level)
{
    if(inputname == "xyz")
    {

    }
}


var service = require('../controllers/service.js');
function runscript() {

    global.applogger.info(TAG, "i2c_test1 Script Started" , "");
    var count = 0;
    var value = 0;
    var outputid = 3;
    var direction = true;
    service.setRPDGPWMOutput(outputid,0);  // set to 0
    service.latchOutputValuesToHardware();

    scripttimer = setInterval(function () {
        count++;
       // global.applogger.info(TAG, "Script Line Loop ran: " + count, "");
        service.setRPDGPWMOutput(outputid,value);
        service.latchOutputValuesToHardware();
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
        if(count > 400)   // auto stop after X loops
        {
            cancelScriptTimer();
            if(resultcb != undefined)
                resultcb("i2c_test1", true);
        }

    }, 50);
}

function cancelScriptTimer()
{
    if(scripttimer != undefined)
    {
        clearInterval(scripttimer);
        scripttimer = undefined;
        global.applogger.info(TAG, "Script Timer **STOPPED**:  " , "");
    }
}
