/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');

var OccSensor = function()
{
    this.type = OccSensor.name;
    this.assignedname = ""; //name;
    this.interface = ""; //interface;
    this.inputid = ""; //inputid;

    // status
    this.value = 0;
    this.previousvalue = 0;
    this.lastupdated = undefined;


    OccSensor.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    OccSensor.prototype.create = function(name, interface, inputid)
    {
        this.assignedname = name;
        this.interface = interface;
        this.inputid = inputid;
    }

    this.setvalue = function(val){
        this.previousvalue= this.value;
        this.value = val;
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
    /*
    this.tomodel=function() {
        var model = {};
        model.assignedname = this.assignedname;  //e.g. nw room a
        model.type = this.type;  // e.g. class name,
        model.interface = this.interface;   //rpdg, enocean,
        model.inputid = this.inputid;  //enocean ....id..holder.for enocean this will be the enocean id
        return model;
    }*/
};


module.exports = OccSensor;
