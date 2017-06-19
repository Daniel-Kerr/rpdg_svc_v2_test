/**
 * Created by Nick on 3/17/2017.
 */

var REST_ADD_SCHEDULE_EVENT = "/schedule/addevent";
var REST_DELETE_SCHEDULE_EVENT = "/schedule/delevent";

var REST_SET_SCHED_MODE = "/schedule/setschedulemode";

//var REST_GET_PERSIST_STORE = "/schedule/getpersistantstore";


function setScheduleMode(obj, callback) {

    var dataset = JSON.stringify(obj);
    $.ajax({
        url: REST_SET_SCHED_MODE,
        type: 'post',
        data: dataset,
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function (result) {
            callback(result);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            callback("error");
        }
    });
}


/*
function getPersistStore(callback) {

  //  var dataset = JSON.stringify(obj);
    $.ajax({
        url: REST_GET_PERSIST_STORE,
        type: 'get',
       // data: dataset,
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function (result) {
            callback(result);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            callback("error");
        }
    });
}
*/



/*
function addScheduleEvent(schedobj, newevent, callback)
{
    var dataset = JSON.stringify(schedobj);
    $.ajax({
        url: REST_ADD_SCHEDULE_EVENT,
        type: 'post',
        data: dataset,
        contentType: "application/json; charset=utf-8",
        success: function (result) {
            callback(newevent,result);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            callback(newevent,"error");
        }
    });
}


function deleteScheduleEvent(schedobj, callback)
{
    var dataset = JSON.stringify(schedobj);
    $.ajax({
        url: REST_DELETE_SCHEDULE_EVENT,
        type: 'post',
        data: dataset,
        contentType: "application/json; charset=utf-8",
        success: function (result) {
            callback(result);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            callback("error");
        }
    });
}
*/