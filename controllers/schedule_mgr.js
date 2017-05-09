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

//var OccSensor = require('../models/OccSensor.js');
//var MotionSensor = require('../models/MotionSensor.js');
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

var fs = require('fs');

var pending_events = [];
var SCHEDULE_FILE_ONETIME = '../datastore/schedule/onetime.json';
var SCHEDULE_FILE_DAILY = '../datastore/schedule/daily.json';
var SCHEDULE_FILE_WEEKLY = '../datastore/schedule/weekly.json';


var HTML_SR_COLOR = '#ffff99';
var HTML_SS_COLOR = '#ffcc66';
var HTML_ABSOLUTE_COLOR = '#7cff8e';
var HTML_TEXT_COLOR_DARK = '#111111';

var dirtyschedulecountdown = -1; // used to reinit, moved from service .


var referencedate = undefined;  //used for

function requireUncached(module){
    delete require.cache[require.resolve(module)]
    return require(module)
}


function printpendingevents()
{
    global.applogger.info(TAG, "*************** Current Schedule Event List" ,"**********************");
    for(var i = 0 ; i < pending_events.length; i++)
    {
        var event = pending_events[i];
        var id = event.id;
        if(event.repeat != 'none')
            id = event.base_id;

        global.applogger.info(TAG, "EVENT: " + id + "  " + event.start_date + " :title " + event.text + "   repeat: " + event.repeat);
    }
}


function createBlankFile(schedfile)
{
    var target = path.resolve(schedfile);
    var blank = [];
    var output = JSON.stringify(blank, null, 4);
    fs.writeFileSync(target, output);
}




function getEventListFromFile(schedfile)
{
    var target = path.resolve(schedfile);
    var listupdated = false;
    try {
        var stats = fs.statSync(target);
        if (stats.isFile()) {
            var contents = fs.readFileSync(target, 'utf8');
            if (contents.length > 0) {
                var mastercenelist = JSON.parse(contents);
                return mastercenelist;
            }
        }
    }
    catch (err)
    {
    }
    var blank = [];
    return blank;
}



function getEventFileForObj(eventobj)
{
    if (eventobj.repeat == "daily")
        return SCHEDULE_FILE_DAILY;
    else if (eventobj.repeat == "weekly")
        return SCHEDULE_FILE_WEEKLY;
    else
        return SCHEDULE_FILE_ONETIME;
}

function writeEventListToFile(eventlist, schedfile)
{
    var target = path.resolve(schedfile);

    var output = JSON.stringify(eventlist, null, 4);
    fs.writeFile(target, output, function (err) {
        if (err) {
            console.log(err);
        }
        else {
            //console.log("The file was saved!");
        }
        module.exports.requestScheduleCacheReset(new Date());
    });
}



function calculateCalendarTimeFromSunTime(event)
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

function generateEventObjectAtTimeFromObj(time, obj, color)
{
    var month = time.getMonth()*1000000; // + time.getDay()*1000+ time.getYear();
    var day = time.getDate()*10000;
    var year = time.getFullYear();
    var uniqueid= month+day+year;

    var eventobj = {};
    eventobj.base_id =obj.id;
    eventobj.id =obj.id+uniqueid;
    eventobj.text = obj.text;

    //create a date obj, that ocntains the mm dd year of time,  but the hh min of the org obj.
    var orgobj_statetime = new Date(obj.start_date);
    var starttime = new Date(time);
    starttime.setHours(orgobj_statetime.getHours());
    starttime.setMinutes(orgobj_statetime.getMinutes());


    eventobj.start_date = starttime.toString("MM/dd/yyyy HH:mm");
    var end = new Date(starttime);
    end.setHours(end.getHours()+2);



    eventobj.end_date = end.toString("MM/dd/yyyy HH:mm");

    eventobj.resource_id = obj.resource_id;
    eventobj.action = obj.action;
    eventobj.timebase = obj.timebase;
    eventobj.repeat = obj.repeat;
    eventobj.color = HTML_ABSOLUTE_COLOR;
    eventobj.textColor = HTML_TEXT_COLOR_DARK;


    eventobj.relhour = obj.relhour;
    eventobj.relmin = obj.relmin;

    if( eventobj.timebase == "before_ss" || eventobj.timebase == "after_ss" ||
        eventobj.timebase == "before_sr" || eventobj.timebase == "after_sr")
    {
        if(eventobj.timebase == "before_sr" || eventobj.timebase == "after_sr") {
            eventobj.color = HTML_SR_COLOR;
            eventobj.textColor = HTML_TEXT_COLOR_DARK;
        }
        else {
            eventobj.color = HTML_SS_COLOR;
            eventobj.textColor = HTML_TEXT_COLOR_DARK;
        }

        //calc ss for this day,  and then set time accordingly.
        var k = calculateCalendarTimeFromSunTime(eventobj);
        eventobj.start_date = k.toString("MM/dd/yyyy HH:mm");
        var end = new Date(k);
        end.setHours(end.getHours()+2);
        eventobj.end_date = end.toString("MM/dd/yyyy HH:mm");
    }
    return eventobj;
}


