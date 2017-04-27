/**
 * Created by Nick on 1/15/2017.
 */
var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
var fse = require('fs-extra');
var moment = require('moment');
var app = express();
var os = require( 'os' );
var data_utils = require('../utils/data_utils.js');
var service = require('../controllers/service');

router.get('/', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/groups.html'));
});


router.post('/setgrouptolevel', function(req, res) {

    var code = 400;
    var groupname = req.body.name;
    var level = req.body.level;
    if(groupname != undefined && level != undefined)
    {
        var groupobj = global.currentconfig.getGroupByName(groupname);
        if(groupobj != undefined)
        {
            service.setGroupToBrightnessLevel(groupname,level, "wallstation");
            code = 200;
        }
    }
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(code).send(cfg);

});


router.post('/setgrouptocolortemp', function(req, res) {

    var code = 400;
    var groupname = req.body.name;
    var ctemp = req.body.ctemp;
    var brightness = req.body.brightness;

    if(groupname != undefined && ctemp != undefined && brightness != undefined) {
        var groupobj = global.currentconfig.getGroupByName(groupname);
        if (groupobj != undefined) {
            service.setGroupToColorTemp(groupname,ctemp,brightness);
            code = 200;
        }
    }
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(code).send(cfg);
});

/*
 function bumpConfigVersionAndUpdate()
 {
 if(!global.test_mode) {
 global.currentconfig.version++; // bump version
 data_utils.writeConfigToFile();
 service.updateConfigData();
 return global.currentconfig;  //return updated
 }
 else
 {
 service.updateConfigData();
 return "OK";
 }
 }
 */

router.post('/getgroupmembers', function(req, res) {

    var groupname = req.body.name;
    var returndata = "not found";
    var found = false;
    for(var i = 0; i < global.currentconfig.groups.length; i++)
    {
        var group = global.currentconfig.groups[i];
        if(group.name == groupname)
        {
            returndata = group;
            found = true;
            break;
        }
    }

    res.status(200).send(returndata);
});


module.exports = router;