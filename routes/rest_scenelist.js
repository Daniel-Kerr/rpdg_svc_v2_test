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




module.exports = router;
