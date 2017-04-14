var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
var moment = require('moment');
var app = express();
var os = require( 'os' );
var pad = require('pad');
var TAG = pad(path.basename(__filename),15);
var SunCalc = require('suncalc');
require('datejs');
var service = require('../controllers/service');
var schedule_mgr = require('../controllers/schedule_mgr.js');

var file_schedule = 'datastore/schedule.json';
/* GET */
router.get('/', function(req, res, next) {
  res.sendFile(path.join( app.get('views') +'/scheduler2.html'));
});


var last_start_req;
var last_end_req;



// for new schedular.
router.get('/getschedule2', function(req, res) {

  // query string from ,  to.
  var start = new Date(req.query.from);
  var end = new Date(req.query.to);
  last_start_req = start;
  last_end_req = end;
  var events = schedule_mgr.getEventsinTimeSpan(start,end);
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
  eventobj.relhour = body[id +"_relhour"];
  eventobj.relmin = body[id +"_relmin"];
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
        schedule_mgr.createEvent(eventobj);
      }
      else if (crudaction == "deleted")  //----> DELETE
      {
        schedule_mgr.deleteEvent(eventobj);
      }
      if (crudaction == "updated")  //----> UPDATED
      {
          schedule_mgr.updateEvent(eventobj);
      }
    }
  }

  var events_updated = schedule_mgr.getEventsinTimeSpan(last_start_req, last_end_req);
  res.status(200).send(events_updated);


});


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



router.post('/setschedulemode', function(req, res) {

  var enable = req.body.enable;
  service.setScheduleModeEnable(enable);
  res.status(200).send("OK");
});



router.get('/getpersistantstore', function(req, res) {

  res.status(200).send(service.getPersistantStore());
});


module.exports = router;

