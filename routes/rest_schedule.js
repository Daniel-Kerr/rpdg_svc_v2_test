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

var file_schedule = '../datastore/schedule.json';
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

     var debug = JSON.stringify(req.body,null,4);

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


router.post('/deleteall', function(req, res) {

  schedule_mgr.deleteAllEvents();
  res.status(200).send("OK");
});



router.post('/setschedulemode', function(req, res) {

  var enable = req.body.enable;
  service.setScheduleModeEnable(enable);
  res.status(200).send("OK");
});



module.exports = router;

