var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
var moment = require('moment');
var app = express();
var os = require( 'os' );
var pad = require('pad');
var TAG = pad(path.basename(__filename),15);

require('datejs');
var service = require('../controllers/service');

var file_schedule = 'datastore/schedule.json';
/* GET */
router.get('/', function(req, res, next) {
  res.sendFile(path.join( app.get('views') +'/scheduler2.html'));
});


var last_start_req;
var last_end_req;





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
  eventobj.color = color;


  return eventobj;
}

var user_pref_format = 24;

// NOTE:  all storage is in 24 hr format,
function getEventForTimeSpan(start_ref, end_ref)
{

  var events = [];
  // one time events.
  var fileevents = getEventListFromFile('datastore/schedule/onetime.json');

  for(var i = 0 ; i < fileevents.length; i++) {

    var startdate = new Date(fileevents[i].start_date);
    var enddate = new Date(fileevents[i].end_date);
    if(startdate.getTime() >= start_ref.getTime() && startdate.getTime() <= end_ref.getTime())
    {
      fileevents[i].color = "red";

      if(user_pref_format == 12)
      {
        var temps = moment(startdate);
        fileevents[i].start_date = temps.format('hh:mm A');
        var tempe = moment(enddate);
        fileevents[i].end_date = tempe.format('hh:mm A');
        // reformat.
      }

      events.push(fileevents[i]);
    }
  }

  var fileevents = getEventListFromFile('datastore/schedule/daily.json');
  for(var i = 0 ; i < fileevents.length; i++) {
    var dailyevent = fileevents[i];
    var currdt = new Date(start_ref);
    while(1)
    {
      if(currdt.getTime() > end_ref.getTime())
        break;

      var tempevent = generateEventObjectAtTimeFromObj(currdt, dailyevent, "#55DD44");
      events.push(tempevent);
      currdt.addHours(24);
    }


  }


  var fileevents = getEventListFromFile('datastore/schedule/weekly.json');



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
}

// for new schedular.
router.get('/getschedule2', function(req, res) {

  // query string from ,  to.
  var start = new Date(req.query.from);
  var end = new Date(req.query.to);
  last_start_req = start;
  last_end_req = end;
  var events = getEventForTimeSpan(start,end);
  res.status(200).send(events);
});



function createEventObject(body)
{
  var eventobj = {};
  var id = body.ids;
  eventobj.id = Number(id);
  eventobj.text = body[id +"_text"];
  eventobj.start_date = body[id +"_start_date"];
  eventobj.end_date = body[id +"_end_date"];
  eventobj.resource_id = body[id +"_resource_id"];
  eventobj.action = body[id +"_action"];
  eventobj.timebase = body[id +"_timebase"];
  eventobj.repeat = body[id +"_repeat"];

  eventobj.base_id = body[id +"_base_id"];
  return eventobj;
}



// handler for delete, update..(crud).
router.post('/getschedule2', function(req, res) {

  if(req.query.editing) {

    if (req.body != undefined) {
      var eventobj = createEventObject(req.body);
      var id = req.body.ids;
      var crudaction = req.body[id + "_!nativeeditor_status"];
      if (crudaction == "inserted")  //----> CREATE
      {
        var target_file;
        if (eventobj.repeat == "daily")
          target_file = 'datastore/schedule/daily.json';
        else if (eventobj.repeat == "weekly")
          target_file = 'datastore/schedule/weekly.json';
        else if (eventobj.repeat == "dayofmonth")
          target_file = 'datastore/schedule/monthly.json';
        else
          target_file = 'datastore/schedule/onetime.json';

        var eventlist = getEventListFromFile(target_file);


        eventlist.push(eventobj);
        writeEventListToFile(eventlist, target_file);
      }
      else if (crudaction == "deleted")  //----> DELETE
      {
        var target_file;
        if (eventobj.repeat == "daily")
          target_file = 'datastore/schedule/daily.json';
        else if (eventobj.repeat == "weekly")
          target_file = 'datastore/schedule/weekly.json';
        else if (eventobj.repeat == "dayofmonth")
          target_file = 'datastore/schedule/monthly.json';
        else
          target_file = 'datastore/schedule/onetime.json';

        var eventlist = getEventListFromFile(target_file);

        var edit = false;

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
          writeEventListToFile(eventlist, target_file);
      }
      if (crudaction == "updated")  //----> UPDATED
      {
        var target_file;
        var matchobj = eventobj.id;  // default,


        if (eventobj.repeat == "daily") {
          target_file = 'datastore/schedule/daily.json';
          matchobj = eventobj.base_id; // use base id for daily obj.
        }
        else if (eventobj.repeat == "weekly") {
          target_file = 'datastore/schedule/weekly.json';
          matchobj = eventobj.base_id;
        }
        else if (eventobj.repeat == "dayofmonth") {
          target_file = 'datastore/schedule/monthly.json';
        }
        else {
          target_file = 'datastore/schedule/onetime.json';
        }

        var eventlist = getEventListFromFile(target_file);

        var edit = false;


        for (var i = 0; i < eventlist.length; i++) {
          if (eventlist[i].id == matchobj) {
            edit = true;
            eventlist[i] = eventobj;
            break;
          }
        }

        if(edit)
          writeEventListToFile(eventlist, target_file);
      }
    }
  }

  var events_updated = getEventForTimeSpan(last_start_req, last_end_req);
  res.status(200).send(events_updated);


});

