/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
var pad = require('pad');
var path = require('path');
var FixtureParameters = require('./FixtureParameters');
var filter_utils = require('../utils/filter_utils.js');

var CCTFixture = function(name, interface, outputid)
{
    this.type = "cct"; //CCTFixture.name;
    this.assignedname = name;
    this.interface = interface;
    this.interfacename = "";
    this.outputid = "";
    this.image = "";
    this.candledim = false;
    this.boundinputs = [];
    this.parameters = new FixtureParameters();

    // status
    this.colortemp = 3500;
    this.brightness = 100;
    this.previouscolortemp = 3500;
    this.previousbrightness = 100;
    this.lastupdated = undefined;
    this.powerwatts = 0;
    this.daylightlimited = false;

    //filteredlevel
    this.hwwarm = 0;
    this.hwcool = 0;

    CCTFixture.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            if(prop != "parameters" || prop != "boundinputs")
                this[prop] = obj[prop];

        }
        this.parameters = new FixtureParameters();
        if(obj.parameters != undefined )
            this.parameters.fromJson(obj.parameters);

        if(obj.boundinputs != undefined)
            this.boundinputs = obj.boundinputs;
    };

    this.setLevel = function(requestobj, apply){

        var dlsensor = global.currentconfig.getDayLightSensor();

        var isdaylightbound = false;
        if(dlsensor != undefined)
            isdaylightbound = this.isBoundToInput(dlsensor.assignedname);

       // var isdaylightbound = this.isBoundToInput(dlsensor.assignedname);

        var brightness = this.brightness;   //use current by default
        if(requestobj.brightness != undefined)
            brightness = requestobj.brightness;   //use requested if present,

        var colortemp = this.colortemp;
        if(requestobj.colortemp != undefined)
            colortemp = requestobj.colortemp;

        // dl/light filter
        var returndataobj = filter_utils.LightLevelFilter(requestobj.requesttype, brightness, this.parameters, isdaylightbound);
        this.daylightlimited = returndataobj.isdaylightlimited;
        if(returndataobj.modifiedlevel > -1) {    // if filter returns a valid value,  apply it,  (use it),  else use above .
            var modpct = returndataobj.modifiedlevel;
            brightness = modpct;  // modify the req obj.
        }

        // color temp calculation
        var warmcoolvals = filter_utils.CalculateCCTAndDimLevels(2000, 6500, colortemp, brightness, this.candledim);

        this.previouscolortemp = this.colortemp;
        this.colortemp = colortemp;
        this.interface.setOutputToLevel(Number(this.outputid), warmcoolvals[0], apply);

        this.previousbrightness = this.brightness;
        this.brightness = brightness;
        var bchannel = Number(this.outputid) + 1;
        this.hwwarm = warmcoolvals[0];
        this.hwcool = warmcoolvals[1];
        this.interface.setOutputToLevel(bchannel, warmcoolvals[1], apply);

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
    }
};


module.exports = CCTFixture;
