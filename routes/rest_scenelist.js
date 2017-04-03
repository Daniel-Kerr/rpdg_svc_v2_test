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
    res.sendFile(path.join( app.get('views') +'/scene_list.html'));

});






router.post('/incrementscenelist', function(req, res) {

    var name = req.body.name;
    var code = 400;
    if(name != undefined)
    {
        // bug 49,
        if(global.currentconfig.getSceneListByName(name) != undefined)
        {
            service.incrementSceneList(name);
            code = 200;
        }
    }
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(code).send(cfg);
});


router.post('/decrementscenelist', function(req, res) {

    var name = req.body.name;
    var code = 400;
    if(name != undefined)
    {
        // bug 49,
        if(global.currentconfig.getSceneListByName(name) != undefined)
        {
            service.decrementSceneList(name);
            code = 200;
        }
    }
    var cfg = JSON.stringify(global.currentconfig,null,2);
    res.status(code).send(cfg);
});

module.exports = router;
