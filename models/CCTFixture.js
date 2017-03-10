/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
var pad = require('pad');
var path = require('path');
var FixtureParameters = require('./FixtureParameters');

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



    this.setvalue = function(colortemp, brightness, apply){
        if(colortemp != undefined) {
            this.previouscolortemp = this.colortemp;
            this.colortemp = colortemp;
            // to do ,  translate color temp to level, here,

            this.interface.setOutputToLevel(this.outputid, this.colortemp, apply);
        }
        if(brightness != undefined)
        {
            this.previousbrightness = this.brightness;
            this.brightness = brightness;
            var bchannel = Number(this.outputid) + 1;
            this.interface.setOutputToLevel(bchannel, this.brightness, apply);
        }
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
};


module.exports = CCTFixture;
