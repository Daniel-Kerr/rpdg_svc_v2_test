/**
 * Created by Nick on 4/14/2017.
 */

var REST_GET_DATA = "history/getdata";
var output_plot = undefined;
var input_plot = undefined;
var contactinput_plot = undefined;

var output_dataset = [];
var input_dataset = [];
var contactinput_dataset = [];

var totaloutputs = 2;
var outputcount = 0;  // number of outputs

var inputcount = 0;  // number of outputs
var totalinputs = 2;


var contactinputcount = 0;  // number of outputs
var totalcontactinputs = 2;

var panstartdate = new Date(2017,1,1);
var end_date = new Date();

var default_start_date = new Date();

var line_colors = ['#33AAAA','#3322FF','#3377FF','#33AA11','#33AA99'];
function init()
{
    getConfig(function (cfg) {

        if(cfg != undefined)
        {
            currentwindowsizehours = 6; // 5/24/17

            default_start_date.setHours(default_start_date.getHours()-6);

            outputcount = 0;
            totaloutputs = cfg.fixtures.length;
            var fixtures = cfg.fixtures;
            var levelinputs = cfg.levelinputs;
            var contactinputs = cfg.contactinputs;
            totalinputs = cfg.levelinputs.length;
            totalcontactinputs =  cfg.contactinputs.length;


            for (var i = 0; i < fixtures.length; i++) {
                // FAUX data .
                var element = {};
                element.name = fixtures[i].assignedname;
                element.type = "output";
                getDataForObject(element, processOutputDataFetch);
            }

            for (var i = 0; i < levelinputs.length; i++) {
                // FAUX data .
                var element = {};
                element.name = levelinputs[i].assignedname;
                element.type = "input";
                getDataForObject(element, processInputDataFetch);
            }

            for (var i = 0; i < contactinputs.length; i++) {
                // FAUX data .
                var element = {};
                element.name = contactinputs[i].assignedname;
                element.type = "input";
                getDataForObject(element, processContactInputDataFetch);
            }

        }
    });
}

function getDataForObject(obj, callback) {

    var dataset = JSON.stringify(obj);
    $.ajax({
        url: REST_GET_DATA,
        type: 'post',
        data: dataset,
        dataType: "text",
        contentType: "application/json; charset=utf-8",
        success: function (result) {
            callback(obj.name, result);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            callback("error");
        }
    });
}

function getFixtureByName(name)
{
    for(var i = 0 ; i < cachedconfig.fixtures.length; i++)
    {
        if(name == cachedconfig.fixtures[i].assignedname)
        {
            return cachedconfig.fixtures[i];
        }
    }
    return undefined;
}


function processOutputDataFetch(name, resultdata) {


    //var fixobj = getFixtureByName(name);
    var dataholder = [];
    var parts = resultdata.split('\n');

    // create obj
    var element = {};
    element.label = name;
    element.color = line_colors[outputcount];
    element.idx = outputcount;

    outputcount++;

    for(var i = 0; i < parts.length; i++)
    {
        try {
            var point = JSON.parse(parts[i]);

            var yvalue = 0;
            if(point.level != undefined)
                yvalue = point.level;
            else if(point.brightness != undefined)
                yvalue = point.brightness;

            var d = new Date(point.date);

            dataholder.push([d,Number(yvalue)]);
        } catch(err )
        {
        }
    }

    element.data = dataholder;
    output_dataset.push(element);

    if(outputcount >= totaloutputs)
    {
        var holder = $("#output-graph");

        output_plot = $.plot($("#output-graph"),
            output_dataset, // dataDetail,
            detailOptions
        );

        holder.bind("plotpan", function (event, output_plot) {
            var axes = output_plot.getAxes();

            if(input_plot != undefined) {
                input_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                input_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                input_plot.setupGrid();
                input_plot.draw();

            }

            if(contactinput_plot != undefined) {
                contactinput_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                contactinput_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                contactinput_plot.setupGrid();
                contactinput_plot.draw();
            }
        });
    }
}

