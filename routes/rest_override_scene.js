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


router.post('/setfixturelevel', function(req, res) {

    var code = 400;
    var requestobj = req.body;
    var fix = global.currentconfig.getFixtureByName(requestobj.name);
    if(fix != undefined) {
        service.setFixtureLevels(requestobj, true);
        code = 200;
    }
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(code).send(cfg);

});

router.post('/setmultiplefixturelevels', function(req, res) {

    service.setMultipleFixtureLevels(req.body);
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(200).send(cfg);
});

router.post('/invokescene', function(req, res) {

    var name = req.body.name;
    var requesttype = "wallstation";

    if(req.body.requesttype != undefined)
        requesttype = req.body.requesttype;


    var code = 400;
    if(name != undefined)
    {
        // bug 49,
        if(global.currentconfig.getSceneByName(name) != undefined)
        {
            service.invokeScene(name, requesttype);
            code = 200;
        }
        else if(name == "ALL_ON" || name == "ALL_50" || name == "ALL_10" || name == "ALL_OFF")
        {
            service.invokeScene(name, requesttype);
            code = 200;
        }
    }
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(code).send(cfg);
});


router.post('/runscript', function(req, res) {

    var name = req.body.script;
    var code = 400;
    if(name != undefined)
    {
        service.runScript(name);
        code = 200;
    }

    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(code).send(cfg);
});

module.exports = router;