router.post('/addevent', function(req, res) {

  var event = req.body;
  var start = event.start;


  // var bla = moment.utc(event.start);
  //var localTime = moment.utc(event.start).local().format();

  //event.start = moment.utc(event.start).local().format();

  //var offset = moment().utcOffset();
  //global.applogger.info(TAG, "--------------Server tz Offset-------------: " +offset, "");
  // event.start = moment.utc(event.start).utcOffset(offset).format();


  var target_file;
  if(event.repeat == "daily")
    target_file = 'datastore/schedule/daily.json';
  else if(event.repeat == "weekly")
    target_file = 'datastore/schedule/weekly.json';
  else if(event.repeat == "dayofmonth")
  {
    target_file = 'datastore/schedule/monthly.json';
  }
  else {
    var startd = start.substring(0,7);
    target_file = 'datastore/schedule/' + startd + '.json';
  }
  var eventlist = getEventListFromFile(target_file);

  // check if we are overwriting it or not.
  var edit =false;
  for(var i = 0; i < eventlist.length; i++)
  {
    if(eventlist[i].id == event.id)
    {
      // ediit,  it,
      edit = true;
      eventlist.splice(i,1); // remove this one,
      break;
    }
  }

  eventlist.push(req.body);



  writeEventListToFile(eventlist,target_file);
  // res.send(200);
  res.status(200).send("OK");
});


router.post('/delevent', function(req, res) {

  var event = req.body;
  //var start = event.start;

  var target_file;
  if(event.repeat == "daily")
    target_file = 'datastore/schedule/daily.json';
  else if(event.repeat == "weekly")
    target_file = 'datastore/schedule/weekly.json';
  else if(event.repeat == "dayofmonth")
  {
    target_file = 'datastore/schedule/monthly.json';
  }
  else {
    var startd = start.substring(0,7);
    target_file = 'datastore/schedule/' + startd + '.json';
  }
  var eventlist = getEventListFromFile(target_file);

  for(var i = 0; i < eventlist.length; i++)
  {
    if(eventlist[i].id == event.id)
    {
      // remove it, ..
      eventlist.splice(i,1);
      break;
    }
  }
  writeEventListToFile(eventlist,target_file);
  // res.send(200);
  res.status(200).send("OK");
});

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
    service.reinitScheduleMgr();
  });
}

