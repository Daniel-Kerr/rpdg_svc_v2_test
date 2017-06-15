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
    var init = false;
    scripttimer = setInterval(function () {  //10sec timer

        count++;
        if(!init)
        {
            init =true;
            service.invokeScene("ALL_ON","override", false);      // <---- here is where you set the desired scene.
            // disable all inputs to be ignored.
            enableAllInputs(false);
        }

        if(count > 10)
        {
            enableAllInputs(true);
            cancelScriptTimer();
            if(resultcb != undefined)
                resultcb("quietmode", true);
        }
    }, 10000);
}


function enableAllInputs(enable)
{
    // disable all inputs to be ignored.
    for(var i = 0; i < global.currentconfig.contactinputs.length;i++)
    {
        var input = global.currentconfig.contactinputs[i];
        input.enabled = enable;
    }

    for(var i = 0; i < global.currentconfig.levelinputs.length;i++)
    {
        var input = global.currentconfig.levelinputs[i];
        input.enabled = enable;
    }
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
