/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');

var MotionSensor = function()
{
    this.type = MotionSensor.name;
    this.assignedname = "";
    this.interface = "";
    this.inputid = "";

    this.value = 0;
    this.previousvalue = 0;
    this.lastupdated = undefined;


    MotionSensor.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    MotionSensor.prototype.create = function(name, interface, inputid)
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
        model.id = this.id;
        model.assignedname = this.name;  //e.g. nw room a
        model.type = this.type;  // e.g. class name,
        model.interface = this.interface;   //rpdg, enocean,
        model.metadata = this.metadata;  //enocean ....id..holder.
        return model;
    }  */
};


module.exports = MotionSensor;
