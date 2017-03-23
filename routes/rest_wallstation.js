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
router.get('/', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/wallstation_joe.html'));

});


module.exports = router;
