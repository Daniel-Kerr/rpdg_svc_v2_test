var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
var moment = require('moment');
var app = express();
var os = require( 'os' )

var rpdg_driver = require('./rpdg_driver.js');
var data_utils = require('./data_utils.js');
global.test_mode =false;
//global.test_config;  //used for holding test config in memory,


global.test_scenelist = [];   //1/8/17 used for holding scenes during test.  in mem only
/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');

});


router.post('/setmode', function(req, res) {

    global.test_mode = true;
    global.test_config= {};
    global.test_scenelist = [];

    res.status(200).send("OK");

});

router.post('/clearmode', function(req, res) {

    global.test_mode = false;
    global.test_config= {};
    global.test_scenelist = [];
    global.currentconfig = data_utils.getConfigFromFile();
    rpdg_driver.updateConfigData();

    res.status(200).send("OK");

});


router.post('/setdaylightlevel', function(req, res) {

    var retval = "BadData";
    if(req.body.inputnumber != undefined) {

        var inputnumber = req.body.inputnumber;
        var levelvolts = req.body.levelvolts;
        rpdg_driver.setTestDayLightLevel(inputnumber,levelvolts);
        retval = "OK";
    }

    res.status(200).send(retval);


});

router.post('/setdimmerlevel', function(req, res) {

    var retval = "BadData";
    if(req.body.inputnumber != undefined) {
        var inputnumber = req.body.inputnumber;
        var levelvolts = req.body.levelvolts;
        rpdg_driver.setTestDimmerLevel(inputnumber,levelvolts);
        retval = "OK";
    }
    res.status(200).send(retval);

});

router.post('/setwetdrycontactlevel', function(req, res) {

    var retval = "BadData";
    if(req.body.inputnumber != undefined) {
        var inputnumber = req.body.inputnumber;
        var level = req.body.level;
        rpdg_driver.setTestWetDryContactLevel(inputnumber,level);
        retval = "OK";
    }
    res.status(200).send(retval);

});

router.post('/setdaylighttimerinterval', function(req, res) {

    var retval = "BadData";
    if(req.body.interval != undefined) {
        var interval = req.body.interval;
        rpdg_driver.setDayLightPollingPeriodSeconds(interval);
        retval = "OK";
    }
    res.status(200).send(retval);

});

global.virtualbasetime = undefined;
global.virtualtimeset = undefined;

router.post('/setvirtualdatetime', function(req, res) {

    var ts = req.body.timestring;
    global.virtualbasetime = moment(ts);
    global.virtualtimeset = moment();
    res.status(200).send("OK");

});

router.post('/clearvirtualdatetime', function(req, res) {

    global.virtualbasetime = undefined;
    res.status(200).send("OK");

});


router.post('/sendoccupancytogroup', function(req, res) {

    var group = req.body.groupname
    rpdg_driver.sendOccupancyMessageToGroup(group);
    res.status(200).send("OK");

});

router.post('/sendvacancytogroup', function(req, res) {

    var group = req.body.groupname
    rpdg_driver.sendVacancyMessageToGroup(group);
    res.status(200).send("OK");

});


router.post('/clearallscenes', function(req, res) {

    if (global.test_mode) {
        global.test_scenelist = {};
        res.status(200).send("OK");
    }
    else
        res.status(200).send("Not in Test mode");

});

router.post('/clearallgroups', function(req, res) {

    if (global.test_mode) {
        global.currentconfig.groups = [];
        res.status(200).send("OK");
    }
    else
        res.status(200).send("Not in Test mode");

});


// test hook for zero to 10 v driver
router.get('/zero2tendrive', function(req, res, next) {

    rpdg_driver.testZero2TenVoltDriver();
    res.send('command sent to driver');

});

// test hook for zero to 10 v driver
router.get('/dimmeredgecfg', function(req, res, next) {

    rpdg_driver.testDimmerEdgeConfig();
    res.send('dimmer edge command sent to driver');

});

module.exports = router;
