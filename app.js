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
global.loghw.plcoutputlevels=true;
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



module.exports = app;
