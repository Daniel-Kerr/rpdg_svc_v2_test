var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
var moment = require('moment');
var app = express();
var os = require( 'os' )

var data_file = '../datastore/data.json';
router.get('/', function(req, res, next) {
    res.sendFile(path.join( app.get('views') +'/history.html'));
});

router.post('/getdata', function(req, res, next) {

    var name = req.body.name;
    var type = req.body.type;
    var code = 400;
    var resultdata = "bad request";
    if(name != undefined)
    {
        var target = '../datastore/object_logs/' + type + '/'+ name + '.json';
        if (fs.existsSync(target)) {
            resultdata = path.resolve(target);
            code = 200;
        }
    }
    res.sendFile(resultdata);
});


module.exports = router;
