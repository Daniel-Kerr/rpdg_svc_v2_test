var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
var moment = require('moment');
var app = express();
var os = require( 'os' )
var data_utils = require('../utils/data_utils.js');
var service = require('../controllers/service');
//global.test_mode =false;
/* GET users listing. */
//router.get('/', function(req, res, next) {
 //   res.send('respond with a resource');
//
//});


router.get('/', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/testapis.html'));
});
/*
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
*/

router.post('/setinputlevel', function(req, res) {

    if(req.body.interface != undefined) {
        var interface = req.body.interface;  //rpdg / enocean
        var type = req.body.type;     // type -  level  / contact
        var inputid = req.body.inputid;   // the input number (1 based)
        var levelvolts = req.body.levelvolts;   // the value of hte input,  (0- 10 for level) 0 / 1 for contact
        service.testSetInputLevelVolts(interface, type, inputid, levelvolts);
    }
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);
});


router.post('/setdaylighttimerinterval', function(req, res) {

    if(req.body.interval != undefined) {
        var interval = req.body.interval;
        global.currentconfig.daylightpollsec = interval;  // 6/8/17,

        data_utils.writeConfigToFile();
        service.resetDayLightPollCount();
    }

    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);

});

global.virtualbasetime = undefined;
global.virtualtimeset = undefined;

router.post('/setvirtualdatetime', function(req, res) {

    var ts = req.body.timestring;
    service.setVirtualTime(ts);
    res.status(200).send("OK");

});

router.post('/clearvirtualdatetime', function(req, res) {


    service.setVirtualTime();
    res.status(200).send("OK");

});


router.post('/sendoccupancytogroup', function(req, res) {

    var group = req.body.groupname
    service.sendOccupancyMessageToGroup(group);
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);

});

router.post('/sendvacancytogroup', function(req, res) {

    var group = req.body.groupname
    service.sendVacancyMessageToGroup(group);
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);

});

router.post('/enablerpdgpolling', function(req, res) {

    var enable = JSON.parse(req.body.polling);

    service.enableRPDGHardwarePolling(enable);
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);

});


router.post('/sethwpollingperiod', function(req, res) {

    var period = JSON.parse(req.body.pollingperiod);

    service.setRPDGHWPollingPeriod(period);
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);

});



router.post('/forcecrash', function(req, res) {

    service.forcecrash();
    res.status(200).send(cfg);

});



// test hook for zero to 10 v driver
/*router.get('/dimmeredgecfg', function(req, res, next) {

    service.testDimmerEdgeConfig();
    res.send('dimmer edge command sent to driver');

});  */

module.exports = router;
