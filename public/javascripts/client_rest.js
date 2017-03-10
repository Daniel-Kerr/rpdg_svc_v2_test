/**
 * Created by Nick on 1/22/2017.
 */

var REST_GET_CONFIG = "/config/getconfig";
var REST_SET_CONFIG = "/config/setconfig";
var REST_GET_HOST_IP = "/gethostip";
var REST_GET_PARAM_OPTIONS = "/getparamoptions";
var REST_GET_SCENE_NAME_LIST = "/override_scene/getscenenamelist";
var REST_DELETE_SCENE = "/override_scene/deletescene";
var REST_SAVE_SCENE = "/override_scene/savescene";
var REST_INVOKE_SCENE = "/override_scene/invokescene";
var REST_GET_SCENE_DETAILS = "/override_scene/getscenedata?name=";
var REST_SET_PLC = "/setplc";
var REST_GET_STATUS =  "/status/getstatus";

var REST_SET_FIXTURE_LEVEL = "/setfixturelevel";

var REST_ADD_SCHEDULE_EVENT = "/schedule/addevent";
var REST_DELETE_SCHEDULE_EVENT = "/schedule/delevent";

var REST_ADD_FIXTURE_TO_GROUP = "/groups/addfixturetogroup";
var REST_DELETE_FIXTURE_FROM_GROUP = "/groups/deletefixturefromgroup";

var REST_CREATE_GROUP = "/groups/creategroup";
var REST_DELETE_GROUP = "/groups/deletegroup";
var REST_TEACH_DEVICE = "/teachdevice";
var REST_START_LEARNING = "/startlearning";

// config get / set,
function getConfigFromHost2(callback)
{
    function onDataReceived(series) {
        if(series != null)
            callback(series);
    }
    $.ajax({
        url: REST_GET_CONFIG,
        type: "GET",
        dataType: "json",
        success: onDataReceived,
    });
}

/***
 *
 * @param configobj
 * @param callback
 */
function saveConfigSettings2(configobj, callback) {

    // todo: add validation of object here.
    // sends back OK,  or error ...
    var dataset = JSON.stringify(configobj);
    $.ajax({
        url: REST_SET_CONFIG,
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

function getHostIPAddress(callback)
{
    function onDataReceived(result) {
        if(result != null)
        {
            callback(result);
        }
    }
    $.ajax({
        url: REST_GET_HOST_IP,
        type: "GET",
        dataType: "json",
        success: onDataReceived
    });
}


function getFixtureParameterOptions(callback)
{
    function onDataReceived(result) {
        if(result != null)
        {
            callback(result);
        }
    }
    $.ajax({
        url: REST_GET_PARAM_OPTIONS,
        type: "GET",
        dataType: "json",
        success: onDataReceived
    });
}


function getSceneNameList(callback)
{
    function onDataReceived(result) {
        if(result != null)
        {
            callback(result);
        }
    }
    $.ajax({
        url: REST_GET_SCENE_NAME_LIST,
        type: "GET",
        dataType: "json",
        success: onDataReceived
    });
}


function deleteSceneByName(scenename, callback) {

    var scene = {};
    scene.name = scenename;
    var dataset = JSON.stringify(scene);
    $.ajax({
        url: REST_DELETE_SCENE,
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


function saveScene(sceneobj, callback)
{
    var dataset = JSON.stringify(sceneobj);
    $.ajax({
        url: REST_SAVE_SCENE,
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


function invokeScene(scene, callback)
{
    var dataset = JSON.stringify(scene);
    $.ajax({
        url: REST_INVOKE_SCENE,
        type: 'post',
        data: dataset,
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function (result) {
            if (result != null) {
                callback(result);
            }
            else
                callback("error");
        },
        error: function (xhr, ajaxOptions, thrownError) {
            callback("error");
        }
    });
}

function getSceneDetails(scenename, callback)
{
    var dataurl = REST_GET_SCENE_DETAILS + scenename;
    $.ajax({
        url: dataurl,
        type: "GET",
        dataType: "json",
        success: function (result) {
            if (result != null) {
                callback(result);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            callback("error");
        }
    });
}


function setPLC2(plcobject, callback) {

    var dataset = JSON.stringify(plcobject);
    $.ajax({
        url: REST_SET_PLC,
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


function getStatus(callback) {

    $.ajax({
        url: REST_GET_STATUS,
        type: "GET",
        dataType: "json",
        success: function (result) {
            callback(result);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            callback("error");
        }
    });
}



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


function addFixtureToGroup(groupname, uid, callback) {

    var body = {};
    body.group =groupname;
    body.uid = uid;
    var dataset = JSON.stringify(body);
    $.ajax({
        url: REST_ADD_FIXTURE_TO_GROUP,
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


function deleteFixtureFromGroup(groupname, uid, callback) {

    var body = {};
    body.group = groupname;
    body.uid = uid;
    var dataset = JSON.stringify(body);
    $.ajax({
        url: REST_DELETE_FIXTURE_FROM_GROUP,
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

function createGroup(groupname, type, callback) {

    var body = {};
    body.name = groupname;
    body.type = type;
    body.fixtures = [];

    var dataset = JSON.stringify(body);
    $.ajax({
        url: REST_CREATE_GROUP,
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

function deleteGroup(groupname, callback) {

    var body = {};
    body.name = groupname;

    var dataset = JSON.stringify(body);
    $.ajax({
        url: REST_DELETE_GROUP,
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


/***
 * For Enocean ONLY right now.
 * @param groupname
 * @param callback
 */
function teachFixture(id, callback) {

    var body = {};
    body.id = id;

    var dataset = JSON.stringify(body);
    $.ajax({
        url: REST_TEACH_DEVICE,
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


/***
 * For Enocean ONLY right now.
 * @param groupname
 * @param callback
 */
function startLearning(id, callback) {

    var body = {};
    body.id = id;

    var dataset = JSON.stringify(body);
    $.ajax({
        url: REST_START_LEARNING,
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

