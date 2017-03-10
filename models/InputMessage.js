/**
 * Created by Nick on 3/6/2017.
 */
var moment = require('moment');

var InputMessage = function(sendername,type,level )
{
    this.sendername = sendername;
    this.type = type
    this.level = level;

};

module.exports = InputMessage;