function initManager() {

    if(referencedate != undefined) {
        global.applogger.info(TAG, "Running Sched Init : ref date ", referencedate.toISOString(), "");

        if (!fs.existsSync(SCHEDULE_FILE_ONETIME)) {
            createBlankFile(SCHEDULE_FILE_ONETIME);
        }

        if (!fs.existsSync(SCHEDULE_FILE_DAILY)) {
            createBlankFile(SCHEDULE_FILE_DAILY);
        }

        if (!fs.existsSync(SCHEDULE_FILE_WEEKLY)) {
            createBlankFile(SCHEDULE_FILE_WEEKLY);
        }

        // build a memory cached list of the next 10 events.
        pending_events = []; //clear it,

        var target = path.resolve(SCHEDULE_FILE_ONETIME);
        var file_contents = requireUncached(target);
        for (var idx = 0; idx < file_contents.length; idx++) {

            var eventobj = file_contents[idx];

            if (eventobj.timebase == "before_ss" || eventobj.timebase == "after_ss" ||
                eventobj.timebase == "before_sr" || eventobj.timebase == "after_sr") {
                var k = calculateCalendarTimeFromSunTime(eventobj);
                eventobj.start_date = k.toString("MM/dd/yyyy HH:mm");
                var end = new Date(k);
                end.setHours(end.getHours() + 2);
                eventobj.end_date = end.toString("MM/dd/yyyy HH:mm");
            }

            pending_events.push(eventobj);
        }


        //  daily, *******************************************************
        // for this we will generate an event for the last 2 days.
        var target = path.resolve(SCHEDULE_FILE_DAILY);

        var stopdate = new Date(referencedate.getTime()); // new Date();

        stopdate.setDate(stopdate.getDate() + 1);
        var file_contents = requireUncached(target);
        for (var idx = 0; idx < file_contents.length; idx++) {

            var dailyevent = file_contents[idx];

            var currdt = new Date(referencedate.getTime()); //new Date();

            currdt.setDate(currdt.getDate() - 2);    // today minus 2 days,

            while (1) {

                if (currdt.getTime() > stopdate.getTime())
                    break;

                var eventobj = generateEventObjectAtTimeFromObj(currdt, dailyevent, "#55DD44");  // this calls sr ss
                pending_events.push(eventobj);
                currdt.addHours(24);
            }
        }


        // weekly *****************************************

        // for this we will generate an event for the last +/- weeks
        var target = path.resolve(SCHEDULE_FILE_WEEKLY);

        var stopdate = new Date(referencedate.getTime()); //new Date();
        stopdate.setDate(stopdate.getDate() + 12);
        var file_contents = requireUncached(target);
        for (var idx = 0; idx < file_contents.length; idx++) {

            var weeklyevent = file_contents[idx];

            var currdt = new Date(referencedate.getTime()); //new Date();
            currdt.addHours(-24 * 12);  // start 12 days

            // currdt.setDate(currdt.getDate()-2);    // today minus 2 days,
            var k = new Date(weeklyevent.start_date);
            var dayofweek = k.getDay();  // sunday = 0,

            while (1) {
                var test = currdt.getDay();
                if (test == dayofweek)
                    break;

                currdt.addHours(24);
            }

            while (1) {
                if (currdt.getTime() > stopdate.getTime())
                    break;

                var eventobj = generateEventObjectAtTimeFromObj(currdt, weeklyevent, "#667722");
                pending_events.push(eventobj);
                currdt.addHours(24 * 7);  //advance 1 week,
            }
        }


        // SORT EVENTS
        pending_events.sort(function (a, b) {
            var dateA = new Date(a.start_date), dateB = new Date(b.start_date);
            return dateA - dateB;
        });
        printpendingevents();

        referencedate = undefined;
    }
    else
    {
        global.applogger.info(TAG, "Error, cant run sched re-init, no ref date. ", "", "");
    }
}

