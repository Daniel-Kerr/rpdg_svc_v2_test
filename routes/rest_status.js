var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
var moment = require('moment');
var app = express();
var os = require( 'os' )

//var service = require('../controllers/service.js');

router.get('/', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/status.html'));
});


module.exports = router;
