var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
var fse = require('fs-extra');
var moment = require('moment');
var app = express();
var os = require( 'os' );

var file_config = 'datastore/config.json';
var rpdg_driver = require('./rpdg_driver.js');

var data_utils = require('./data_utils.js');

global.currentconfig = {}; //this is the current config in mem
// 1/2/17,  if cfg file does not exist, create it,
var testfile = data_utils.getConfigFromFile();
if(testfile == undefined)
{
    var default_cfg = 'datastore/default/config_default.json';
    fse.copySync(default_cfg, file_config);
}


global.currentconfig =  data_utils.getConfigFromFile();
rpdg_driver.updateConfigData();


var validateconfig = data_utils.commandLineArgPresent("validate");

/*if(process.argv.length > 0)
 {
 for(var i = 0; i < process.argv.length; i++)
 {
 var argval = process.argv[i];
 if(argval.includes("validate"))
 {
 validateconfig = true;
 }
 }

 }*/


router.get('/', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/configuration.html'));
});


function validateConfigData(data)
{
    //
    // bug 60  check duplicate fixture ids.
    var fixtureids = [];

    for(var i = 0; i < data.fixtures.length; i++)
    {
        var fix = data.fixtures[i];
        if(fixtureids.indexOf(fix.uid) > -1)
        {
            return "duplicate fixture";
        }
        else
            fixtureids.push(fix.uid);
    }

    return "OK";
}

// 2/24/17, temp code to verify that all fixtures in groups and scenes are in the fixture list,  if not, remove them group/scene,
// eventually this become a rest operation, and will flow naturally,
function cleanupGroups(config)
{
    for(var i = 0; i < config.groups.length; i++)  //for each group
    {
        var group = config.groups[i];
        var fixlist = group.fixtures;
        for(var j = 0; j < fixlist.length; j++)   //get its fixtures, and check each fixture is in the master fix list,
        {
            var uid = fixlist[j];

            var found = false;
            for(var k = 0; k < config.fixtures.length; k++)
            {
                var fix = config.fixtures[k];
                if(fix.uid == uid)  // found match,
                {
                    found = true;
                    break;
                }
            }
            if(!found)
            {
                // remove this from group.
                fixlist.splice(j,1);
            }
        }
    }
    return config;
}

// 2/24/17, temp code to verify that all fixtures in groups and scenes are in the fixture list,  if not, remove them group/scene,
// eventually this become a rest operation, and will flow naturally,
function cleanupScenes()
{
    var scenelist = data_utils.getSceneListFromScenesFile();
    var changed = false;
    for(var i = 0; i < scenelist.length; i++)  //for each scene
    {
        var scene = scenelist[i];
        var fixlist = scene.fixtures;
        for(var j = 0; j < fixlist.length; j++)   //get its fixtures, and check each fixture is in the master fix list,
        {
            var uid = fixlist[j].uid;

            var found = false;
            for(var k = 0; k < global.currentconfig.fixtures.length; k++)
            {
                var fix = global.currentconfig.fixtures[k];
                if(fix.uid == uid)  // found match,
                {
                    found = true;
                    break;
                }
            }
            if(!found)
            {
                // remove this from scene, .
                fixlist.splice(j,1);
                changed = true;
            }
        }
    }

    // write new scene file if changed,
    if(changed)
    {
        data_utils.writeSceneFileWithList(scenelist);
    }

}


router.post('/setconfig', function(req, res) {

    // 2/6/17
    var isvalid = undefined;
    // if(validateconfig)  // removed 2/24/17
    isvalid = data_utils.validateConfigData(req.body);

    if(isvalid != undefined) {
        console.log("invalid config, not valid!!!-- rejecting");
        res.status(200).send(isvalid);
    }
    else
    {
        var validated = validateConfigData(req.body);
        if (validated == "OK") {

            var returndata = "";
            if (!global.test_mode) {
                var data = req.body;
                data = cleanupGroups(data);

                if (data.version != undefined && data.version < global.currentconfig.version) {
                    returndata = "version missmatch";
                }
                else {

                    if (data.version == undefined)
                        data.version = 0;

                    console.log("new config version: " + data.version);
                    data.version++;  // bump version
                    global.currentconfig = data;
                    returndata = global.currentconfig;

                    data_utils.writeConfigToFile();
                    rpdg_driver.updateConfigData();

                }
                res.status(200).send(returndata);
            }
            else {
                global.currentconfig = req.body;
                console.log("config set for test mode");
                rpdg_driver.updateConfigData();
                res.status(200).send("OK");
            }
        }
        else
            res.status(200).send(validated);



        cleanupScenes(); // 2/24/17,
    }

});


router.get('/getconfig', function(req, res) {

    var stringedcfg = global.currentconfig;
    JSON.stringify(stringedcfg);
    res.status(200).send(stringedcfg);

});

module.exports = router;
