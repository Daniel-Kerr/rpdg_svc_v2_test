var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
var moment = require('moment');
var app = express();
var os = require( 'os' )

var service = require('../controllers/service.js');

router.get('/', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/status2.html'));
});

router.get('/getstatus', function(req, res) {
    var package = service.getStatus2();
    var dataset = JSON.stringify(package, null, 2);
    res.send(dataset);

});

module.exports = router;
