/**
 * Created by Nick on 1/22/2017.
 */


var REST_SET_FIXTURE_LEVEL = "/override_scene/setfixturelevel";

var REST_SET_INVOKE_SCENE = "/override_scene/invokescene";



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





