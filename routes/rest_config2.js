var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
//var fse = require('fs-extra');
var moment = require('moment');
var app = express();
var os = require( 'os' );

var file_config = '../datastore/config.json';

var OnOffSetting = require('../models/OnOffSetting.js');
var DimSetting = require('../models/DimSetting.js');
var CCTSetting = require('../models/CCTSetting.js');
var RGBWSetting = require('../models/RGBWSetting.js');
//var rpdg_driver = require('./rpdg_driver.js');

//var data_utils = require('./data_utils.js');

//global.currentconfig = {}; //this is the current config in mem
// 1/2/17,  if cfg file does not exist, create it,

//var testfile = data_utils.getConfigFromFile();
//if(testfile == undefined)
//{
//    var default_cfg = 'datastore/default/config_default.json';
//    fse.copySync(default_cfg, file_config);
//}


//global.currentconfig =  data_utils.getConfigFromFile();
//rpdg_driver.updateConfigData();

var data_utils = require('../utils/data_utils.js');
//var validateconfig = data_utils.commandLineArgPresent("validate");

router.get('/test_crud', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/test_crud.html'));
});

router.get('/', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/configuration.html'));
});

var OnOffFixture = require('../models/OnOffFixture.js');
var DimFixture = require('../models/DimFixture.js');
var CCTFixture = require('../models/CCTFixture.js');
var RGBWFixture = require('../models/RGBWFixture.js');

//var OccSensor = require('../models/OccSensor.js');
//var MotionSensor = require('../models/MotionSensor.js');
//var Dimmer = require('../models/Dimmer.js');
//var DayLightSensor = require('../models/DayLightSensor.js');
var LevelInput = require('../models/LevelInput.js');

var Group = require('../models/Group.js');
var Scene = require('../models/Scene.js');
var SceneList = require('../models/SceneList.js');
var ContactInput = require('../models/ContactInput.js');
// CRUD interface for modifying the configuration.
//var file_paramoptions = '../datastore/paramoptions.json';
var file_paramoptions = 'routes/paramoptions.json';

var service = require('../controllers/service');

var schedule_mgr = require('../controllers/schedule_mgr.js');


router.get('/getconfig', function(req, res) {

    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);

});

router.get('/getparamoptions', function(req, res) {

    var target = path.resolve(file_paramoptions);
    var props = require(target);
    res.send(props);
});

router.get('/getinterfaceoutputs', function(req, res) {

    var interfaces = {};

    //  var interfaces = [];
    var rpdg = {};
    rpdg.pwmoutputs = ["1","2","3","4","5","6","7","8"];
    rpdg.plcoutputs = ["1","2","3","4"];
    rpdg.levelinputs = ["1","2","3","4"];
    rpdg.contactinputs = ["1","2","3","4"];

    var enocean = {};
    enocean.outputs = service.getEnoceanKnownOutputDevices(); //["002c0d1f","002c0d33","002c0d123","00440d1f"];
    enocean.levelinputs = service.getEnoceanKnownLevelInputs(); //["ff445566","00667788"];
    enocean.contactinputs = service.getEnoceanKnownContactInputs(); //["00112233","00224455"];

    interfaces.rpdg = rpdg;
    interfaces.enocean = enocean;

    res.send(interfaces);
});

