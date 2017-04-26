/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
var data_utils = require('../utils/data_utils.js');

var LevelInput = function()
{
    this.type = "daylight"; //DayLightSensor.name;
    this.assignedname = ""; 
    this.interface = "";
    this.inputid = "";
    this.drivelevel = "0";
    this.group = "";

    // status
    this.value = 0;
    this.previousvalue = 0;
    this.lastupdated = undefined;

    this.enabled = true; // 4/7/17,  GUI first.

    LevelInput.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    LevelInput.prototype.create = function(name, interface, inputid)
    {
        this.assignedname = name;
        this.interface = interface;
        this.inputid = inputid;
    }

    this.setvalue = function(val){
        this.previousvalue= this.value;
        this.value = val;
        this.lastupdated = moment();

        var logobj = {};
        logobj.date = new moment().toISOString();
        logobj.value = this.value;
        data_utils.appendInputObjectLogFile(this.assignedname, logobj);
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


module.exports = LevelInput;
