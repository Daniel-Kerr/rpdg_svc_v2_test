/**
 * Created by Nick on 3/17/2017.
 */

var path = require('path');
var pad = require('pad');
var moment = require('moment');
var TAG = pad(path.basename(__filename),15);

var enocean = require('./enocean.js');
var rpdg = require('./rpdg_board.js');
var InputMessage = require('../models/InputMessage.js');

var OccSensor = require('../models/OccSensor.js');
var MotionSensor = require('../models/MotionSensor.js');
var Dimmer = require('../models/Dimmer.js');
var DayLightSensor = require('../models/DayLightSensor.js');

var OnOffFixture = require('../models/OnOffFixture.js');
var DimFixture = require('../models/DimFixture.js');
var CCTFixture = require('../models/CCTFixture.js');
var RGBWFixture = require('../models/RGBWFixture.js');

var Configuration = require('../models/Configuration.js');
var FixtureParameters = require('../models/FixtureParameters.js');

var Group = require('../models/Group.js');
var ContactInput = require('../models/ContactInput.js');

var data_utils = require('../utils/data_utils.js');

var filter_utils = require('./../utils/filter_utils.js');

var pending_events = [];


function requireUncached(module){
    delete require.cache[require.resolve(module)]
    return require(module)
}


function printpendingevents()
{

    for(var i = 0 ; i < pending_events.length; i++)
    {
        var event = pending_events[i];
        console.log("EVENT: " + event.start + " : " + event.title);
    }
}
var service = module.exports = {

    getCurrentEvent: function () {

        var now = new moment();
        for(var i = 0 ; i < pending_events.length; i++)
        {
            var event = pending_events[i];
            var startmoment = new moment(new Date(event.start));
            if(startmoment.isSameOrAfter(now) && i > 0)
            {
                return pending_events[i-1];
            }
        }
        return undefined;

    },
    initManager: function() {

        // build a memory cached list of the next 10 events.
        pending_events = []; //clear it,
        var startw = new moment().add(-30,'days');
        var endw = new moment().add(30,'days');
        var start = startw.format("YYYY-MM-DD");
        var end = endw.format("YYYY-MM-DD");
        var startd = start.substring(0,7);
        var endd = end.substring(0,7);

        var current_d = startd;
        while(1) {
            try {
                var file_contents = requireUncached('../datastore/schedule/' + current_d + '.json');
                //var file_contents = require('../datastore/schedule/' + current_d + '.json');
            } catch (err)
            {
                break;
            }

            for (var idx = 0; idx < file_contents.length; idx++) {
                var temp = moment(file_contents[idx].start);
                file_contents[idx].start = temp.format('YYYY-MM-DD HH:mm');
                var endtemp = temp.add(30,'minutes');
                file_contents[idx].end = endtemp.format('YYYY-MM-DD HH:mm');
                pending_events.push(file_contents[idx]);
            }

            if (current_d == endd)
                break;

            var month_part = current_d.substring(5, 7);
            var year_part = current_d.substring(0, 4);

            var nextmonth = Number(month_part) + 1;
            if (nextmonth > 12) {

                nextmonth = 1;
                var year = Number(year_part);
                year++;
                year_part = year.toString();
            }

            month_part = nextmonth.toString();
            if(month_part.length < 2)
                month_part = '0' + month_part;


            current_d = year_part + '-' + month_part;
            continue;
        }


        pending_events.sort(function(a, b) {
            var dateA = new Date(a.start), dateB = new Date(b.start);
            return dateA - dateB;
        });

        printpendingevents();

    }
}; // end exports