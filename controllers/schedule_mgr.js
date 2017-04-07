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
var SunCalc = require('suncalc');

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
        console.log("EVENT: " + event.start_date + " : " + event.text);
    }
}
var service = module.exports = {

    getCurrentEvent: function (now) {

        // NOTE: this function has to handle the case where there is more than one event
        // at a specific time point , (hour/min,) so it need to return multiple events. ,
        // along with marker, ?<
        var return_element = {};
        var eventlist = [];

        if(pending_events.length == 1)  // if only one event,  dont search ,
        {
            eventlist.push(pending_events[0]);
            return_element.events = eventlist;
            return return_element;
        }
       // var now = new moment();
        for(var i = 0 ; i < pending_events.length; i++)
        {
            var event = pending_events[i];
            var startmoment = new moment(new Date(event.start_date));
            if(startmoment.isSameOrAfter(now) && i > 0)
            {
                // we have hit an event that is after now,
                // we now collect backwards all events that are at the
                // start date of the prev.
                // get prev events start,
                var matchtime =  new moment(new Date(pending_events[i-1].start_date));  //record prev events start time,
                return_element.date_time = matchtime;

                i--;
               // eventlist.push(pending_events[i-1])
                while(i >= 0)
                {
                    var temp = new moment(new Date(pending_events[i].start_date));
                    if(temp.diff(matchtime) == 0)
                        eventlist.push(pending_events[i]);

                    if(temp.isBefore(matchtime))
                        break;


                    i--;
                }
                break; //break out of for loop,
            }
        }

        return_element.events = eventlist;
        return return_element;

    },
    initManager: function() {

        // build a memory cached list of the next 10 events.
        pending_events = []; //clear it,
        var file_contents = requireUncached('../datastore/schedule/onetime.json');
        for (var idx = 0; idx < file_contents.length; idx++) {

            var eventobj = file_contents[idx];

            if( eventobj.timebase == "before_ss" || eventobj.timebase == "after_ss" ||
                eventobj.timebase == "before_sr" || eventobj.timebase == "before_sr")
            {
                var k = module.exports.calculateCalendarTimeFromSunTime(eventobj);
                eventobj.start_date = k.toString("MM/dd/yyyy HH:mm");
                var end = new Date(k);
                end.setHours(end.getHours()+2);
                eventobj.end_date = end.toString("MM/dd/yyyy HH:mm");
            }

            pending_events.push(eventobj);
        }

        pending_events.sort(function(a, b) {
            var dateA = new Date(a.start_date), dateB = new Date(b.start_date);
            return dateA - dateB;
        });
        printpendingevents();
    },
    calculateCalendarTimeFromSunTime: function(event)
    {
        var times = SunCalc.getTimes(new Date(event.start_date), Number(global.currentconfig.sitelatt), Number(global.currentconfig.sitelong));

        var sunriseStr = times.sunrise.getHours() + ':' + times.sunrise.getMinutes();
        var duskstr = times.sunsetStart.getHours() + ':' + times.sunsetStart.getMinutes();
        global.applogger.info(TAG, "SunRise Time: " + event.start_date  , "   " + sunriseStr + "  ---> " + duskstr);

        var updatedstart = new Date(event.start_date);
        var sshour = times.sunsetStart.getHours();
        var ssmin = times.sunsetStart.getMinutes();

        var srhour = times.sunrise.getHours();
        var srmin = times.sunrise.getMinutes();

        if(event.timebase == "before_ss")
        {
            sshour -= Number(event.relhour);
            ssmin -= Number(event.relmin);
            updatedstart.setHours(sshour);
            updatedstart.setMinutes(ssmin);
            return updatedstart;
        }
        else if(event.timebase == "after_ss")
        {
            sshour += Number(event.relhour);
            ssmin += Number(event.relmin);
            updatedstart.setHours(sshour);
            updatedstart.setMinutes(ssmin);
            return updatedstart;
        }
        else if(event.timebase == "before_sr")
        {
            srhour -= Number(event.relhour);
            srmin -= Number(event.relmin);
            updatedstart.setHours(srhour);
            updatedstart.setMinutes(srmin);
            return updatedstart;
        }
        else if(event.timebase == "after_sr")
        {
            srhour += Number(event.relhour);
            srmin += Number(event.relmin);
            updatedstart.setHours(srhour);
            updatedstart.setMinutes(srmin);
            return updatedstart;
        }
        return undefined;
    }
}; // end exports