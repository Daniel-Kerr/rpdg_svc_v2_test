/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
//Fixtures
var OnOffFixture = require('./OnOffFixture.js');
var DimFixture = require('./DimFixture.js');
var CCTFixture = require('./CCTFixture.js');

// inputs(sensors..etc)
var MotionSensor = require('./MotionSensor.js');
var OccSensor = require('./OccSensor.js');
var Dimmer = require('./Dimmer.js');
var DayLightSensor = require('./DayLightSensor.js');

var ContactInput = require('./ContactInput.js');

var Group = require('./Group.js');

var Configuration = function(obj)
{
    this.type = Configuration.name;
    this.fixtures = [];
    this.levelinputs = [];
    this.contactinputs = [];
    this.groups = [];

    for(var i = 0; i < obj.fixtures.length; i++)
    {
        var fix = obj.fixtures[i];
        switch(fix.type)
        {
            case "on_off":
                var f = new OnOffFixture();
                f.fromJson(fix);
                this.fixtures.push(f);
                break;

            case "dim":
                var f = new DimFixture(fix);
                f.fromJson(fix);
                this.fixtures.push(f);
                break;

            default:
                break;
        }
    }

    for(var i = 0; i < obj.levelinputs.length; i++)
    {
        var input = obj.levelinputs[i];
        switch(input.type)
        {

            case "dimmer":
                var f = new Dimmer();
                f.fromJson(input);
                this.levelinputs.push(f);
                break;

            case "daylight":
                var f = new DayLightSensor();
                f.fromJson(input);
                this.levelinputs.push(f);
                break;
            default:
                break;
        }
    }


    if(obj.contactinputs != undefined) {
        for (var i = 0; i < obj.contactinputs.length; i++) {
            var input = obj.contactinputs[i];

            var f = new ContactInput();
            f.fromJson(input);
            this.contactinputs.push(f);
        }
    }


    if(obj.groups != undefined) {
        for (var i = 0; i < obj.groups.length; i++) {
            var group = obj.groups[i];
            var f = new Group();

            f.fromJson(group);
            this.groups.push(f);
        }
    }

    this.getFixtureByName = function(name)
    {
        for(var i = 0; i < this.fixtures.length; i++)
        {
            var fix = this.fixtures[i];
            if(fix.assignedname == name)
            {
                return fix;
            }
        }
        return undefined;
    }

    this.getDayLightSensor = function()
    {
        for(var i = 0; i < this.levelinputs.length; i++)
        {
            var input = this.levelinputs[i];
            if(input.type == "daylight")
            {
                return input;
            }
        }
        return undefined;
    }

    this.initHWInterfaces = function(rpdg, enocean)
    {
        for(var i = 0; i < this.fixtures.length; i++)
        {
            var fix = this.fixtures[i];
            if(fix.interfacename == "rpdg-pwm" || fix.interfacename == "rpdg-plc")
                fix.interface = rpdg;
            else
                fix.interface = enocean;
        }
    }
};

module.exports = Configuration;
