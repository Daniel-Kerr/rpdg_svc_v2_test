var express = require('express');
var router = express.Router();
var path = require('path');
var pad = require('pad');
var app = express();
var TAG = pad(path.basename(__filename),15);
var service = require('../controllers/service');




router.get('/', function(req, res, next) {
    res.redirect('/status');
});

router.get('/enoceanconfig', function(req, res) {
    res.sendFile(path.join( app.get('views') +'/enocean_config.html'));
});



router.get('/testschedule', function(req, res) {
    res.sendFile(path.join( app.get('views') +'/scheduler2.html'));
});



router.get('/testme', function(req, res) {
    res.sendFile(path.join( app.get('views') +'/test_crud.html'));
});


router.get('/version', function(req, res) {

   // var element = {};

    var ele = service.getVersionObject();

   // element.controller = "1.00";
   // element.firmware = "tbd";
    res.status(200).send(JSON.stringify(ele));
});


var params = {};
params.platformid = 0;
module.exports = router;
