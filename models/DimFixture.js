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
    this.twelvevolt = false;
    this.parameters = new FixtureParameters();

    // status
    this.level = 100;
    this.lastuserequestedlevel = 100;

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

       // if(obj.boundinputs != undefined)
       //     this.boundinputs = obj.boundinputs;

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


        if(requestobj.requesttype == "override" || requestobj.requesttype == "wallstation" || requestobj.requesttype == "wetdrycontact")
        {
            this.lastuserequestedlevel = requestobj.level;
        }
        else if(requestobj.requesttype == "daylight")
        {
            requestobj.level = this.lastuserequestedlevel;
        }


        // 4/18/17  ******************************** Moved filter up. *******************
        this.stopAutoAdjustTimer(this.assignedname);  //stop timer...

        var dlsensor = global.currentconfig.getDaylightSensor();
        var daylightvolts = undefined;
        if (dlsensor != undefined) {
            daylightvolts = dlsensor.value;
        }
        var returndataobj = filter_utils.LightLevelFilter(requestobj.requesttype, requestobj.level, this.parameters, daylightvolts);
        this.daylightlimited = returndataobj.isdaylightlimited;
        if (returndataobj.modifiedlevel > -1) {

            // if delta in level and rate is set,  start timer.
            if((returndataobj.modifiedlevel > this.level && this.parameters.brightenrate > 0) || (returndataobj.modifiedlevel < this.level && this.parameters.dimrate > 0))
            {
                this.startAutoAdjustTimer(this, returndataobj.modifiedlevel, requestobj.requesttype);
            }
            else {

                var modpct = returndataobj.modifiedlevel;
                requestobj.level = modpct;
                this.previousvalue = Number(this.value);


                // ******************************** bogus data point entry ,  to make nice graph bug 258 ******************
                // place bogus data point into log for obj, with current datetime, but last level.
                var now = moment();
                if(this.lastupdated != undefined)
                {
                    var deltamin = now.diff(moment(this.lastupdated),'minutes');
                    if(deltamin >= 60)   // 60 min,
                    {
                        var logobj = {};
                        var backtime = now.subtract(1, "minutes");
                        logobj.date = backtime.toISOString();
                        logobj.level = this.level.toFixed();
                        data_utils.appendOutputObjectLogFile(this.assignedname, logobj);
                    }
                }
                // ***************************************************************************************************


                this.level = Number(requestobj.level);
                this.lastupdated = now; //moment();

                var outlevel = this.calculateOutputLevel(this.level);
                this.interface.setOutputToLevel(this.outputid, outlevel, apply);


                var logobj = {};
                logobj.date = now.toISOString();
                logobj.level = this.level.toFixed();
                data_utils.appendOutputObjectLogFile(this.assignedname, logobj);
            }
        }

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



    // ********************************************* START MOVE *************************




    var autoadjusttimer = undefined;
    var autoadjusttargetlevel = 0;
    var autoadjuststartlevel = 0;
    var autoadjustrequesttype = "";

    this.startAutoAdjustTimer = function(fixture, targetlevel, requesttype)
    {
        //global.applogger.info(TAG, "**** DEBUG ***" , "call to start the auto adjust tmier");

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



        if(requestlevel > -1)
        {

            fixobj.previousvalue = Number(fixobj.value);


            // ******************************** bogus data point entry ,  to make nice graph bug 258 ******************
            // place bogus data point into log for obj, with current datetime, but last level.
            var now = moment();
            if(fixobj.lastupdated != undefined)
            {
                var deltamin = now.diff(moment(fixobj.lastupdated),'minutes');
                if(deltamin >= 60)   // 60 min,
                {
                    var logobj = {};
                    var backtime = now.subtract(1, "minutes");
                    logobj.date = backtime.toISOString();
                    logobj.level = fixobj.level.toFixed();
                    data_utils.appendOutputObjectLogFile(fixobj.assignedname, logobj);
                }
            }
            // ***************************************************************************************************



            fixobj.level = Number(requestlevel);
            fixobj.lastupdated = now;

            var outlevel = fixobj.calculateOutputLevel(fixobj.level);

            fixobj.interface.setOutputToLevel(fixobj.outputid, outlevel, true);

            var logobj = {};
            logobj.date = now.toISOString();
            logobj.level = fixobj.level.toFixed();
            data_utils.appendOutputObjectLogFile(fixobj.assignedname, logobj);
        }

        if(canceltimer)
            fixobj.stopAutoAdjustTimer(fixobj.assignedname);
    };

    // *********************** END MOVE **************




};




module.exports = DimFixture;