togglePlot = function(seriesIdx)
{
    var someData = output_plot.getData();
    someData[seriesIdx].lines.show = !someData[seriesIdx].lines.show;
    output_plot.setData(someData);
    output_plot.draw();
}




var detailOptions = {
    series: {
        lines: { show: true, lineWidth: 3 },
        shadowSize: 0
    },
    grid: {
        hoverable: true,
        borderWidth: 1
    },
    yaxis:{
        min: 0,
        max: 100,
        ticksize: 20,
        panRange: false
    },
    xaxis:{
        show: true,
        mode: "time",
        timezone: "browser",
        minTickSize: [1, "hour"],
        timeformat: "%m/%d %H:%M",
        min: default_start_date,
        max: end_date,
        panRange: [panstartdate.getTime(), end_date.getTime()]

    },
    pan: {
        interactive: true
    },
    legend: {
        labelFormatter: function(label, series){
            return '<a href="#" onClick="togglePlot('+series.idx+'); return false;">'+label+'</a>';
        }
    }
};

//*********************************************************************************************************
// ************************************LEVEL INPUT GRAPH **************************
//*********************************************************************************************************

function processInputDataFetch(name, resultdata) {

    if(resultdata == undefined)
        return;


    var dataholder = [];
    var parts = resultdata.split('\n');

    // create obj
    var element = {};
    element.label = name;
    element.color = line_colors[inputcount];
    element.idx = inputcount;

    inputcount++;

    for(var i = 0; i < parts.length; i++)
    {
        try {
            var point = JSON.parse(parts[i]);

            var d = new Date(point.date);

            dataholder.push([d,Number(point.value*10)]);  // for now scale.
        } catch(err )
        {
        }
    }

    element.data = dataholder;
    input_dataset.push(element);

    if(inputcount >= totalinputs)
    {
        var holder = $("#input-graph");


        input_plot = $.plot($("#input-graph"),
            input_dataset,
            inputdetailOptions
        );


        holder.bind("plotpan", function (event, input_plot) {
            var axes = input_plot.getAxes();

            if(output_plot != undefined) {
                output_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                output_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                output_plot.setupGrid();
                output_plot.draw();
            }

            if(contactinput_plot != undefined) {
                contactinput_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                contactinput_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                contactinput_plot.setupGrid();
                contactinput_plot.draw();
            }

        });
    }
}


var inputdetailOptions = {
    series: {
        lines: { show: true, lineWidth: 3 },
        shadowSize: 0
    },
    grid: {
        hoverable: true,
        borderWidth: 1
    },
    yaxis:{
        min: 0,
        max: 100,
        ticksize: 20,
        panRange: false
    },
    xaxis:{
        show: true,
        mode: "time",
        timezone: "browser",
        minTickSize: [1, "hour"],
        timeformat: "%m/%d %H:%M",
        min: default_start_date,
        max: end_date,
        panRange: [panstartdate.getTime(), end_date.getTime()]
    },
    pan: {
        interactive: true
    },
    legend: {
        labelFormatter: function(label, series){
            return '<a href="#" onClick="toggleInputPlot('+series.idx+'); return false;">'+label+'</a>';
        }
    }
};


toggleInputPlot = function(seriesIdx)
{
    var someData = input_plot.getData();
    someData[seriesIdx].lines.show = !someData[seriesIdx].lines.show;
    input_plot.setData(someData);
    input_plot.draw();
}


//*********************************************************************************************************
// ******************************************** Contact Input graph ******
//*********************************************************************************************************


