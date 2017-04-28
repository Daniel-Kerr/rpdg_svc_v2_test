/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
var pad = require('pad');
var path = require('path');
var FixtureParameters = require('./FixtureParameters');
var filter_utils = require('../utils/filter_utils.js');

var RGBWFixture = function(name, interface, outputid)
{
    this.type = "rgbw"; //CCTFixture.name;
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
    this.red = 0;
    this.green = 0;
    this.blue = 0;
    this.white = 0;
    this.lastuserrequestedwhite = 0;

    this.previousred = 0;
    this.previousgreen = 0;
    this.previousblue = 0;
    this.previouswhite = 0;

    this.lastupdated = undefined;
    this.powerwatts = 0;
    this.daylightlimited = false;


    RGBWFixture.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            if(prop != "parameters" || prop != "boundinputs")
                this[prop] = obj[prop];

        }
        this.parameters = new FixtureParameters();
        if(obj.parameters != undefined )
            this.parameters.fromJson(obj.parameters);

       // if(obj.boundinputs != undefined)
        //    this.boundinputs = obj.boundinputs;
    };

    this.setLevel = function(requestobj, apply){

        if(requestobj.requesttype == "override" || requestobj.requesttype == "wallstation" || requestobj.requesttype == "wetdrycontact")
        {
            this.lastuserrequestedwhite = requestobj.white;
        }
        else if(requestobj.requesttype == "daylight")
        {
            requestobj.white = this.lastuserrequestedwhite;
        }

        var dlsensor = global.currentconfig.getDaylightSensor();
        var daylightvolts = 0;
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

        var white = this.white;
        if(requestobj.white != undefined)
            white = requestobj.white;

        // dl/light filter
        var returndataobj = filter_utils.LightLevelFilter(requestobj.requesttype, white, this.parameters,daylightvolts);
        this.daylightlimited = returndataobj.isdaylightlimited;
        if(returndataobj.modifiedlevel > -1) {    // if filter returns a valid value,  apply it,  (use it),  else use above .
            var modpct = returndataobj.modifiedlevel;
            white = modpct;  // modify the req obj.
        }

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

        this.previouswhite = this.white;
        this.white = white;
        var wchannel = Number(this.outputid) + 3;
        var setwhite = this.calculateOutputLevel(white);
        this.interface.setOutputToLevel(wchannel, setwhite, apply);
        this.lastupdated = moment();
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



module.exports = RGBWFixture;
