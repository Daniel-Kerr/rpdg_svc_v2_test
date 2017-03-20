/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
var pad = require('pad');
var path = require('path');
var FixtureParameters = require('./FixtureParameters');
var filter_utils = require('../utils/filter_utils.js');
var DimFixture = function(name, interface, outputid)
{
    //model.
    this.type = "dim"; //DimFixture.name;
    this.assignedname = "";
    this.interface = {};
    this.interfacename = "";
    this.outputid = "";
    this.image = "";
    this.candledim = false;
    this.parameters = new FixtureParameters();

    // status
    this.level = 0;
    this.previousvalue = 0;
    this.lastupdated = undefined;
    this.powerwatts = 0;
    this.daylightlimited = false;


    DimFixture.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            if(prop != "parameters")
                this[prop] = obj[prop];

        }
        this.parameters = new FixtureParameters();
        this.parameters.fromJson(obj.parameters);

        if(obj.boundinputs != undefined)
            this.boundinputs = obj.boundinputs;

    };

    DimFixture.prototype.create = function(name, interface, interfacename, outputid, params)
    {
        this.assignedname = name;
        this.interface = interface;
        this.interfacename = interfacename;
        this.outputid = outputid;
        this.parameters = params;
    };


    this.setLevel = function(requestobj, apply){

        var dlsensor = global.currentconfig.getDayLightSensor();

        var isdaylightbound = false;
        if(dlsensor != undefined)
            isdaylightbound = this.isBoundToInput(dlsensor.assignedname);
       // var isdaylightbound = this.isBoundToInput(dlsensor.assignedname);

        var returndataobj = filter_utils.LightLevelFilter(requestobj.requesttype, requestobj.level, this.parameters, isdaylightbound);
        this.daylightlimited = returndataobj.isdaylightlimited;

        if(returndataobj.modifiedlevel > -1) {

            var modpct = returndataobj.modifiedlevel;
            requestobj.level = modpct;
            this.previousvalue = Number(this.value);
            this.level = Number(requestobj.level);
            this.lastupdated = moment();
            this.interface.setOutputToLevel(this.outputid, this.level, apply);
        }

    };

    this.getLevel=function(){
        return this.level;
    };
    this.getPreviousLevel=function(){
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


module.exports = DimFixture;