/*
// Fixtures:
router.post('/savefixture', function(req, res) {

    if(req.body != undefined && req.body.type != undefined )
    {

        //6/8/17 handle rename of fixutre here. by testing for output number match,
        for(var i = 0; i < global.currentconfig.fixtures.length; i++)
        {
            var fix = global.currentconfig.fixtures[i];
            if(fix.outputid == req.body.outputid && fix.interfacename == req.body.interfacename && fix.assignedname != req.body.assignedname)
            {
                // found matching output id,   but name does not match, this is a rename case.
                global.currentconfig.renameFixtureInGroupsScenes(fix.assignedname, req.body.assignedname);
                // go through all scenes and groups, and rename old to new.
                global.currentconfig.fixtures.splice(i,1); //remove it
                //global.currentconfig.fixtures.splice(i,1); //remove it,
                break;
            }
            else if(fix.assignedname == req.body.assignedname)
            {
                global.currentconfig.fixtures.splice(i,1); //remove it,
                break;
            }
        }


        // validate here,
        // make sure fix params exists if not add them in, blank, (default),
        // check if name already exists,  if so update,
        // removved 6/8/17
        /* var exists = false;
         for(var i = 0; i < global.currentconfig.fixtures.length; i++)
         {
         var fix = global.currentconfig.fixtures[i];
         if(fix.assignedname == req.body.assignedname)
         {
         exists = true;
         global.currentconfig.fixtures.splice(i,1); //remove it,
         break;
         }
         }  */

        // 5/24/17  add log object when adding fixture..
  /*      var logobj = {};
        var now = moment();
        logobj.date = now.toISOString();

        var fix = undefined;
        // if(!exists) {
        switch (req.body.type) {
            case "on_off":
                fix = new OnOffFixture();
                fix.fromJson(req.body);
                global.currentconfig.fixtures.push(fix);
                logobj.level = "0"; //.toFixed();
                break;
            case "dim":
                fix = new DimFixture();
                fix.fromJson(req.body);
                global.currentconfig.fixtures.push(fix);
                logobj.level = "0";
                break;
            case "cct":
                var fix = new CCTFixture();
                fix.fromJson(req.body);
                global.currentconfig.fixtures.push(fix);
                logobj.brightness = 0;
                logobj.colortemp = 3500;
                break;
            case "rgbw":
                var fix = new RGBWFixture();
                fix.fromJson(req.body);
                global.currentconfig.fixtures.push(fix);

                logobj.red = 0;
                logobj.green = 0;
                logobj.blue = 0;
                logobj.white = 0;
                break;
            default:
                break;
        }
        // }

        data_utils.appendOutputObjectLogFile(req.body.assignedname, logobj);

        if(fix != undefined)
        {
            service.setupHWInterface(fix.assignedname);
        }
    }

    service.updatePWMPolarity();
    var cfg = JSON.stringify(global.currentconfig,null,2);
    // for now cache it to disk .
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});
*/

  /*
router.post('/deletefixture', function(req, res) {


    // todo , remove from associated groups / scense ,hree,
    if(req.body != undefined && req.body.assignedname != undefined )
    {
        // find the name in our db.
        for(var i = 0; i < global.currentconfig.fixtures.length; i++)
        {
            var fix = global.currentconfig.fixtures[i];
            if(fix.assignedname == req.body.assignedname)
            {
                global.currentconfig.fixtures.splice(i,1);
                break;
            }
        }

        // delete from groups
        for(var i = 0; i < global.currentconfig.groups.length; i++)
        {
            var group = global.currentconfig.groups[i];
            for(var k = 0; k < group.fixtures.length; k++) {

                var fixname = group.fixtures[k];
                if (fixname == req.body.assignedname) {

                    group.fixtures.splice(k, 1);
                    break;
                }
            }
        }


        // delete from scenes
        for(var i = 0; i < global.currentconfig.scenes.length; i++)
        {
            var scene = global.currentconfig.scenes[i];
            for(var k = 0; k < scene.fixtures.length; k++) {

                var fixname = scene.fixtures[k].name;
                if (fixname == req.body.assignedname) {

                    scene.fixtures.splice(k, 1);
                    break;
                }
            }
        }

    }

    service.updatePWMPolarity();

    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});

*/

/*

router.post('/savelevelinput', function(req, res) {

    if(req.body != undefined && req.body.type != undefined )
    {
        // validate here,
        // make sure fix params exists if not add them in, blank, (default),
        // check if name already exists,  if so update,

        for(var i = 0; i < global.currentconfig.levelinputs.length; i++)
        {
            var fix = global.currentconfig.levelinputs[i];
            if(fix.assignedname == req.body.assignedname)
            {
                global.currentconfig.levelinputs.splice(i,1); //remove it,
                break;
            }
        }

        // 5/24/17  add log object when adding fixture..
        var logobj = {};
        logobj.date = new moment().toISOString();
        logobj.value = 0;
        data_utils.appendInputObjectLogFile(req.body.assignedname, logobj);




        var fix = new LevelInput();
        fix.fromJson(req.body);
        global.currentconfig.levelinputs.push(fix);
        service.updateRPDGInputDrive();
    }

    var cfg = JSON.stringify(global.currentconfig,null,2);

    // for now cache it to disk .
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});




router.post('/deletelevelinput', function(req, res) {



    if(req.body != undefined && req.body.assignedname != undefined )
    {
        // find the name in our db.
        for(var i = 0; i < global.currentconfig.levelinputs.length; i++)
        {
            var fix = global.currentconfig.levelinputs[i];
            if(fix.assignedname == req.body.assignedname)
            {
                global.currentconfig.levelinputs.splice(i,1);
                break;
            }
        }
    }

    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});
*/

