/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');

var ContactInput = function()
{
    this.assignedname = "";
    this.type = "";
    this.interface = "";
    this.inputid = "";
    this.active_action = "";
    this.inactive_action = "";
    // status.
    this.value = 0;
    this.previousvalue = 0;
    this.lastupdated = new moment();

    ContactInput.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    ContactInput.prototype.create = function(name, interface, inputid)
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




};


module.exports = ContactInput;
