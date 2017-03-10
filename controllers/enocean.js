/**
 * Created by Nick on 2/24/2017.
 */
var path = require('path');
var pad = require('pad');
var TAG = pad(path.basename(__filename),15);
//var express = require('express');
//var app = express();

var rxhandler = undefined;



exports.init = function(callback)
{
    global.applogger.info(TAG, "init", "");
    rxhandler = callback;

    startHWPolling();
}


exports.setOutputToLevel = function(outputid, level, apply, options)
{
    global.applogger.info(TAG, "set output ", outputid + "  to  " + level + "   applied " + apply + "  opts: " + options);
}


// this is just for debug,  will be async messgae from enocean...serial cb.
var tempcounter = 0;
function startHWPolling() {


    var BasePollingPeriod = 2000000;        // Time interval in mSec that we do the most frequent checks.
   // global.applogger.info(TAG, "HW Polling Started :",  "polling timer started");
    periodictimer = setInterval(function () {

        tempcounter += 1;
        if(tempcounter % 2 == 0)
        {
            tempcounter = 0;
            rxhandler("enocean", "3543545542", 3.3);  // input numbers on rpdg board will be numbered uniquily,  (0----10, ).
        }

        // contact input
        if(tempcounter % 4 == 0)
        {
            rxhandler("enocean", "3", 1);
        }


        if(tempcounter > 100)
            tempcounter = 0;

        // global.applogger.info(TAG, "hw polling",  "timer fired");
    }, BasePollingPeriod);
}