router.post('/savecontactinput', function(req, res) {

    if(req.body != undefined && req.body.type != undefined )
    {
        // validate here,
        // make sure fix params exists if not add them in, blank, (default),
        // check if name already exists,  if so update,

        for(var i = 0; i < global.currentconfig.contactinputs.length; i++)
        {
            var fix = global.currentconfig.contactinputs[i];
            if(fix.assignedname == req.body.assignedname)
            {
                // update it,
                global.currentconfig.contactinputs.splice(i,1);
                break;
            }
        }

        var logobj = {};
        logobj.date = new moment().toISOString();
        logobj.value = 0;
        data_utils.appendInputObjectLogFile(req.body.assignedname, logobj);


        var ci = new ContactInput();
        ci.fromJson(req.body);
        global.currentconfig.contactinputs.push(ci);

    }

    var cfg = JSON.stringify(global.currentconfig,null,2);

    // for now cache it to disk .
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});




router.post('/deletecontactinput', function(req, res) {

    if(req.body != undefined && req.body.assignedname != undefined )
    {
        // find the name in our db.
        for(var i = 0; i < global.currentconfig.contactinputs.length; i++)
        {
            var fix = global.currentconfig.contactinputs[i];
            if(fix.assignedname == req.body.assignedname)
            {
                global.currentconfig.contactinputs.splice(i,1);


                // remove this input from any bound fixtures.
                removeinputfromfixtures(req.body.assignedname)


                break;
            }
        }
    }

    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});



function removeinputfromfixtures(inputname)
{
    for(var i = 0; i < global.currentconfig.fixtures.length; i++)
    {
        var fix = global.currentconfig.fixtures[i];
        var idx = fix.boundinputs.indexOf(inputname);
        if(idx > -1) {
            global.currentconfig.fixtures[i].boundinputs.splice(idx, 1);
        }

    }
}





// *************************************FROM old code,  group stuff *************


router.post('/savegroup', function(req, res) {

    if (req.body != undefined && req.body.name != undefined) {

        var groupname = req.body.name;
        var type = req.body.type;

        var found = false;
        for (var i = 0; i < global.currentconfig.groups.length; i++) {
            var group = global.currentconfig.groups[i];
            if (group.name == groupname) {
                found = true;
                break;
            }
        }

        if (!found) {
            var grp = new Group();
            grp.fromJson(req.body);

            global.currentconfig.groups.push(grp);
        }
    }

    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
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


    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});




router.post('/addfixturetogroup', function(req, res) {

    var fixturename = req.body.fixturename;
    var groupname = req.body.groupname;

    var returndata = "error";
    for(var i = 0; i < global.currentconfig.groups.length; i++)
    {
        if(global.currentconfig.groups[i].name == groupname)
        {
            if(global.currentconfig.groups[i].fixtures.indexOf(fixturename) == -1) {
                global.currentconfig.groups[i].fixtures.push(fixturename);
            }
            break;
        }
    }
    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);

});


