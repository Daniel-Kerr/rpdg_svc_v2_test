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
var rpdg_driver = require('./rpdg_driver.js');
var data_utils = require('./data_utils.js');


router.get('/', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/groups.html'));
});



router.post('/setgrouptolevel', function(req, res) {

    var groupname = req.body.name;
    var level = req.body.level;

    var status = rpdg_driver.setGroupToBrightnessLevel(groupname,level);
    res.send(status);
});


router.post('/setgrouptocolortemp', function(req, res) {

    var groupname = req.body.name;
    var ctemp = req.body.ctemp;

    var status = rpdg_driver.setGroupToColorTemp(groupname,ctemp);
    res.send(status);
});



function bumpConfigVersionAndUpdate()
{
    if(!global.test_mode) {
        global.currentconfig.version++; // bump version
        data_utils.writeConfigToFile();
        rpdg_driver.updateConfigData();
        return global.currentconfig;  //return updated
    }
    else
    {
        rpdg_driver.updateConfigData();
        return "OK";
    }
}

router.post('/addfixturetogroup', function(req, res) {

    var fixtureuid = req.body.uid;
    var groupname = req.body.group;

    var returndata = "error";
    for(var i = 0; i < global.currentconfig.groups.length; i++)
    {
        if(global.currentconfig.groups[i].name == groupname)
        {
            if(global.currentconfig.groups[i].fixtures.indexOf(fixtureuid) == -1) {
                global.currentconfig.groups[i].fixtures.push(fixtureuid);
                returndata = bumpConfigVersionAndUpdate();
            }
            else {
                returndata = data_utils.generateErrorMessage("duplicate");
            }
            break;
        }
    }
    res.status(200).send(returndata);

});


router.post('/deletefixturefromgroup', function(req, res) {

    var fixtureuid = req.body.uid;
    var groupname = req.body.group;

    var returndata = "error";
    for(var i = 0; i < global.currentconfig.groups.length; i++)
    {
        if(global.currentconfig.groups[i].name == groupname)
        {
            var index = global.currentconfig.groups[i].fixtures.indexOf(fixtureuid);
            if(index > -1)
            {
                global.currentconfig.groups[i].fixtures.splice(index,1);
                returndata = bumpConfigVersionAndUpdate();
            }
            else {
                returndata = "not found";
            }
            break;
        }
    }
    res.status(200).send(returndata);
});


router.post('/creategroup', function(req, res) {

    var groupname = req.body.name;
    var type = req.body.type;
    var returndata = "error";
    var found = false;
    for(var i = 0; i < global.currentconfig.groups.length; i++)
    {
        var group = global.currentconfig.groups[i];
        if(group.name == groupname)
        {
            found = true;
            break;
        }
    }

    if(!found)
    {
        var groupobj = req.body;
        groupobj.fixtures = [];
        global.currentconfig.groups.push(groupobj);
        returndata = bumpConfigVersionAndUpdate();
    }
    else
        returndata= "duplicate name";

    res.status(200).send(returndata);
});

router.post('/deletegroup', function(req, res) {

    var groupname = req.body.name;
    var returndata = "error";
    var found = false;
    for(var i = 0; i < global.currentconfig.groups.length; i++)
    {
        var group = global.currentconfig.groups[i];
        if(group.name == groupname)
        {
            global.currentconfig.groups.splice(i,1);
            found = true;
            break;
        }
    }

    if(found)
    {
        returndata = bumpConfigVersionAndUpdate();
    }
    else
        returndata= "name not found";

    res.status(200).send(returndata);
});



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