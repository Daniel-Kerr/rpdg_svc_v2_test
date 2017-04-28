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
 //   this.boundinputs = [];
    this.twelvevolt = false;
    this.parameters = new FixtureParameters();

    // status
    this.level = 0;
    this.lastuserequestedlevel = 0;
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

       // if(obj.boundinputs != undefined)
       //     this.boundinputs = obj.boundinputs;
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

        if(requestobj.requesttype == "override" || requestobj.requesttype == "wallstation" || requestobj.requesttype == "wetdrycontact")
        {
            this.lastuserequestedlevel = requestobj.level;
        }
        else if(requestobj.requesttype == "daylight")
        {
            requestobj.level = this.lastuserequestedlevel;
        }

        var filterblocked = false;

        var dlsensor = global.currentconfig.getDaylightSensor();
        var daylightvolts = 0;
        if (dlsensor != undefined) {
            daylightvolts = dlsensor.value;
        }


        var returndataobj = filter_utils.LightLevelFilter(requestobj.requesttype, requestobj.level, this.parameters,daylightvolts);
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

        var outlevel = this.calculateOutputLevel(this.level);

        this.interface.setOutputToLevel(this.outputid, outlevel, apply, options);


        var logobj = {};
        logobj.date = new moment().toISOString();
        logobj.level = this.level.toFixed();
        data_utils.appendOutputObjectLogFile(this.assignedname, logobj);
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

    this.getLevel=function(){
        return this.level;
    };
    this.getPreviousLevel=function(){
        return this.previousvalue;
    };
    this.getlastupdated=function() {
        return this.lastupdated;
    };

};



module.exports = OnOffFixture;

