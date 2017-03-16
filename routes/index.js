var express = require('express');
var router = express.Router();
var path = require('path');
var pad = require('pad');
var app = express();
var TAG = pad(path.basename(__filename),15);


/* GET home page. */
router.get('/', function(req, res, next) {
    var bla = global.currentconfig;
    res.render('index', { title: 'Express' });
});

router.get('/enoceanconfig', function(req, res) {
    res.sendFile(path.join( app.get('views') +'/enocean_config.html'));
});


/*
router.get('/setoutput1', function(req, res, next) {   //test func.

    rpdgservice.setOnOffFixture("onoff1",34, false);
    res.status(200).send("OK");
});

router.get('/setoutput2', function(req, res, next) {   //test func.

    rpdgservice.setCCTFixture("cct2",3500, 70, false);
    res.status(200).send("OK");
});


router.get('/setoutput3', function(req, res, next) {   //test func.

    rpdgservice.setOnOffFixture("onoff4433",34, false);
    res.status(200).send("OK");
});



router.get('/setbrightgroup', function(req, res, next) {   //test func.

    rpdgservice.setBrightnessGroup("mytestgroup",75);
    res.status(200).send("OK");
});
*/

var params = {};
params.platformid = 0;


module.exports = router;
