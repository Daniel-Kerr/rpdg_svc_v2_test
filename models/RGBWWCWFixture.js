/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
var pad = require('pad');
var path = require('path');
var FixtureParameters = require('./FixtureParameters');
var filter_utils = require('../utils/filter_utils.js');
var data_utils = require('../utils/data_utils.js');

var RGBWWCWFixture = function(name, interface, outputid)
{
    this.type = "rgbwwcw"; //CCTFixture.name;
    this.assignedname = name;
    this.interface = interface;
    this.interfacename = "";
    this.outputid = "";
    this.image = "";
   // this.boundinputs = [];
    this.commonanode = false;
    this.twelvevolt = false;
    this.parameters = new FixtureParameters();

    // status
    this.red = 100;
    this.green = 100;
    this.blue = 100;
    this.warmwhite = 100;
    this.coldwhite = 100;

    this.lastuserrequestedwarmwhite = 100;
    this.lastuserrequestedcoldwhite = 100;

    this.previousred = 0;
    this.previousgreen = 0;
    this.previousblue = 0;
    this.previouswarmwhite = 0;
    this.previouscoldwhite = 0;

    this.lastupdated = undefined;
    this.powerwatts = 0;
    this.daylightlimited = false;


    RGBWWCWFixture.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            if(prop != "parameters" || prop != "boundinputs")
                this[prop] = obj[prop];
        }
        this.parameters = new FixtureParameters();
        if(obj.parameters != undefined )
            this.parameters.fromJson(obj.parameters);

    };

    this.setLevel = function(requestobj, apply){

        if(requestobj.requesttype == "override" || requestobj.requesttype == "wallstation" || requestobj.requesttype == "wetdrycontact")
        {
            this.lastuserrequestedwarmwhite = requestobj.warmwhite;
            this.lastuserrequestedcoldwhite = requestobj.coldwhite;
        }
        else if(requestobj.requesttype == "daylight")
        {
            requestobj.warmwhite = this.lastuserrequestedwarmwhite;
            requestobj.coldwhite = this.lastuserrequestedcoldwhite;
        }

        var dlsensor = global.currentconfig.getDaylightSensor();
        var daylightvolts = undefined;
        if (dlsensor != undefined) {
            daylightvolts = dlsensor.value;
        }

        var red = this.red;
        if(requestobj.red != undefined)
            red = requestobj.red;

        var green = this.green;
        if(requestobj.green != undefined)
            green = requestobj.green;

        var blue = this.blue;
        if(requestobj.blue != undefined)
            blue = requestobj.blue;

        var warmwhite = this.warmwhite;
        if(requestobj.warmwhite != undefined)
            warmwhite = requestobj.warmwhite;

        var coldwhite = this.coldwhite;
        if(requestobj.coldwhite != undefined)
            coldwhite = requestobj.coldwhite;


        // dl/light filter (currently only adjusts the warm white.. *

        // **************** NOTE ************************* 6/22/
        var returndataobj = filter_utils.LightLevelFilter(requestobj.requesttype, warmwhite, this.parameters,daylightvolts);
        this.daylightlimited = returndataobj.isdaylightlimited;
        if(returndataobj.modifiedlevel > -1) {    // if filter returns a valid value,  apply it,  (use it),  else use above .
            var modpct = returndataobj.modifiedlevel;
            warmwhite = modpct;  // modify the req obj.
        }


        // ******************************** bogus data point entry ,  to make nice graph bug 258 ******************
        // place bogus data point into log for obj, with current datetime, but last level.
        var now = moment();
        if(this.lastupdated != undefined)
        {
            var deltamin = now.diff(moment(this.lastupdated),'minutes');
            if(deltamin >= 60)   // 60 min,
            {
                var logobj = {};
                var backtime = now.subtract(1, "minutes");
                var logobj = {};
                logobj.date = backtime.toISOString();
                logobj.red = Number(this.red).toFixed();
                logobj.green = Number(this.green).toFixed();
                logobj.blue = Number(this.blue).toFixed();
                logobj.warmwhite = Number(this.warmwhite).toFixed();
                logobj.coldwhite = Number(this.coldwhite).toFixed();
                data_utils.appendOutputObjectLogFile(this.assignedname, logobj);
            }
        }
        // ***************************************************************************************************


        // for common anode, we need the range to be inverted,
        // for 12 V device range is 50%, on high side, meaning
        // 50 - 100,
        this.previousred = this.red;
        this.red = red;
        var setred = this.calculateOutputLevel(red);
        this.interface.setOutputToLevel(Number(this.outputid), setred, apply);

        this.previousgreen = this.green;
        this.green = green;
        var setgreen = this.calculateOutputLevel(green);
        var gchannel = Number(this.outputid) + 1;
        this.interface.setOutputToLevel(gchannel, setgreen, apply);

        this.previousblue = this.blue;
        this.blue = blue;
        var setblue = this.calculateOutputLevel(blue);
        var bchannel = Number(this.outputid) + 2;
        this.interface.setOutputToLevel(bchannel, setblue, apply);

        this.previouswarmwhite = this.warmwhite;
        this.warmwhite = warmwhite;
        var wchannel = Number(this.outputid) + 3;
        var setwarmwhite = this.calculateOutputLevel(warmwhite);
        this.interface.setOutputToLevel(wchannel, setwarmwhite, apply);

        this.previouscoldwhite = this.coldwhite;
        this.coldwhite = coldwhite;
        var wchannel = Number(this.outputid) + 4;
        var setcoldwhite = this.calculateOutputLevel(coldwhite);
        this.interface.setOutputToLevel(wchannel, setcoldwhite, apply);

        this.lastupdated = moment();

        var logobj = {};
        logobj.date = new moment().toISOString();
        logobj.red = Number(this.red).toFixed();
        logobj.green = Number(this.green).toFixed();
        logobj.blue = Number(this.blue).toFixed();
        logobj.warmwhite = Number(this.warmwhite).toFixed();
        logobj.coldwhite = Number(this.coldwhite).toFixed();
        data_utils.appendOutputObjectLogFile(this.assignedname, logobj);
    };

    this.getvalue=function(){
        return this.value;
    };
    this.getprevvalue=function(){
        return this.previousvalue;
    };
    this.getlastupdated=function() {
        return this.lastupdated;
    };

    this.isBoundToInput = function(name)
    {
        for(var k = 0; k < this.boundinputs.length; k++)
        {
            if(this.boundinputs[k] == name)
                return true;
        }
        return false;
    };
    this.getMyDaylightSensor = function()
    {
        for(var i = 0; i < this.boundinputs.length; i++)
        {
            var inputname = this.boundinputs[i];
            var inputobj = global.currentconfig.getLevelInputByName(inputname);
            if(inputobj != undefined)
            {
                if(inputobj.type == "daylight")
                {
                    // this is out bound dl sensor,
                    return inputobj;
                }
            }
        }
        return undefined
    };

    this.calculateOutputLevel = function(level)
    {
        var returnlevel = level;
        if(this.twelvevolt)
            returnlevel /= 2;

        if(this.commonanode)
            returnlevel = 100 - returnlevel;

        return returnlevel;
    };
};



module.exports = RGBWWCWFixture;
