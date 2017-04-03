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

var data_utils = require('../utils/data_utils.js');
var service = require('../controllers/service.js');
var fse = require('fs-extra');


router.get('/', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/override_control.html'));

});



//router.get('/list', function(req, res, next) {
//    res.sendFile(path.join( app.get('views') +'/scene_list.html'));
//
///});


router.post('/setfixturelevel', function(req, res) {

   // global.applogger.info(TAG, "rest -- set fixture level" ,"");
    try {
        service.setFixtureLevels(req.body, true);
        var cfg = JSON.stringify(global.currentconfig,null,2);
        res.status(200).send(cfg);
    }
    catch (err)
    {
        res.send(err);
    }

});


router.post('/setmultiplefixturelevels', function(req, res) {

    service.setMultipleFixtureLevels(req.body);
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);
});

router.post('/invokescene', function(req, res) {

    var name = req.body.name;
    var code = 400;
    if(name != undefined)
    {
         // bug 49,


        if(global.currentconfig.getSceneByName(name) != undefined)
        {
            service.invokeScene(name, "wallstation");
            code = 200;
        }
        else if(name == "ALL_ON" || name == "ALL_50" || name == "ALL_10" || name == "ALL_OFF")
        {
            service.invokeScene(name, "wallstation");
            code = 200;
        }
    }
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(code).send(cfg);
});

/*
router.get('/getscenenamelist', function(req, res) {

    var names = data_utils.getSceneNameListFromFile();
    JSON.stringify(names);
    res.status(200).send(names);

});
*/
/*
router.get('/getscenedata', function(req, res) {
    var scenename = req.query.name;
    var retscene = data_utils.getSceneObjDataByName(scenename);
    JSON.stringify(retscene);
    res.send(retscene);
});
*/

module.exports = router;
