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



var CCTFixture = function(name, interface, outputid)
{
    this.type = "cct"; //CCTFixture.name;
    this.assignedname = name;
    this.interface = interface;
    this.interfacename = "";
    this.outputid = "";
    this.image = "";
    this.candledim = false;
    this.min = 2000;
    this.max = 6500;
    this.commonanode = false;
    this.twelvevolt = false;
   // this.boundinputs = [];
    this.parameters = new FixtureParameters();

    // status
    this.colortemp = 3500;
    this.brightness = 100;
    this.lastuserequestedbrightness = 100;
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

       // if(obj.boundinputs != undefined)
        //    this.boundinputs = obj.boundinputs;
    };

    this.setLevel = function(requestobj, apply) {

        if(requestobj.requesttype == "override" || requestobj.requesttype == "wallstation" || requestobj.requesttype == "wetdrycontact")
        {
            this.lastuserequestedbrightness = requestobj.brightness;
        }
        else if(requestobj.requesttype == "daylight")
        {
            requestobj.brightness = this.lastuserequestedbrightness;
        }


        //  4/18/17,  moved filter up.
        this.stopAutoAdjustTimer(this.assignedname);

        var dlsensor = global.currentconfig.getDaylightSensor();

        var daylightvolts = undefined;
        if (dlsensor != undefined) {
            daylightvolts = dlsensor.value;
        }

        var brightness = this.brightness;   //use current by default
        if (requestobj.brightness != undefined)
            brightness = requestobj.brightness;   //use requested if present,

        var colortemp = this.colortemp;
        if (requestobj.colortemp != undefined)
            colortemp = requestobj.colortemp;

        // dl/light filter
        var returndataobj = filter_utils.LightLevelFilter(requestobj.requesttype, brightness, this.parameters, daylightvolts);
        this.daylightlimited = returndataobj.isdaylightlimited;
        if (returndataobj.modifiedlevel > -1) {    // if filter returns a valid value,  apply it,  (use it),  else use above .
            var modpct = returndataobj.modifiedlevel;
            brightness = modpct;  // modify the req obj.
        }

        // color temp calculation
        var warmcoolvals = filter_utils.CalculateCCTAndDimLevels(this.min, this.max, colortemp, brightness, this.candledim);



        // per dan/ joe 4/21, if color temp is changed, from prev,  then also restart timer.


        if((returndataobj.modifiedlevel > this.brightness && this.parameters.brightenrate > 0) || (returndataobj.modifiedlevel < this.brightness && this.parameters.dimrate > 0))
        {
            this.startAutoAdjustTimer(this, returndataobj.modifiedlevel,"brightness", requestobj.requesttype);
        }
        else if((warmcoolvals[0] != this.hwwarm || warmcoolvals[1] != this.hwcool) && (this.parameters.brightenrate > 0 || this.parameters.dimrate > 0))
        {
            // need to pass in warm / cool values.
            this.startAutoAdjustTimer(this, colortemp, "colortemp", requestobj.requesttype);
        }

        else {

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
                    logobj.brightness = Number(this.brightness).toFixed();
                    logobj.colortemp = this.colortemp;
                    data_utils.appendOutputObjectLogFile(this.assignedname, logobj);
                }
            }
            // ***************************************************************************************************




            this.previouscolortemp = this.colortemp;
            this.colortemp = colortemp;

            var warmvalueout = this.calculateOutputLevel(warmcoolvals[0]);
            this.interface.setOutputToLevel(Number(this.outputid), warmvalueout, apply);

            this.previousbrightness = this.brightness;

            this.brightness = brightness;
            var bchannel = Number(this.outputid) + 1;
            this.hwwarm = warmcoolvals[0];
            this.hwcool = warmcoolvals[1];

            var coolvalueout = this.calculateOutputLevel(warmcoolvals[1]);

            this.interface.setOutputToLevel(bchannel, coolvalueout, apply);

            this.lastupdated = now;

            var logobj = {};
            logobj.date = now.toISOString();
            logobj.brightness = Number(this.brightness).toFixed();
            logobj.colortemp = this.colortemp;
            data_utils.appendOutputObjectLogFile(this.assignedname, logobj);
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

    this.getvalue=function(){
        return this.value;
    };
    this.getprevvalue=function(){
        return this.previousvalue;
    };
    this.getlastupdated=function() {
        return this.lastupdated;
    };


    var autoadjusttimer = undefined;
    var autoadjusttargetlevel = 0;
    var autoadjuststartlevel = 0;
    var autoadjustrequesttype = "";
    var autoadjustchangetype = "brightness";  // 4/21/17 // either bright or ctemp,

    this.startAutoAdjustTimer = function(fixture, targetlevel, changetype,  requesttype)
    {
        autoadjustrequesttype = requesttype;

        if(changetype == "brightness")
            autoadjuststartlevel = fixture.brightness;
        else
            autoadjuststartlevel = fixture.colortemp;

        autoadjusttargetlevel = targetlevel;

        autoadjustchangetype = changetype;

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
            global.applogger.info(TAG, "Auto Adjust Timer STopped: " , name);
        }
    };


    this.autoAdjustLevel = function(fixobj)
    {
        // global.applogger.info(TAG, "Auto Adjust Timer called fix: -- " , fixobj.assignedname);
        var stepsize = 0;
        var requestlevel = 0;

        var canceltimer = false;


        var colortemp = 2000; //fixobj.colortemp;  // no color temp change

        // 4/21/17, calc either bright change or ctemp change,

        if(autoadjustchangetype == "brightness") {
            var delta = autoadjusttargetlevel - autoadjuststartlevel;
            if (delta > 0) {
                stepsize = delta / fixobj.parameters.brightenrate;
                requestlevel = Number(fixobj.brightness) + stepsize;
                if (requestlevel >= autoadjusttargetlevel) {
                    requestlevel = autoadjusttargetlevel;
                    canceltimer = true;
                }

            }
            else if (delta < 0) {
                stepsize = delta / fixobj.parameters.dimrate;
                requestlevel = Number(fixobj.brightness) + stepsize;
                if (requestlevel <= autoadjusttargetlevel) {
                    requestlevel = autoadjusttargetlevel;
                    canceltimer = true;
                }
            }

            colortemp = fixobj.colortemp;  // no color temp change
        }
        else  //color temp change req.
        {
            var delta = autoadjusttargetlevel - autoadjuststartlevel;
            if (delta > 0) {
                stepsize = delta / fixobj.parameters.brightenrate;
                colortemp = Number(fixobj.colortemp) + stepsize;
                if (colortemp >= autoadjusttargetlevel) {
                    colortemp = autoadjusttargetlevel;
                    canceltimer = true;
                }

            }
            else if (delta < 0) {
                stepsize = delta / fixobj.parameters.dimrate;
                colortemp = Number(fixobj.colortemp) + stepsize;
                if (colortemp <= autoadjusttargetlevel) {
                    colortemp = autoadjusttargetlevel;
                    canceltimer = true;
                }
            }

            requestlevel = fixobj.brightness; // no bright change, just ctemp.
        }

        global.applogger.info(TAG, "Auto Adjust Timer Loop calc'd:  req: ---    "+ autoadjustchangetype , colortemp + "   " + requestlevel + "  -----------------");

        // color temp calculation
        var warmcoolvals = filter_utils.CalculateCCTAndDimLevels(fixobj.min, fixobj.max, colortemp, requestlevel, fixobj.candledim);



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
                logobj.brightness = Number(fixobj.brightness).toFixed();
                logobj.colortemp = fixobj.colortemp;
                data_utils.appendOutputObjectLogFile(fixobj.assignedname, logobj);
            }
        }
        // ***************************************************************************************************



        fixobj.previouscolortemp = fixobj.colortemp;
        fixobj.colortemp = colortemp;


        var warmvalueout = fixobj.calculateOutputLevel(warmcoolvals[0]);
        fixobj.interface.setOutputToLevel(Number(fixobj.outputid), warmvalueout, true);

        fixobj.previousbrightness = fixobj.brightness;
        fixobj.brightness = requestlevel;
        var bchannel = Number(fixobj.outputid) + 1;
        fixobj.hwwarm = warmcoolvals[0];
        fixobj.hwcool = warmcoolvals[1];

        var coolvalueout = fixobj.calculateOutputLevel(warmcoolvals[1]);
        fixobj.interface.setOutputToLevel(bchannel, coolvalueout, true);
        fixobj.lastupdated = now;


        var logobj = {};
        logobj.date = now.toISOString();
        logobj.brightness = Number(fixobj.brightness).toFixed();
        logobj.colortemp = fixobj.colortemp;
        data_utils.appendOutputObjectLogFile(fixobj.assignedname, logobj);

        if(canceltimer)
            fixobj.stopAutoAdjustTimer(fixobj.assignedname);
    };




};


// auto dim   4/3/17,



module.exports = CCTFixture;