// singleton pattern.
var mgr = module.exports = {

    getCurrentEvent: function (now) {

        if(dirtyschedulecountdown > 0)
            return undefined;  // do not return anything if pending changes...

        // NOTE: this function has to handle the case where there is more than one event
        // at a specific time point , (hour/min,) so it need to return multiple events. ,
        // along with marker, ?<
        var return_element = {};
        var eventlist = [];

        if(pending_events.length == 1)  // if only one event,  dont search ,
        {
            eventlist.push(pending_events[0]);
            return_element.events = eventlist;
            var matchtime =  new moment(new Date(pending_events[0].start_date));  //record prev events start time,
            return_element.date_time = matchtime;
            return return_element;
        }

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

        if(eventlist.length == 0 && pending_events.length > 0)  // there are no events in the future,  so just use the last one in the master list
        {
            var matchtime =  new moment(new Date(pending_events[pending_events.length-1].start_date));  //record prev events start time,
            return_element.date_time = matchtime;

            var i = pending_events.length-1;
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
        }


        return_element.events = eventlist;
        return return_element;

    },
    scheduleCacheReset: function() {
        if(dirtyschedulecountdown >= 0)
        {
            dirtyschedulecountdown-=1;
            if(dirtyschedulecountdown < 0)
            {
                global.applogger.info(TAG, "---- Schedule Re init Start----", "");
                initManager();
                return true;
            }
        }
        return false;
    },
    requestScheduleCacheReset: function(reftime) {
        dirtyschedulecountdown = 5;  // this is in seconds.
        referencedate = new Date(reftime.getTime());

    },
    removeSceneFromSchedule: function(scenename)
    {
        var filelist = [SCHEDULE_FILE_ONETIME,SCHEDULE_FILE_DAILY,SCHEDULE_FILE_WEEKLY];

        for(var f = 0; f < filelist.length; f++) {

            var targetfile = filelist[f];

            var list = getEventListFromFile(targetfile);
            var edit = false;
            for (var i = list.length - 1; i >= 0; i--)  // go backwards... remove all matches.
            {
                var event = list[i];
                if (event.action == 'scene') {
                    var parts = event.text.split(':');
                    var match = parts[1].trim();
                    if (match == scenename) {
                        list.splice(i, 1);
                        edit = true;
                    }
                }
            }
            if (edit)
                writeEventListToFile(list, targetfile);


        }
    },

// NOTE:  all storage is in 24 hr format,
    getEventsinTimeSpan: function(start_ref, end_ref)
    {

        var events = [];
        // one time events.
        var fileevents = getEventListFromFile(SCHEDULE_FILE_ONETIME);

        for(var i = 0 ; i < fileevents.length; i++) {

            var startdate = new Date(fileevents[i].start_date);
            var enddate = new Date(fileevents[i].end_date);
            if(startdate.getTime() >= start_ref.getTime() && startdate.getTime() <= end_ref.getTime())
            {
                //fileevents[i].color = "red";
                if( fileevents[i].timebase == "before_ss" || fileevents[i].timebase == "after_ss" ||
                    fileevents[i].timebase == "before_sr" || fileevents[i].timebase == "after_sr")
                {
                    if(fileevents[i].timebase == "before_sr" || fileevents[i].timebase == "after_sr") {
                        fileevents[i].color = HTML_SR_COLOR;
                        fileevents[i].textColor = HTML_TEXT_COLOR_DARK;
                    }
                    else {
                        fileevents[i].color = HTML_SS_COLOR;
                        fileevents[i].textColor = HTML_TEXT_COLOR_DARK;
                    }
                    //calc ss for this day,  and then set time accordingly.
                    var k = calculateCalendarTimeFromSunTime(fileevents[i]);
                    fileevents[i].start_date = k.toString("MM/dd/yyyy HH:mm");
                    var end = new Date(k);
                    end.setHours(end.getHours()+2);
                    fileevents[i].end_date = end.toString("MM/dd/yyyy HH:mm");
                }
                else {
                    fileevents[i].color = HTML_ABSOLUTE_COLOR;
                    fileevents[i].textColor = HTML_TEXT_COLOR_DARK;
                }

                events.push(fileevents[i]);
            }
        }

        var fileevents = getEventListFromFile(SCHEDULE_FILE_DAILY);
        for(var i = 0 ; i < fileevents.length; i++) {
            var dailyevent = fileevents[i];
            var currdt = new Date(start_ref);
            while(1)
            {
                if(currdt.getTime() > end_ref.getTime())
                    break;

                var tempevent = generateEventObjectAtTimeFromObj(currdt, dailyevent, "#55DD44");  // this calls sr ss
                events.push(tempevent);
                currdt.addHours(24);
            }
        }

        var fileevents = getEventListFromFile(SCHEDULE_FILE_WEEKLY);

        for(var i = 0 ; i < fileevents.length; i++) {
            var weeklyevent = fileevents[i];
            var currdt = new Date(start_ref);

            // now find the first day, that mataches the events day.
            // and start there.
            var k = new Date(weeklyevent.start_date);
            var dayofweek = k.getDay();  // sunday = 0,

            while(1)
            {
                var test = currdt.getDay();
                if(test == dayofweek)
                    break;

                currdt.addHours(24);
            }

            while(1)
            {
                if(currdt.getTime() > end_ref.getTime())
                    break;

                var tempevent = generateEventObjectAtTimeFromObj(currdt, weeklyevent,"#667722");
                events.push(tempevent);
                currdt.addHours(24*7);
            }
        }
        return events;
    },
    createEvent: function(eventobj){

        var file = getEventFileForObj(eventobj);
        var eventlist = getEventListFromFile(file);
        eventlist.push(eventobj);
        writeEventListToFile(eventlist, file);
    },
    deleteEvent: function(eventobj) {

        var edit = false;
        var file = getEventFileForObj(eventobj);
        var eventlist = getEventListFromFile(file);

        var ref_id = eventobj.id;
        if (eventobj.repeat == "daily" || eventobj.repeat == "weekly")
            ref_id = eventobj.base_id;

        for (var i = 0; i < eventlist.length; i++) {
            if (eventlist[i].id == ref_id) {
                edit = true;
                eventlist.splice(i, 1); // remove
                break;
            }
        }

        if(edit)
            writeEventListToFile(eventlist, file);

    },
    updateEvent: function(eventobj) {

        var file = getEventFileForObj(eventobj);
        var eventlist = getEventListFromFile(file);

        var target_file;
        var matchobj = eventobj.id;  // default,

        var ref_id = eventobj.id;
        if (eventobj.repeat == "daily" || eventobj.repeat == "weekly")
            ref_id = eventobj.base_id;

        var edit = false;

        for (var i = 0; i < eventlist.length; i++) {
            if (eventlist[i].id == ref_id) {
                edit = true;
                eventlist[i] = eventobj;
                break;
            }
        }
        if(edit)
            writeEventListToFile(eventlist, file);
    },
    deleteAllEvents: function() {

        createBlankFile(SCHEDULE_FILE_ONETIME);
        createBlankFile(SCHEDULE_FILE_DAILY);
        createBlankFile(SCHEDULE_FILE_WEEKLY);
        module.exports.requestScheduleCacheReset(new Date());

    },

}; // end exports