router.post('/deletefixturefromgroup', function(req, res) {

    var fixturename = req.body.fixturename;
    var groupname = req.body.groupname;
    var returndata = "error";
    for(var i = 0; i < global.currentconfig.groups.length; i++)
    {
        if(global.currentconfig.groups[i].name == groupname)
        {
            var index = global.currentconfig.groups[i].fixtures.indexOf(fixturename);
            if(index > -1)
            {
                global.currentconfig.groups[i].fixtures.splice(index,1);
            }

            break;
        }
    }
    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);

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









router.post('/savescene', function(req, res) {

    if (req.body != undefined && req.body.name != undefined) {

        var scenename = req.body.name;

        var found = false;
        for (var i = 0; i < global.currentconfig.scenes.length; i++) {
            var scene = global.currentconfig.scenes[i];
            if (scene.name == scenename) {
                found = true;
                break;
            }
        }

        if (!found) {
            var grp = new Scene();
            grp.fromJson(req.body);

            global.currentconfig.scenes.push(grp);
        }
    }

    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});

router.post('/deletescene', function(req, res) {

    var scenename = req.body.name;
    var returndata = "error";
    var found = false;
    for(var i = 0; i < global.currentconfig.scenes.length; i++)
    {
        var group = global.currentconfig.scenes[i];
        if(group.name == scenename)
        {
            global.currentconfig.scenes.splice(i,1);
            found = true;
            break;
        }
    }


    // remove scene from any scene lists

    for(var i = 0; i < global.currentconfig.scenelists.length; i++)
    {
        var scenelist = global.currentconfig.scenelists[i];

        for(var j = 0; j < scenelist.scenes.length; j++)
        {
            var name = scenelist.scenes[j];
            if(name == scenename)
            {
                scenelist.scenes.splice(j,1);
                scenelist.activeindex = 0;
            }

        }
    }

    // 4/10/17 remove any sched events that use this scene.

    schedule_mgr.removeSceneFromSchedule(scenename);








    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});




router.post('/addfixturetoscene', function(req, res) {

    var fixturename = req.body.fixturename;
    var fixtype = req.body.type;
    var scenename = req.body.scenename;

    var returndata = "error";

    var sceneobj = global.currentconfig.getSceneByName(scenename);
    if(sceneobj != undefined)
    {
        var found = sceneobj.containsFixture(fixturename);
        var fixobj = global.currentconfig.getFixtureByName(fixturename);
        if(!found && fixobj != undefined)
        {
            // 6/8/17,
            // moved abstraction up to capture fix current settings.
            var set = undefined;
            switch(fixtype)
            {
                case "on_off":
                    set = new OnOffSetting();
                    set.name = fixturename;
                    set.level = fixobj.level;

                    break;
                case "dim":
                    set = new DimSetting();
                    set.name = fixturename;
                    set.level = fixobj.level;

                    break;

                case "cct":
                    set = new CCTSetting();
                    set.name = fixturename;
                    set.colortemp = fixobj.colortemp;
                    set.brightness = fixobj.brightness;

                    break;
                case "rgbw":
                    set = new RGBWSetting();
                    set.name = fixturename;
                    set.red = Number(fixobj.red);
                    set.green = Number(fixobj.green);
                    set.blue = Number(fixobj.blue);
                    set.white = Number(fixobj.white);

                    break;
                default:
                    break;
            }

            sceneobj.addFixture(set);
        }
    }

    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);

});


router.post('/deletefixturefromscene', function(req, res) {

    var fixturename = req.body.fixturename;
    var scenename = req.body.scenename;
    var returndata = "error";

    var sceneobj = global.currentconfig.getSceneByName(scenename);
    if(sceneobj != undefined) {
        sceneobj.removeFixture(fixturename);
    }
    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);

});



router.post('/savefixturescenesettings', function(req, res) {

    var scenename = req.body.name;
    var returndata = "error";

    var sceneobj = global.currentconfig.getSceneByName(scenename);
    if(sceneobj != undefined)
    {
        // iter through each fixture, get its current setting, and svae it to the scene.
        var k = 0;
        for(var k = 0; k < sceneobj.fixtures.length; k++) // for each fixture in this scene,
        {
            var scenefix = sceneobj.fixtures[k];
            // get the fixture out of the global list,
            var fixobj = global.currentconfig.getFixtureByName(scenefix.name);
            if(fixobj.type == "on_off" || fixobj.type == "dim")
            {
                scenefix.level = fixobj.level;
            }
            else if(fixobj.type == "cct")
            {
                scenefix.colortemp = fixobj.colortemp;
                scenefix.brightness = fixobj.brightness;

            }
            else if(fixobj.type == "rgbw")
            {
                scenefix.red = Number(fixobj.red);
                scenefix.green = Number(fixobj.green);
                scenefix.blue = Number(fixobj.blue);
                scenefix.white = Number(fixobj.white);
            }
        }
    }

    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);

});




router.post('/deleteenocean', function(req, res) {


    for(var i = 0 ; i < global.currentconfig.enocean.length; i++)
    {
        var endev = global.currentconfig.enocean[i];
        if(endev.enoceanid == req.body.enoceanid)
        {
            global.currentconfig.enocean.splice(i,1);
            break;
        }
    }


    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});





router.post('/saveenocean', function(req, res) {

    for(var i = 0 ; i < global.currentconfig.enocean.length; i++)
    {
        var endev = global.currentconfig.enocean[i];
        if(endev.enoceanid == req.body.enoceanid)
        {
            global.currentconfig.enocean.splice(i,1);
            break;
        }
    }

    global.currentconfig.enocean.push(req.body);

    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});