function processContactInputDataFetch(name, resultdata) {

    if(resultdata == undefined)
        return;


    var dataholder = [];
    var parts = resultdata.split('\n');

    // create obj
    var element = {};
    element.label = name;
    element.color = line_colors[contactinputcount];
    element.idx = contactinputcount;

    contactinputcount++;


    var bucketcount = 0;
    var bucketstartdate = undefined;
    var bucketenddate = undefined;
    for(var i = 0; i < parts.length; i++)
    {
        try {
            var point = JSON.parse(parts[i]);
            var d = new Date(point.date);

            // if this dt, is after the bucket end time,  send off current bucket.
            if(bucketenddate != undefined) {
                if (d.getTime() > bucketenddate.getTime()) {
                    if(bucketcount == 0)
                        bucketcount = -1;

                    dataholder.push([d, Number(bucketcount)]);  // for now scale.
                    bucketcount = 0;
                    bucketstartdate = undefined;
                }
            }
            // bundle up into 15 min buckets
            if(point.value > 0)
                  bucketcount++;

            if (bucketstartdate == undefined) {
                bucketstartdate = d;
                bucketenddate = new Date(d);
                bucketenddate.setMinutes(bucketenddate.getMinutes() + 15);
            }

        } catch(err )
        {
        }
    }

    element.data = dataholder;
    contactinput_dataset.push(element);

    if(contactinputcount >= totalcontactinputs)
    {
        var holder = $("#contactinput-graph");





        contactinput_plot = $.plot($("#contactinput-graph"),
            contactinput_dataset,
            contactinputdetailOptions
        );


        holder.bind("plotpan", function (event, contactinput_plot) {
            var axes = contactinput_plot.getAxes();

            if(output_plot != undefined) {
                output_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                output_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                output_plot.setupGrid();
                output_plot.draw();
            }

            if(input_plot != undefined) {
                input_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                input_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                input_plot.setupGrid();
                input_plot.draw();

            }
        });
    }
}


var contactinputdetailOptions = {
    series: {
        bars: {
            show: true,
            align: "center",
            barWidth: 15*60*1000, //24 * 60 * 60 * 600,
            lineWidth:1
        }
        // lines: { show: true, lineWidth: 3 },
        //shadowSize: 0
    },
    grid: {
        hoverable: true,
        borderWidth: 1
    },
    yaxis:{
        min: 0,
        max: 5,
        ticksize: 20,
        panRange: false
    },
    xaxis:{
        show: true,
        mode: "time",
        timezone: "browser",
        minTickSize: [1, "hour"],
        timeformat: "%m/%d %H:%M",
        min: default_start_date,
        max: end_date,
        panRange: [panstartdate.getTime(), end_date.getTime()]
    },
    pan: {
        interactive: true
    },
    legend: {
        labelFormatter: function(label, series){
            return '<a href="#" onClick="toggleContactInputPlot('+series.idx+'); return false;">'+label+'</a>';
        }
    }
};


toggleContactInputPlot = function(seriesIdx)
{
    var someData = contactinput_plot.getData();
    someData[seriesIdx].bars.show = !someData[seriesIdx].bars.show;
    contactinput_plot.setData(someData);
    contactinput_plot.draw();
}

//*********************************************************************************************************
// ****************************************************************** END Contact input *****************************
//*********************************************************************************************************

function setWindowHours(hours)
{
    currentwindowsizehours = hours;
    var min = new Date();
    var max = new Date();
    min.setHours(min.getHours()-hours);

    if(output_plot != undefined) {
        output_plot.getOptions().xaxes[0].min = min.getTime();
        output_plot.getOptions().xaxes[0].max = max.getTime();
        output_plot.setupGrid();
        output_plot.draw();
    }

    if(input_plot != undefined) {
        input_plot.getOptions().xaxes[0].min = min.getTime();
        input_plot.getOptions().xaxes[0].max = max.getTime();
        input_plot.setupGrid();
        input_plot.draw();
    }

    if(contactinput_plot != undefined) {
        contactinput_plot.getOptions().xaxes[0].min = min.getTime();
        contactinput_plot.getOptions().xaxes[0].max = max.getTime();
        contactinput_plot.setupGrid();
        contactinput_plot.draw();
    }

}


var currentwindowsizehours = 0;