router.get('/getschedule', function(req, res) {

  //figure out date range by month.
  var start = req.query.start;
  var end = req.query.end;


  var startmoment = new moment(new Date(start));
  var endmoment = new moment(new Date(end));

  console.log("get schedule: " + start +  ' ---> ' + end);
  var startd = start.substring(0,7);
  var endd = end.substring(0,7);

  var events = [];
  try {
    // daily first.
    var file_schedule = 'datastore/schedule/daily.json';
    var target = path.resolve(file_schedule);
    var stats = fs.statSync(target);
    if (stats.isFile()) {
      var contents = fs.readFileSync(target, 'utf8');
      var elements = JSON.parse(contents);
      for(var ele = 0; ele < elements.length; ele++)
      {
        var currmom = startmoment.clone();
        var event = elements[ele];
        var parsed = moment(event.start);
        currmom.hours(parsed.hours()).minutes(parsed.minutes());

        var runningtime = currmom.clone();
        while(1)
        {
          if(runningtime.isAfter(endmoment))
            break;

          var tmpevent = {};
          tmpevent.id =event.id;
          var eventtime = runningtime.clone();
          tmpevent.start = eventtime.format('YYYY-MM-DD HH:mm');
          var endtime = eventtime.add(30,'minutes');
          tmpevent.end = endtime.format('YYYY-MM-DD HH:mm');
          tmpevent.title = event.title;
          tmpevent.type = event.type;
          tmpevent.repeat = "daily";
          events.push(tmpevent);
          runningtime.add(1, 'day');
        }
      }
    }

    // weekly
    var file_schedule = 'datastore/schedule/weekly.json';
    var target = path.resolve(file_schedule);
    var stats = fs.statSync(target);
    if (stats.isFile()) {
      var contents = fs.readFileSync(target, 'utf8');
      var elements = JSON.parse(contents);

      for(var ele = 0; ele < elements.length; ele++)
      {
        var currmom = startmoment.clone();
        var event = elements[ele];
        var parsed = moment(event.start);
        currmom.hours(parsed.hours()).minutes(parsed.minutes());
        // need to figure out the day of week,  and add from there.
        currmom.days(parsed.days());
        var runningtime = currmom.clone();
        while(1)
        {
          if(runningtime.isAfter(endmoment))
            break;

          var tmpevent = {};
          tmpevent.id =event.id;
          var eventtime = runningtime.clone();
          tmpevent.start = eventtime.format('YYYY-MM-DD HH:mm');
          var endtime = eventtime.add(30,'minutes');
          tmpevent.end = endtime.format('YYYY-MM-DD HH:mm');
          tmpevent.title = event.title;
          tmpevent.type = event.type;
          tmpevent.repeat = "weekly";
          events.push(tmpevent);
          runningtime.add(7, 'day');
        }
      }
    }


    // montly:
    var file_schedule = 'datastore/schedule/monthly.json';
    var target = path.resolve(file_schedule);
    var stats = fs.statSync(target);
    if (stats.isFile()) {
      var contents = fs.readFileSync(target, 'utf8');
      var elements = JSON.parse(contents);

      for(var ele = 0; ele < elements.length; ele++)
      {
        var currmom = startmoment.clone();
        var event = elements[ele];
        var parsed = moment(event.start);
        currmom.hours(parsed.hours()).minutes(parsed.minutes());

        var bla = currmom.date();
        currmom.date(Number(event.rdayofmonth));
        // need day of month,

        var runningtime = currmom.clone();
        while(1)
        {
          if(runningtime.isAfter(endmoment))
            break;

          var tmpevent = {};
          tmpevent.id =event.id;
          var eventtime = runningtime.clone();
          tmpevent.start = eventtime.format('YYYY-MM-DD HH:mm');
          var endtime = eventtime.add(30,'minutes');
          tmpevent.end = endtime.format('YYYY-MM-DD HH:mm');
          tmpevent.title = event.title;
          tmpevent.type = event.type;
          tmpevent.repeat = "dayofmonth";
          events.push(tmpevent);

          runningtime.add(1, 'month');
        }
      }
    }





    // day of.
    // need to figure out how to order elements into files...
    // and how many files do I think I will have.... (elements).
    var current_d = startd;
    while(1) {
      var file_schedule = 'datastore/schedule/' + current_d + '.json';
      var target = path.resolve(file_schedule);
      var stats = fs.statSync(target);
      if (stats.isFile()) {
        var contents = fs.readFileSync(target, 'utf8');
        var elements = JSON.parse(contents);
        for (var idx = 0; idx < elements.length; idx++) {
          var temp = moment(elements[idx].start);
          elements[idx].start = temp.format('YYYY-MM-DD HH:mm');
          var endtemp = temp.add(30,'minutes');
          elements[idx].end = endtemp.format('YYYY-MM-DD HH:mm');
          events.push(elements[idx]);
        }
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
  }
  catch(err)
  {
    var i = 0;
    i = i + 1;
  }
  JSON.stringify(events);
  res.send(events);
});
module.exports = router;
