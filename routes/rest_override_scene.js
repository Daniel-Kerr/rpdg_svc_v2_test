var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
var moment = require('moment');
var app = express();
var os = require( 'os' )

var path = require('path');
var pad = require('pad');
var TAG = pad(path.basename(__filename),15);
var file_scenes = 'datastore/scenes.json';

var data_utils = require('../utils/data_utils.js');
var service = require('../controllers/service.js');
var fse = require('fs-extra');
var scenelist = data_utils.getSceneListFromScenesFile();
if(scenelist == undefined)
{
    var default_scenes = 'datastore/default/scenes_default.json';
    fse.copySync(default_scenes, file_scenes);
}




router.get('/', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/override_control2.html'));

});


// moved from root level.
router.post('/setfixturelevel', function(req, res) {

    global.applogger.info(TAG, "rest -- set fixture level" ,"");
    try {
        var status = service.setFixtureLevels(req.body, true);
        res.send(status);
    }
    catch (err)
    {
        res.send(err);
    }
});




//   Create Scene Support
router.post('/deletescene', function(req, res) {

    var name = req.body.name;

    var scenelist = data_utils.getSceneListFromScenesFile();
    if(scenelist != undefined)
    {
        for(var i = 0; i < scenelist.length; i++)
        {
            var sceneobj = scenelist[i];
            if(sceneobj.name == name)
            {
                scenelist.splice(i,1);
                data_utils.writeSceneFileWithList(scenelist);
                break;
            }
        }
    }

    var names = data_utils.getSceneNamesFromObjList(scenelist);

    rpdg_driver.updateScenelist(scenelist);

    JSON.stringify(names);
    res.status(200).send(names);
});



router.post('/savescene', function(req, res) {

    var name = req.body.name;
    var desc = req.body.desc;
    console.log("got scene: "+ name + " | " + desc );

    var target = path.resolve(file_scenes);
    var listupdated = false;

    var scenelist = data_utils.getSceneListFromScenesFile();
    if(scenelist != undefined)
    {
        for (scidx = 0; scidx < scenelist.length; scidx++) {
            var sceneobj = scenelist[scidx];
            if(sceneobj.name == name)
            {
                // replace the entire obj.
                scenelist[scidx] = req.body;
                listupdated = true;
                break; // done,
            }
        }

        if(!listupdated)  // append list,
        {
            scenelist.push(req.body);
            listupdated = true;
        }

        if(listupdated)
            data_utils.writeSceneFileWithList(scenelist);
    }
    else
    {
        var scenelist = [];
        scenelist.push(req.body);
        data_utils.writeSceneFileWithList(scenelist);
    }

    // return updated list
    var names = data_utils.getSceneNamesFromObjList(scenelist);

    rpdg_driver.updateScenelist(scenelist);
    JSON.stringify(names);
    res.status(200).send(names);

});


router.post('/invokescene', function(req, res) {

    var name = req.body.name;
    var requesttype = req.body.requesttype;
    var retval = "BadData";
    var status = {};
    if(name != undefined && requesttype != undefined)
    {
        var sceneobj = data_utils.getSceneObjDataByName(name);
        if(sceneobj != undefined)
        {
            status = rpdg_driver.invokeScene(sceneobj, requesttype);
        }
    }
    res.send(status);
});

router.get('/getscenenamelist', function(req, res) {

    var names = data_utils.getSceneNameListFromFile();
    JSON.stringify(names);
    res.status(200).send(names);

});


router.get('/getscenedata', function(req, res) {
    var scenename = req.query.name;
    var retscene = data_utils.getSceneObjDataByName(scenename);
    JSON.stringify(retscene);
    res.send(retscene);
});

/*
function getSceneNamesFromObjList(list)
{
    var names = [];
    names.push("----");
    if(list != undefined)
    {
        for(var i = 0; i < list.length; i++)
        {
            var scenename = list[i].name;
            names.push(scenename);
        }
    }

    return names;
}

function getSceneNameListFromFile()
{
    var names = [];
    names.push("----");
    var scenelist = data_utils.getSceneListFromScenesFile();
    if(scenelist != undefined)
    {
        for(var i = 0; i < scenelist.length; i++)
        {
            var scenename = scenelist[i].name;
            names.push(scenename);
        }
    }

    return names;
}


function writeSceneFileWithList(scenelist)
{
    if(global.test_mode)
    {
        global.test_scenelist = scenelist;
    }
    else {
        var target = path.resolve(file_scenes);
        var output = JSON.stringify(scenelist, null, 4);
        fs.writeFile(target, output, function (err) {
            if (err) {
                console.log(err);
            }
            else
                console.log("The file was saved!");
        });
    }
}
*/
/*
function getSceneObjDataByName(scenename)
{
    var slist = getSceneListFromScenesFile();
    for(var i = 0; i < slist.length; i++)
    {
        var chkname = slist[i].name;
        if(chkname == scenename)
        {
            return slist[i];
        }
    }
    return '';
}


function getSceneListFromScenesFile()
{
    if(global.test_mode)
    {
        return global.test_scenelist;
    }
    else
    {

        var target = path.resolve(file_scenes);
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
        catch (err) {
        }
    }
    return;
}
*/

module.exports = router;
