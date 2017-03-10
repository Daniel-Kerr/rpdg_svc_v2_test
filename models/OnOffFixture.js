/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
var pad = require('pad');
var path = require('path');
var FixtureParameters = require('./FixtureParameters');
var TAG = pad(path.basename(__filename),15);
//var OnOffFixture = function(name, interface, outputid)
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
    this.currentdraw = 0;

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


        var modlevel = 0;
        if(requestobj.level > 0)
            modlevel = 100;

        this.previousvalue= this.value;
        this.level = modlevel;
        this.lastupdated = moment();

        var options = (this.interfacename.includes("plc"))?"plc":undefined;


        this.interface.setOutputToLevel(this.outputid, this.level, apply, options);

        //todo, if request type in request obj is override..etc,  then set add vars to keep last user requested value.
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

