/**
 * Created by Nick on 3/17/2017.
 */
var REST_SET_HW_POLLING_PERIOD = "/tester/sethwpollingperiod";

function setHWPollingPeriod(obj, callback) {

    var dataset = JSON.stringify(obj);
    $.ajax({
        url: REST_SET_HW_POLLING_PERIOD,
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
