var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');



// 2/21/17, logger
const opts = {
    logDirectory:'runtime_log',
    fileNamePattern:'roll-<DATE>.log',
    dateFormat:'YYYY.MM.DD',
    timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
};

var manager = require('simple-node-logger').createLogManager( );
manager.createRollingFileAppender(opts);
const log = manager.createLogger('RVLT');
global.applogger = log;
// end logger

var TAG = path.basename(__filename);
log.info(TAG, " log started", "");


//2/21/17  application debug globals.
global.loghw = {};
global.loghw.pwmlevels = true;  //ouput levels in pct.
global.loghw.pwmcurrent=false;  //pwm current/power levels.
global.loghw.zero2teninput=false;
global.loghw.wetdrycontacts=false;
global.loghw.plcoutputlevels=false;
//global.loghw.zero2teninputchanged=true;
//global.loghw.wetdrycontactchanged=true;

global.loghw.colortemp=true;
global.loghw.lightfilter=false;
var index = require('./routes/index');
//var users = require('./routes/users');


var config = require('./routes/rest_config2');
var override_scene = require('./routes/rest_override_scene');
var groupshandler = require('./routes/rest_groups');
var status = require('./routes/rest_status');
var tester = require('./routes/rest_tester');
var schedule = require('./routes/rest_schedule');
var scenelist = require('./routes/rest_scenelist');
var wallstation = require('./routes/rest_wallstation');
var history = require('./routes/rest_history');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ngp added to expose models
app.use(express.static(path.join(__dirname, 'models')));

app.use('/', index);
//app.use('/users', users);

app.use('/config', config);
app.use('/override_scene', override_scene);
app.use('/groups', groupshandler);
app.use('/status', status);
app.use('/tester', tester);
app.use('/schedule', schedule);
app.use('/scenelist', scenelist);
app.use('/wallstation', wallstation);
app.use('/history', history);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


var service = require('./controllers/service');
service.initService();
service.startPolling();

// GNP add ons


// 6/9/17  handle shutdowns .. cleanly.
process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {

    console.log( "app exit handler");
    //if(options.cleanup)
    service.cleanupServer();

    if (options.cleanup)
        console.log('** clean ***');

    if (err) console.log(err.stack);

    if (options.exit)
        process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
//process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

// this is for build test

// for build test 2

// and another 

module.exports = app;
