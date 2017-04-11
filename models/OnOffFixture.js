/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
var pad = require('pad');
var path = require('path');
var FixtureParameters = require('./FixtureParameters');
var TAG = pad(path.basename(__filename),15);

var filter_utils = require('../utils/filter_utils.js');
var data_utils = require('../utils/data_utils.js');

var OnOffFixture = function()
{
    //model.
    this.type = "on_off"; //OnOffFixture.name;
    this.assignedname = "";
    this.interface = undefined;
    this.interfacename = "";
    this.outputid = "";
    this.image = "";
    this.candledim = false;
    this.boundinputs = [];
    this.parameters = new FixtureParameters();

    // status
    this.level = 0;
    this.previousvalue = 0;
    this.lastupdated = new moment();
    this.powerwatts = 0;
    this.daylightlimited = false;

    // 3/21/17, post filter value,(hw value)


    OnOffFixture.prototype.fromJson = function(obj)
    {
        //this.parameters.dimoptions =
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

    OnOffFixture.prototype.create = function(name, interface, interfacename, outputid, params)
    {
        this.assignedname = name;
        this.interface = interface;
        this.interfacename = interfacename;
        this.outputid = outputid;
        this.parameters = params;
    };

    this.setLevel = function(requestobj, apply){

        var filterblocked = false;
      //  if(this.interfacename != "rpdg-plc") {

            var dlsensor = this.getMyDaylightSensor();
            var isdaylightbound = false;
            var daylightvolts = 0;
            if (dlsensor != undefined) {
                isdaylightbound = true;
                daylightvolts = dlsensor.value;
            }

            var returndataobj = filter_utils.LightLevelFilter(requestobj.requesttype, requestobj.level, this.parameters, isdaylightbound,daylightvolts);
            this.daylightlimited = returndataobj.isdaylightlimited;
            if(returndataobj.modifiedlevel > -1) {

                var modpct = returndataobj.modifiedlevel;
                requestobj.level = modpct;
            }
            else
                filterblocked = true;
       // }


        if(filterblocked)
            return;


        var modlevel = 0;
        if(requestobj.level > 0)
            modlevel = 100;

        this.previousvalue= Number(this.value);
        this.level = Number(modlevel);
        this.lastupdated = moment();

        var options = (this.interfacename.includes("plc"))?"plc":undefined;
        this.interface.setOutputToLevel(this.outputid, this.level, apply, options);


        var logobj = {};
        logobj.date = new moment().unix();
        logobj.level = this.level.toFixed();
        data_utils.appendOutputObjectLogFile(this.assignedname, logobj);
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
    }
};



module.exports = OnOffFixture;

