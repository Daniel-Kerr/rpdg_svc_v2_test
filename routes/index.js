var express = require('express');
var router = express.Router();
var path = require('path');
var pad = require('pad');
var app = express();
var TAG = pad(path.basename(__filename),15);




router.get('/', function(req, res, next) {
    res.redirect('/status');
});

router.get('/enoceanconfig', function(req, res) {
    res.sendFile(path.join( app.get('views') +'/enocean_config.html'));
});

var params = {};
params.platformid = 0;
module.exports = router;