function windowZoomIn()
{
    var delta = currentwindowsizehours/4;

    currentwindowsizehours = currentwindowsizehours - delta;

    if(currentwindowsizehours <= 0)
        currentwindowsizehours = 1;

    var windowminutes = currentwindowsizehours*60;

    var axes = output_plot.getAxes();
    var tempmin = axes.xaxis.min;
    var tempmax = axes.xaxis.max;

    var zoompoint = tempmax - ((tempmax-tempmin)/2);

    var middletime = new Date(zoompoint);

    var min = new Date(middletime.getTime());
    var max = new Date(middletime.getTime());

    min.setMinutes(min.getMinutes()-windowminutes/2);
    max.setMinutes(max.getMinutes()+windowminutes/2);

    if(output_plot != undefined) {
        output_plot.getOptions().xaxes[0].min = min.getTime();
        output_plot.getOptions().xaxes[0].max = max.getTime();
        output_plot.setupGrid();
        output_plot.draw();
    }

    if(input_plot != undefined) {
        input_plot.getOptions().xaxes[0].min = min.getTime();
        input_plot.getOptions().xaxes[0].max = max.getTime();
        input_plot.setupGrid();
        input_plot.draw();
    }

    if(contactinput_plot != undefined) {
        contactinput_plot.getOptions().xaxes[0].min = min.getTime();
        contactinput_plot.getOptions().xaxes[0].max = max.getTime();
        contactinput_plot.setupGrid();
        contactinput_plot.draw();
    }
}



function windowZoomOut()
{
    var delta = currentwindowsizehours/4;

    currentwindowsizehours = currentwindowsizehours + delta;
    if(currentwindowsizehours >= 720)
        currentwindowsizehours = 720;

    var windowminutes = currentwindowsizehours*60;

    var axes = output_plot.getAxes();
    var tempmin = axes.xaxis.min;
    var tempmax = axes.xaxis.max;

    var zoompoint = tempmax - ((tempmax-tempmin)/2);

    var middletime = new Date(zoompoint);

    var min = new Date(middletime.getTime());
    var max = new Date(middletime.getTime());

    min.setMinutes(min.getMinutes()-windowminutes/2);
    max.setMinutes(max.getMinutes()+windowminutes/2);

    if(output_plot != undefined) {
        output_plot.getOptions().xaxes[0].min = min.getTime();
        output_plot.getOptions().xaxes[0].max = max.getTime();
        output_plot.setupGrid();
        output_plot.draw();
    }

    if(input_plot != undefined) {
        input_plot.getOptions().xaxes[0].min = min.getTime();
        input_plot.getOptions().xaxes[0].max = max.getTime();
        input_plot.setupGrid();
        input_plot.draw();
    }

    if(contactinput_plot != undefined) {
        contactinput_plot.getOptions().xaxes[0].min = min.getTime();
        contactinput_plot.getOptions().xaxes[0].max = max.getTime();
        contactinput_plot.setupGrid();
        contactinput_plot.draw();
    }
}




function windowMove(direction)
{

    var windowminutes = currentwindowsizehours*60;

    var shiftminutes = windowminutes/4;

    var axes = output_plot.getAxes();
    var tempmin = axes.xaxis.min;
    var tempmax = axes.xaxis.max;

    var zoompoint = tempmax - ((tempmax-tempmin)/2);

    var middletime = new Date(zoompoint);

    var min = new Date(tempmin);
    var max = new Date(tempmax);

    if(direction == "left") {
        min.setMinutes(min.getMinutes() - shiftminutes);
        max.setMinutes(max.getMinutes() - shiftminutes);
    }
    else
    {
        min.setMinutes(min.getMinutes() + shiftminutes);
        max.setMinutes(max.getMinutes() + shiftminutes);
    }

    if(output_plot != undefined) {
        output_plot.getOptions().xaxes[0].min = min.getTime();
        output_plot.getOptions().xaxes[0].max = max.getTime();
        output_plot.setupGrid();
        output_plot.draw();
    }

    if(input_plot != undefined) {
        input_plot.getOptions().xaxes[0].min = min.getTime();
        input_plot.getOptions().xaxes[0].max = max.getTime();
        input_plot.setupGrid();
        input_plot.draw();
    }

    if(contactinput_plot != undefined) {
        contactinput_plot.getOptions().xaxes[0].min = min.getTime();
        contactinput_plot.getOptions().xaxes[0].max = max.getTime();
        contactinput_plot.setupGrid();
        contactinput_plot.draw();
    }
}


