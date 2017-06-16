/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
//Fixtures
var OnOffFixture = require('./OnOffFixture.js');
var DimFixture = require('./DimFixture.js');
var CCTFixture = require('./CCTFixture.js');
var RGBWFixture = require('./RGBWFixture.js');
// inputs(sensors..etc)

//var Dimmer = require('./Dimmer.js');
//var DayLightSensor = require('./DayLightSensor.js');
var LevelInput = require('./LevelInput.js');

var ContactInput = require('./ContactInput.js');

var Group = require('./Group.js');

var Scene = require('./Scene.js');
var SceneList = require('./SceneList');

var Configuration = function()
{
    this.type = Configuration.name;
    this.fixtures = [];
    this.levelinputs = [];
    this.contactinputs = [];
    this.groups = [];
    this.scenes = [];
    this.enocean = [];
    this.scenelists = [];
    //this.daylightlevelvolts = 0;
    this.occupiedstate = 0;

    this.daylightpollsec = 600; // in seconds. = 10 min

    this.boardvoltage = 24; // used for power calc

    this.sitezip = 97219;
    this.sitelatt = 45.4736058;
    this.sitelong = -122.7349017;

    Configuration.prototype.fromJson = function(obj) {

        this.sitezip = obj.sitezip;
        this.sitelatt = obj.sitelatt; //45.4736058;
        this.sitelong = obj.sitelong; //-122.7349017;

        if(obj.daylightpollsec != undefined)
            this.daylightpollsec = obj.daylightpollsec;

        if(obj.boardvoltage != undefined)
            this.boardvoltage = obj.boardvoltage;


        for (var i = 0; i < obj.fixtures.length; i++) {
            var fix = obj.fixtures[i];
            switch (fix.type) {
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

                case "cct":
                    var f = new CCTFixture(fix);
                    f.fromJson(fix);
                    this.fixtures.push(f);
                    break;

                case "rgbw":
                    var f = new RGBWFixture(fix);
                    f.fromJson(fix);
                    this.fixtures.push(f);
                    break;
                default:
                    break;
            }
        }

        for (var i = 0; i < obj.levelinputs.length; i++) {
            var input = obj.levelinputs[i];

            var f = new LevelInput();
            f.fromJson(input);
            this.levelinputs.push(f);

            /* switch (input.type) {

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
             }*/
        }


        if (obj.contactinputs != undefined) {
            for (var i = 0; i < obj.contactinputs.length; i++) {
                var input = obj.contactinputs[i];

                var f = new ContactInput();
                f.fromJson(input);
                this.contactinputs.push(f);
            }
        }


        if (obj.groups != undefined) {
            for (var i = 0; i < obj.groups.length; i++) {
                var group = obj.groups[i];
                var f = new Group();

                f.fromJson(group);
                this.groups.push(f);
            }
        }

        if (obj.scenes != undefined) {
            for (var i = 0; i < obj.scenes.length; i++) {
                var scene = obj.scenes[i];
                var f = new Scene();


                f.fromJson(scene);
                this.scenes.push(f);
            }
        }

        if (obj.scenelists != undefined) {
            for (var i = 0; i < obj.scenelists.length; i++) {
                var scene = obj.scenelists[i];
                var f = new SceneList();
                f.fromJson(scene);
                this.scenelists.push(f);
            }
        }

        if (obj.enocean != undefined) {
            for (var i = 0; i < obj.enocean.length; i++) {
                this.enocean.push(obj.enocean[i]);
                // f.fromJson(scene);
                // this.scenes.push(f);
            }
        }

    };


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
    };

    /*
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
     */





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
    };

    this.getSceneByName = function(name)
    {
        for(var i = 0; i < this.scenes.length; i++) {
            var scene = this.scenes[i];
            if (scene.name == name) // locate scene
            {
                return scene;
            }
        }
        return undefined;
    };

    this.getGroupByName = function(name)
    {
        for(var i = 0 ; i < this.groups.length; i++)  //find the group.
        {
            if (name == this.groups[i].name) {
                return this.groups[i];
            }
        }
        return undefined;
    };

    this.getLevelInputByName = function(name)
    {
        for(var i = 0 ; i < this.levelinputs.length; i++)  //find the group.
        {
            if (name == this.levelinputs[i].assignedname) {
                return this.levelinputs[i];
            }
        }
        return undefined;
    };
    this.getDaylightSensor = function()
    {
        for(var i = 0 ; i < this.levelinputs.length; i++)  //find the first dl .
        {
            if (this.levelinputs[i].type == "daylight") {
                return this.levelinputs[i];
            }
        }
        return undefined;
    };

    this.getContactInputByName = function(name)
    {
        for(var i = 0 ; i < this.contactinputs.length; i++)  //find the group.
        {
            if (name == this.contactinputs[i].assignedname) {
                return this.contactinputs[i];
            }
        }
        return undefined;
    };

    this.getInputByName = function(name)
    {
        for(var i = 0 ; i < this.contactinputs.length; i++)  //find the group.
        {
            if (name == this.contactinputs[i].assignedname) {
                return this.contactinputs[i];
            }
        }

        for(var i = 0 ; i < this.levelinputs.length; i++)  //find the group.
        {
            if (name == this.levelinputs[i].assignedname) {
                return this.levelinputs[i];
            }
        }

        return undefined;
    };

    this.getSceneListByName = function(name)
    {
        for(var i = 0 ; i < this.scenelists.length; i++)  //find the group.
        {
            if (name == this.scenelists[i].name) {
                return this.scenelists[i];
            }
        }
        return undefined;
    };

    this.renameFixtureInGroupsScenes = function(oldname, newname)
    {
        for(var i = 0 ; i < this.groups.length; i++)  ///for each group
        {
            var group = this.groups[i];
            for(var gi = 0; gi < group.fixtures.length; gi++)  //check all fixtures
            {
                var fixname = group.fixtures[gi];
                if(fixname == oldname)
                {
                    group.fixtures[gi] = newname;
                    break;
                }
            }

        }
        for(var i = 0 ; i < this.scenes.length; i++)  ///for each scene
        {
            var scene = this.scenes[i];
            for(var gi = 0; gi < scene.fixtures.length; gi++)  //check all fixtures
            {
                var fixinscene = scene.fixtures[gi];
                if(fixinscene.name == oldname)
                {
                    fixinscene.name = newname;
                    break;
                }
            }

        }
    };

    this.renameSceneInConfig = function(oldname, newname)
    {
        // wet dry contacts,
        for(var i = 0 ; i < this.contactinputs.length; i++)  ///for each group
        {
            var ci = this.contactinputs[i];
            if(ci.active_action.includes("scene") && ci.active_action.includes(oldname))
            {
                ci.active_action = "scene_@@_"+newname;
            }
            if(ci.inactive_action.includes("scene") && ci.inactive_action.includes(oldname))
            {
                ci.inactive_action = "scene_@@_"+newname;
            }
        }

        // schedule., handled in sched mgr, and within sched file.s
        // scene lists
        for(var i = 0 ; i < this.scenelists.length; i++)  ///for each group
        {
            var sl = this.scenelists[i];
            for(var gi = 0; gi < sl.scenes.length; gi++)  //check all scenes in scene list
            {
                var scene = sl.scenes[gi];
                if(scene == oldname)
                {
                    sl.scenes[gi] = newname;
                }
            }
        }
    };

    this.renameGroupInConfig = function(oldname, newname)
    {
        // wet dry contacts,
        for(var i = 0 ; i < this.contactinputs.length; i++)  ///for each group
        {
            var ci = this.contactinputs[i];
            if(ci.active_action.includes("msg") && ci.active_action.includes(oldname))
            {
                var parts = ci.active_action.split("_@@_");
                if(parts.length == 4)
                {
                    ci.active_action = "msg_@@_"+parts[1] + "_@@_"+ newname + "_@@_"+ parts[3];
                }
            }
            if(ci.inactive_action.includes("msg") && ci.inactive_action.includes(oldname))
            {
                var parts = ci.active_action.split("_@@_");
                if(parts.length == 4)
                {
                    ci.inactive_action = "msg_@@_"+parts[1] + "_@@_"+ newname + "_@@_"+ parts[3];
                }
            }
        }

        // level inputs.

        for(var i = 0 ; i < this.levelinputs.length; i++)  ///for each group
        {
            var li = this.levelinputs[i];

            if(li.group == oldname)
            {
                li.group = newname;
            }
        }
    };
};

module.exports = Configuration;
