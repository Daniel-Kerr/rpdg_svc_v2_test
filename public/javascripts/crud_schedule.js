/**
 * Created by Nick on 3/17/2017.
 */

var REST_ADD_SCHEDULE_EVENT = "/schedule/addevent";
var REST_DELETE_SCHEDULE_EVENT = "/schedule/delevent";



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
