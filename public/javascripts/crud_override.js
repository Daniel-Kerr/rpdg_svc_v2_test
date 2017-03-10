/**
 * Created by Nick on 1/22/2017.
 */

/*
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
*/
var REST_SET_FIXTURE_LEVEL = "/override_scene/setfixturelevel";
/*
var REST_ADD_SCHEDULE_EVENT = "/schedule/addevent";
var REST_DELETE_SCHEDULE_EVENT = "/schedule/delevent";

var REST_ADD_FIXTURE_TO_GROUP = "/groups/addfixturetogroup";
var REST_DELETE_FIXTURE_FROM_GROUP = "/groups/deletefixturefromgroup";

var REST_CREATE_GROUP = "/groups/creategroup";
var REST_DELETE_GROUP = "/groups/deletegroup";
var REST_TEACH_DEVICE = "/teachdevice";
var REST_START_LEARNING = "/startlearning";
*/
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