router.post('/enoceanteach', function(req, res) {

    service.teachEnoceanDevice(req.body.enoceanid);
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);
});



router.post('/enoceanlearn', function(req, res) {

    service.startEnoceanLearning();
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);
});



// **************************************************SET CONFIG API FOR TEST ONLY **********************


router.post('/setconfig', function(req, res) {

    service.testmode_SetConfig(req.body);
    // NO WRITE
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);

});
// *********************************************************************************************************



// ***** 3/21/17 , scene list support




router.post('/savescenelist', function(req, res) {

    if (req.body != undefined && req.body.name != undefined) {

        var scenelistname = req.body.name;

        var found = false;
        for (var i = 0; i < global.currentconfig.scenelists.length; i++) {
            var scene = global.currentconfig.scenelists[i];
            if (scene.name == scenelistname) {
                found = true;
                // remove it,
                global.currentconfig.scenelists.splice(i,1);
                break;
            }
        }


        var sc = new SceneList();
        sc.fromJson(req.body);
        global.currentconfig.scenelists.push(sc);

    }

    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});

router.post('/deletescenelist', function(req, res) {

    var scenename = req.body.name;
    var returndata = "error";
    var found = false;
    for(var i = 0; i < global.currentconfig.scenelists.length; i++)
    {
        var group = global.currentconfig.scenelists[i];
        if(group.name == scenename)
        {
            global.currentconfig.scenelists.splice(i,1);
            found = true;
            break;
        }
    }


    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});



router.post('/setoutputs', function(req, res) {

    var pwm = req.body.pwm;
    var plc = req.body.plc;
    if(pwm != undefined) {
        for (var i = 0; i < pwm.length; i++) {
            var item = pwm[i];
            service.setRPDGPWMOutput(item.number, item.level);
        }
    }
    if(plc != undefined) {
        for (var i = 0; i < plc.length; i++) {
            var item = plc[i];
            service.setRPDGPLCOutput(item.number, item.level);
        }
    }
    service.latchOutputValuesToHardware();
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);
});





router.post('/siteinfo', function(req, res) {

    var zip = req.body.zip;
    var latt = req.body.latt;
    var long = req.body.long;
    global.currentconfig.sitezip = Number(zip);
    global.currentconfig.sitelatt = Number(latt);
    global.currentconfig.sitelong = Number(long);
    var cfg = JSON.stringify(global.currentconfig,null,2);
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});



router.get('/enoceanrx', function(req, res) {

    var que = service.getEnoceanRxQue();
    res.status(200).send(que);
});


router.get('/getscriptnames', function(req, res) {

    var que = service.getScriptNames();
    var element = {};
    element.scripts = que;
    res.status(200).send(que);
});


router.post('/getgpsfromzipcode', function(req, res) {

    var zip = req.body.zip;
    var data = service.getGPSFromZipcode(zip, res);

});



router.post('/enablehotspot', function(req, res) {

    var enable = req.body.enable;
    service.enableHotspot(enable);

    res.status(200).send("OK");
});




// ************************************** 6/9/17 new single crud iface for all fixture / inputput items
// including create / edit delete,


