/**
 * Created by Nick on 1/22/2017.
 */

var REST_GET_CONFIG = "/config/getconfig";

var REST_SAVE_FIXTURE = "/config/savefixture";
var REST_DELETE_FIXTURE = "/config/deletefixture";

var REST_SAVE_LEVELINPUT = "/config/savelevelinput";
var REST_DELETE_LEVELINPUT = "/config/deletelevelinput";

var REST_SAVE_CONTACTINPUT = "/config/savecontactinput";
var REST_DELETE_CONTACTINPUT = "/config/deletecontactinput";


var REST_SAVE_GROUP = "/config/savegroup";
var REST_DELETE_GROUP = "/config/deletegroup";

var REST_ADD_FIXTURE_TO_GROUP = "/config/addfixturetogroup";
var REST_DELETE_FIXTURE_FROM_GROUP = "/config/deletefixturefromgroup";

var REST_GET_PARAM_OPTIONS = "/config/getparamoptions";

var REST_GET_INTERFACE_OUTPUTS = "/config/getinterfaceoutputs";

var REST_GET_SCENE_NAME_LIST = "/override_scene/getscenenamelist";


var REST_SAVE_SCENE = "/config/savescene";
var REST_DELETE_SCENE = "/config/deletescene";

var REST_SAVE_SCENELIST = "/config/savescenelist";
var REST_DELETE_SCENELIST = "/config/deletescenelist";


var REST_ADD_FIXTURE_TO_SCENE = "/config/addfixturetoscene";
var REST_DELETE_FIXTURE_FROM_SCENE = "/config/deletefixturefromscene";

var REST_SAVE_FIXTURE_SETTINGS_TO_SCENE = "/config/savefixturescenesettings"


var REST_ENOCEAN_TEACH = "/config/enoceanteach";
var REST_ENOCEAN_LEARN = "/config/enoceanlearn";

var REST_SAVE_ENOCEAN = "/config/saveenocean";
var REST_DELETE_ENOCEAN = "/config/deleteenocean";


var REST_SET_OUTPUTS = "/config/setoutputs";

var REST_SAVE_SITEINFO = "/config/siteinfo";

var REST_GET_ENOCEAN_RX = "/config/enoceanrx";

var REST_GET_VERSION = "/version";
// config get / set,
function getConfig(callback)
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

function getVersion(callback)
{
    function onDataReceived(series) {
        if(series != null)
            callback(series);
    }
    $.ajax({
        url: REST_GET_VERSION,
        type: "GET",
        dataType: "json",
        success: onDataReceived,
    });
}
/***
 *
 * @param
 * @param callback
 */
function saveConfigObject(objtype, obj, callback) {

    var dataset = JSON.stringify(obj);
    var target = "";
    switch(objtype)
    {
        case "fixture":
            target = REST_SAVE_FIXTURE;
            break;
        case "levelinput":
            target = REST_SAVE_LEVELINPUT;
            break;
        case "contactinput":
            target = REST_SAVE_CONTACTINPUT;
            break;
        case "group":
            target = REST_SAVE_GROUP;
            break;
        case "scene":
            target = REST_SAVE_SCENE;
            break;
        case "enocean":
            target = REST_SAVE_ENOCEAN;
            break;
        case "scenelist":
            target = REST_SAVE_SCENELIST;
            break;
        case "siteinfo":
            target = REST_SAVE_SITEINFO;
            break;
        default:
            return;
    }

    $.ajax({
        url: target,
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


function deleteConfigObject(objtype,obj, callback) {

    var dataset = JSON.stringify(obj);
    var target = "";
    switch(objtype)
    {
        case "fixture":
            target = REST_DELETE_FIXTURE;
            break;
        case "levelinput":
            target = REST_DELETE_LEVELINPUT;
            break;
        case "contactinput":
            target = REST_DELETE_CONTACTINPUT;
            break;
        case "group":
            target = REST_DELETE_GROUP;
            break;
        case "scene":
            target = REST_DELETE_SCENE;
            break;
        case "enocean":
            target = REST_DELETE_ENOCEAN;
            break;
        case "scenelist":
            target = REST_DELETE_SCENELIST;
            break;
        default:
            return;
    }

    $.ajax({
        url: target,
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



function addFixtureToGroup(obj, callback) {

    var dataset = JSON.stringify(obj);
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


function deleteFixtureFromGroup(obj, callback) {

    var dataset = JSON.stringify(obj);
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


function getInterfaceOutputs(callback)
{
    function onDataReceived(series) {
        if(series != null)
            callback(series);
    }
    $.ajax({
        url: REST_GET_INTERFACE_OUTPUTS,
        type: "GET",
        dataType: "json",
        success: onDataReceived,
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





function addFixtureToScene(obj, callback) {

    var dataset = JSON.stringify(obj);
    $.ajax({
        url: REST_ADD_FIXTURE_TO_SCENE,
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


function deleteFixtureFromScene(obj, callback) {

    var dataset = JSON.stringify(obj);
    $.ajax({
        url: REST_DELETE_FIXTURE_FROM_SCENE,
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



function saveFixtureSettingsToScene(obj, callback) {

    var dataset = JSON.stringify(obj);
    $.ajax({
        url: REST_SAVE_FIXTURE_SETTINGS_TO_SCENE,
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





function teachenocean(obj, callback) {

    var dataset = JSON.stringify(obj);
    $.ajax({
        url: REST_ENOCEAN_TEACH,
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




function learnenocean(callback) {

   // var dataset = JSON.stringify(obj);
    $.ajax({
        url: REST_ENOCEAN_LEARN,
        type: 'post',
      //  data: dataset,
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




function setRPDGOutputs(obj, callback) {

    var dataset = JSON.stringify(obj);
    $.ajax({
        url: REST_SET_OUTPUTS,
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





function getEnoceanRx(callback)
{
    function onDataReceived(series) {
        if(series != null)
            callback(series);
    }
    $.ajax({
        url: REST_GET_ENOCEAN_RX,
        type: "GET",
        dataType: "json",
        success: onDataReceived,
    });
}