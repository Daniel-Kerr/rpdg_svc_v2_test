/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
var pad = require('pad');
var path = require('path');
var FixtureParameters = require('./FixtureParameters');

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

        this.previousvalue= this.value;
        this.level = requestobj.level;
        this.lastupdated = moment();
        this.interface.setOutputToLevel(this.outputid, this.level, apply);

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


module.exports = DimFixture;
