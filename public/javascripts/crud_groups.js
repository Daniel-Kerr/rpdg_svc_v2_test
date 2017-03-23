/**
 * Created by Nick on 1/22/2017.
 */

var REST_SET_GROUP_TO_LEVEL = "/groups/setgrouptolevel";
var REST_SET_GROUP_TO_COLORTEMP = "/groups/setgrouptocolortemp";

function setGroupToLevel(element, callback)
{
    var dataset = JSON.stringify(element);
    $.ajax({
        url: REST_SET_GROUP_TO_LEVEL,
        type: 'post',
        data: dataset,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            callback(result);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            callback("error");
        }
    });
}


function setGroupToColorTemp(element, callback)
{
    var dataset = JSON.stringify(element);
    $.ajax({
        url: REST_SET_GROUP_TO_COLORTEMP,
        type: 'post',
        data: dataset,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            callback(result);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            callback("error");
        }
    });
}





