/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');
var data_utils = require('../utils/data_utils.js');

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

    this.active_pending_vancancy = undefined; // 3/28/17,
    this.inactive_pending_vancancy = undefined; // 3/28/17,

    this.enabled = true; // 4/7/17,  GUI first.

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

        // ****9/13/17*********** bogus data point entry , ******************
        // ONLY IF MAINTAINED TYPE
        // place bogus data point into log for obj, with current datetime, but last level.
        if(this.type == "maintained") {
            var now = moment();
            if (this.lastupdated != undefined) {
                var deltamin = now.diff(moment(this.lastupdated), 'minutes');
                if (deltamin >= 5)   // 5 min,
                {
                    var logobj = {};
                    var backtime = now.subtract(1, "minutes");
                    logobj.date = backtime.toISOString();
                    logobj.value = this.value.toFixed();
                    data_utils.appendInputObjectLogFile(this.assignedname, logobj);
                }
            }
        }





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


module.exports = ContactInput;