router.post('/editconfig', function(req, res) {

    // sub items:
    // action -- create/edit/delete
    // index ==  item index for edit/delete.,  not for create.
    // object type: fixture/ contact input / levelinput
    // object

    if(req.body != undefined && req.body.action != undefined && req.body.objecttype != undefined) {
        switch (req.body.objecttype) {
            case "fixture":
                if (req.body.action == "create" && req.body.object != undefined) {
                    addFixtureToConfig(req.body.object);

                }
                else if (req.body.action == "edit" && req.body.object != undefined && req.body.index != undefined)
                {
                    var edititem = global.currentconfig.fixtures[req.body.index];
                    if(edititem.assignedname != req.body.object.assignedname)  // if name is diff, rename groups/scenese.
                    {
                        global.currentconfig.renameFixtureInGroupsScenes(edititem.assignedname, req.body.object.assignedname);
                    }
                    global.currentconfig.fixtures.splice(req.body.index,1); //remove it
                    // now save new one.
                    addFixtureToConfig(req.body.object);
                }
                else if (req.body.action == "delete" && req.body.index != undefined)
                {
                    var delfix = global.currentconfig.fixtures[req.body.index];
                    global.currentconfig.fixtures.splice(req.body.index,1); //remove it
                    // delete from groups
                    for(var i = 0; i < global.currentconfig.groups.length; i++)
                    {
                        var group = global.currentconfig.groups[i];
                        for(var k = 0; k < group.fixtures.length; k++) {
                            var fixname = group.fixtures[k];
                            if (fixname == delfix.assignedname) {
                                group.fixtures.splice(k, 1);
                                break;
                            }
                        }
                    }
                    // delete from scenes
                    for(var i = 0; i < global.currentconfig.scenes.length; i++)
                    {
                        var scene = global.currentconfig.scenes[i];
                        for(var k = 0; k < scene.fixtures.length; k++) {

                            var fixname = scene.fixtures[k].name;
                            if (fixname == delfix.assignedname) {

                                scene.fixtures.splice(k, 1);
                                break;
                            }
                        }
                    }

                }
                service.updatePWMPolarity();
                break;
            case "levelinput":
                if (req.body.action == "create" && req.body.object != undefined) {
                    addLevelInputToConfig(req.body.object);
                }
                else if (req.body.action == "edit" && req.body.object != undefined && req.body.index != undefined)
                {
                    var edititem = global.currentconfig.levelinputs[req.body.index];
                    global.currentconfig.levelinputs.splice(req.body.index,1); //remove it
                    // now save new one.
                    addLevelInputToConfig(req.body.object);
                }
                else if (req.body.action == "delete" && req.body.index != undefined)
                {
                    global.currentconfig.levelinputs.splice(req.body.index,1); //remove it
                }

                break;
            case "contactinput":
                if (req.body.action == "create" && req.body.object != undefined) {
                    addContactInputToConfig(req.body.object);
                }
                else if (req.body.action == "edit" && req.body.object != undefined && req.body.index != undefined)
                {
                    global.currentconfig.contactinputs.splice(req.body.index,1); //remove it
                    addContactInputToConfig(req.body.object);
                }
                else if (req.body.action == "delete" && req.body.index != undefined)
                {
                    global.currentconfig.contactinputs.splice(req.body.index,1); //remove it
                }

                break;

            default:
                break;

        }   // end switch,

    }

    var cfg = JSON.stringify(global.currentconfig,null,2);
    // for now cache it to disk .
    data_utils.writeConfigToFile();
    res.status(200).send(cfg);
});



function addFixtureToConfig(fixobjjson)
{


    var logobj = {};
    var now = moment();
    logobj.date = now.toISOString();
    var fix = undefined;
    switch (fixobjjson.type) {  // fixture type...
        case "on_off":
            fix = new OnOffFixture();
            fix.fromJson(fixobjjson);
            global.currentconfig.fixtures.push(fix);
            logobj.level = "0";
            break;
        case "dim":
            fix = new DimFixture();
            fix.fromJson(fixobjjson);
            global.currentconfig.fixtures.push(fix);
            logobj.level = "0";
            break;
        case "cct":
            var fix = new CCTFixture();
            fix.fromJson(fixobjjson);
            global.currentconfig.fixtures.push(fix);
            logobj.brightness = 0;
            logobj.colortemp = 3500;
            break;
        case "rgbw":
            var fix = new RGBWFixture();
            fix.fromJson(fixobjjson);
            global.currentconfig.fixtures.push(fix);
            logobj.red = 0;
            logobj.green = 0;
            logobj.blue = 0;
            logobj.white = 0;
            break;
        default:
            break;
    }

    data_utils.appendOutputObjectLogFile(fixobjjson.assignedname, logobj);
    if (fix != undefined) {
        service.setupHWInterface(fix.assignedname);
    }
}


function addLevelInputToConfig(levinputobjjson)
{
    // 5/24/17  add log object when adding fixture..
    var logobj = {};
    logobj.date = new moment().toISOString();
    logobj.value = 0;
    data_utils.appendInputObjectLogFile(levinputobjjson.assignedname, logobj);
    var li = new LevelInput();
    li.fromJson(levinputobjjson);
    global.currentconfig.levelinputs.push(li);
    service.updateRPDGInputDrive();
}



function addContactInputToConfig(contactinputobjjson)
{
    var logobj = {};
    logobj.date = new moment().toISOString();
    logobj.value = 0;
    data_utils.appendInputObjectLogFile(contactinputobjjson.assignedname, logobj);
    var ci = new ContactInput();
    ci.fromJson(contactinputobjjson);
    global.currentconfig.contactinputs.push(ci);


}
module.exports = router;
