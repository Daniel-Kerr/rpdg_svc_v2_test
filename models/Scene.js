/**
 * Created by Nick on 3/6/2017.
 */

var OnOffSetting = require('./OnOffSetting.js');
var DimSetting = require('./DimSetting.js');
var CCTSetting = require('./CCTSetting.js');
var RGBWSetting = require('./RGBWSetting.js');
var Scene = function()
{
    this.name = "";
    this.fixtures = []; // name list, , with levels  / color temps. /
    Scene.prototype.fromJson = function(obj)
    {

        for (var prop in obj) {
            if(prop != "fixtures")
                this[prop] = obj[prop];
        }


        if(obj.fixtures != undefined)
        {
            for(var i = 0; i < obj.fixtures.length; i++)
            {
                var setting = obj.fixtures[i];
                switch(setting.type)
                {
                    case "on_off":
                        var set = new OnOffSetting();
                        set.fromJson(setting);
                        this.fixtures.push(set);
                        break;
                    case "dim":
                        var set = new DimSetting();
                        set.fromJson(setting);
                        this.fixtures.push(set);
                        break;

                    case "cct":
                        var set = new CCTSetting();
                        set.fromJson(setting);
                        this.fixtures.push(set);
                        break;
                    case "rgbw":
                        var set = new RGBWSetting();
                        set.fromJson(setting);
                        this.fixtures.push(set);
                        break;
                    default:
                        break;
                }
            }
        }
    }

    Scene.prototype.create = function(name)
    {
        this.name = name;
    }


    this.containsFixture = function(name)
    {
        for(var i = 0; i < this.fixtures.length; i++) {
            var fix = this.fixtures[i];
            if (fix.name == name) // locate scene
            {
                return true;
            }
        }
        return false;
    }


    this.removeFixture = function(name)
    {
        for(var i = 0; i < this.fixtures.length; i++) {
            var fix = this.fixtures[i];
            if (fix.name == name) // locate scene
            {
                this.fixtures.splice(i,1);
                break;
            }
        }
    }
    this.addFixture = function(name, type)
    {
        switch(type)
        {
            case "on_off":
                var set = new OnOffSetting();
                set.name = name;
                this.fixtures.push(set);
                break;
            case "dim":
                var set = new DimSetting();
                set.name = name;
                this.fixtures.push(set);
                break;

            case "cct":
                var set = new CCTSetting();
                set.name = name;
                this.fixtures.push(set);
                break;
            case "rgbw":
                var set = new RGBWSetting();
                set.name = name;
                this.fixtures.push(set);
                break;
            default:
                break;
        }
    }

    this.getFixtureByName = function(name)
    {
        for(var i = 0; i < this.fixtures.length; i++) {
            var fix = this.fixtures[i];
            if (fix.name == name) // locate scene
            {
                return fix;
            }
        }
    }
};

module.exports = Scene;

