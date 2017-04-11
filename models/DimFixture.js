/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
var pad = require('pad');
var path = require('path');
var TAG = pad(path.basename(__filename),15);
var FixtureParameters = require('./FixtureParameters');
var filter_utils = require('../utils/filter_utils.js');
var data_utils = require('../utils/data_utils.js');
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

        this.stopAutoAdjustTimer(this.assignedname);
        if(requestobj.level > this.level && this.parameters.brightenrate > 0)
        {
            this.startAutoAdjustTimer(this, requestobj.level, requestobj.requesttype);
        }
        else if(requestobj.level < this.level && this.parameters.dimrate > 0)
        {
            this.startAutoAdjustTimer(this, requestobj.level, requestobj.requesttype);
        }
        else {

            var dlsensor = this.getMyDaylightSensor();
            var isdaylightbound = false;
            var daylightvolts = 0;
            if (dlsensor != undefined) {
                isdaylightbound = true;
                daylightvolts = dlsensor.value;
            }

            var returndataobj = filter_utils.LightLevelFilter(requestobj.requesttype, requestobj.level, this.parameters, isdaylightbound, daylightvolts);
            this.daylightlimited = returndataobj.isdaylightlimited;

            if (returndataobj.modifiedlevel > -1) {

                var modpct = returndataobj.modifiedlevel;
                requestobj.level = modpct;
                this.previousvalue = Number(this.value);
                this.level = Number(requestobj.level);
                this.lastupdated = moment();
                this.interface.setOutputToLevel(this.outputid, this.level, apply);


                var logobj = {};
                logobj.date = new moment().unix();
                logobj.level = this.level.toFixed();
                data_utils.appendOutputObjectLogFile(this.assignedname, logobj);
            }
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

    // ********************************************* START MOVE *************************




    var autoadjusttimer = undefined;
    var autoadjusttargetlevel = 0;
    var autoadjuststartlevel = 0;
    var autoadjustrequesttype = "";

    this.startAutoAdjustTimer = function(fixture, targetlevel, requesttype)
    {
        autoadjustrequesttype = requesttype;
        autoadjuststartlevel = fixture.level;
        autoadjusttargetlevel = targetlevel;

        if(autoadjusttimer == undefined)
        {
            autoadjusttimer = setInterval(this.autoAdjustLevel,1000, fixture);
            global.applogger.info(TAG, "Auto Adjust Timer Started:  " , fixture.assignedname);
        }
    };

    this.stopAutoAdjustTimer = function(name)
    {
        if(autoadjusttimer != undefined)
        {
            clearInterval(autoadjusttimer);
            autoadjusttimer = undefined;
            autoadjusttargetlevel = 0;
            autoadjuststartlevel = 0;
            autoadjustrequesttype = "";
            global.applogger.info(TAG, "Auto Adjust Timer **STOPPED**:  " , name);
        }
    };


    this.autoAdjustLevel = function(fixobj)
    {
     //   global.applogger.info(TAG, "Auto Adjust Timer called: fix: -- " , fixobj.assignedname);
        var stepsize = 0;
        var requestlevel = 0;

        var canceltimer = false;

        var delta = autoadjusttargetlevel - autoadjuststartlevel;
        if(delta > 0) {
            stepsize = delta / fixobj.parameters.brightenrate;
            requestlevel = fixobj.level + stepsize;
            if(requestlevel >= autoadjusttargetlevel) {
                requestlevel = autoadjusttargetlevel;
                canceltimer = true;
            }

        }
        else if(delta < 0) {
            stepsize = delta / fixobj.parameters.dimrate;
            requestlevel = fixobj.level + stepsize;
            if(requestlevel <= autoadjusttargetlevel) {
                requestlevel = autoadjusttargetlevel;
                canceltimer = true;
            }
        }


        var dlsensor = fixobj.getMyDaylightSensor();


        var isdaylightbound = false;
        var daylightvolts = 0;
        if (dlsensor != undefined) {
            isdaylightbound = true;
            daylightvolts = dlsensor.value;
        }

        var returndataobj = filter_utils.LightLevelFilter(autoadjustrequesttype, requestlevel, fixobj.parameters, isdaylightbound, daylightvolts);
        this.daylightlimited = returndataobj.isdaylightlimited;

        if (returndataobj.modifiedlevel > -1) {

            var modpct = returndataobj.modifiedlevel;
            requestlevel = modpct;
            fixobj.previousvalue = Number(fixobj.value);
            fixobj.level = Number(requestlevel);
            fixobj.lastupdated = moment();
            fixobj.interface.setOutputToLevel(fixobj.outputid, fixobj.level, true);

            var logobj = {};
            logobj.date = new moment().unix();
            logobj.level = fixobj.level.toFixed();
            data_utils.appendOutputObjectLogFile(fixobj.assignedname, logobj);
        }

        if(canceltimer)
            fixobj.stopAutoAdjustTimer(fixobj.assignedname);
    };

    // *********************** END MOVE **************




};




module.exports = DimFixture;
