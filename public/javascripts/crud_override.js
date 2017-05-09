/**
 * Created by Nick on 1/22/2017.
 */


var REST_SET_FIXTURE_LEVEL = "/override_scene/setfixturelevel";

var REST_SET_INVOKE_SCENE = "/override_scene/invokescene";

var REST_INC_SCENE_LIST = "/scenelist/incrementscenelist";
var REST_DEC_SCENE_LIST = "/scenelist/decrementscenelist";

var REST_RUN_SCRIPT = "/override_scene/runscript";

var REST_GET_SCRIPT_IS_RUNNING = "/override_scene/scriptrunning";

function setFixtureLevel2(element, callback)
{
    var dataset = JSON.stringify(element);
    $.ajax({
        url: REST_SET_FIXTURE_LEVEL,
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



function invokescene(element, callback)
{
    var dataset = JSON.stringify(element);
    $.ajax({
        url: REST_SET_INVOKE_SCENE,
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




function incrementscenelist(element, callback)
{
    var dataset = JSON.stringify(element);
    $.ajax({
        url: REST_INC_SCENE_LIST,
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


function decrementscenelist(element, callback)
{
    var dataset = JSON.stringify(element);
    $.ajax({
        url: REST_DEC_SCENE_LIST,
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




function executescript(element, callback)
{
    var dataset = JSON.stringify(element);
    $.ajax({
        url: REST_RUN_SCRIPT,
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




function getScriptRunStatus(callback)
{
    function onDataReceived(series) {
        if(series != null)
            callback(series);
    }
    $.ajax({
        url: REST_GET_SCRIPT_IS_RUNNING,
        type: "GET",
        dataType: "json",
        success: onDataReceived,
    });
}
