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

    global.applogger.info(TAG, "Script Started" , "");
    var count = 0;
    var state = true;
    scripttimer = setInterval(function () {

        global.applogger.info(TAG, "Script Line Loop ran: " + count, "");
        count++;

        if(!state)
        {
            state =true;
            service.invokeScene("ALL_ON","override");

        }
        else
        {
            state = false;
            service.invokeScene("ALL_OFF","override");
        }

        if(count > 5)   // auto stop after 10 loops
        {
            cancelScriptTimer();
            if(resultcb != undefined)
                resultcb("alarmmode", true);
        }
    }, 3000);
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
