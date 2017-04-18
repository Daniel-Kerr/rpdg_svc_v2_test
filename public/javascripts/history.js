/**
 * Created by Nick on 4/14/2017.
 */

var REST_GET_DATA = "history/getdata";
var output_plot = undefined;
var input_plot = undefined;

var output_dataset = [];
var input_dataset = [];

var totaloutputs = 2;
var outputcount = 0;  // number of outputs

var inputcount = 0;  // number of outputs
var totalinputs = 2;


var panstartdate = new Date(2017,1,1);
var end_date = new Date();

var FAUX_DATA = false;

var line_colors = ['#33AAAA','#3322FF','#3377FF','#33AA11','#33AA99'];
function init()
{
    getConfig(function (cfg) {

        if(cfg != undefined)
        {

            if(!FAUX_DATA) {
                outputcount = 0;
                totaloutputs = cfg.fixtures.length;
                var fixtures = cfg.fixtures;
                var levelinputs = cfg.levelinputs;
                totalinputs = cfg.levelinputs.length;


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

            }
            else {

                // FAUX data .

                var element = {};
                element.name = "dim1";
                element.type = "output";
                getDataForObject(element, processOutputDataFetch);


                var element = {};
                element.name = "dim2";
                element.type = "output";
                getDataForObject(element, processOutputDataFetch);

                var element = {};
                element.name = "occ_sensor";
                element.type = "input";
                getDataForObject(element, processInputDataFetch);

                var element = {};
                element.name = "daylight";
                element.type = "input";
                getDataForObject(element, processInputDataFetch);
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

        // pan / zoom ,

        holder.bind("plotpan", function (event, output_plot) {
            var axes = output_plot.getAxes();

            if(input_plot != undefined) {
                input_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                input_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                input_plot.setupGrid();
                input_plot.draw();

            }

            // $(".message").html("Panning to x: "  + axes.xaxis.min.toFixed(2)
            //     + " &ndash; " + axes.xaxis.max.toFixed(2)
            //    + " and y: " + axes.yaxis.min.toFixed(2)
            //   + " &ndash; " + axes.yaxis.max.toFixed(2));
        });


        /* holder.bind("plotzoom", function (event, output_plot) {
         var axes = output_plot.getAxes();
         $(".message").html("Zooming to x: "  + axes.xaxis.min.toFixed(2)
         + " &ndash; " + axes.xaxis.max.toFixed(2)
         + " and y: " + axes.yaxis.min.toFixed(2)
         + " &ndash; " + axes.yaxis.max.toFixed(2));
         });*/



        // add zoom out button

        /* $("<div class='button' style='right:20px;top:20px'>zoom out</div>")
         .appendTo(holder)
         .click(function (event) {
         event.preventDefault();
         output_plot.zoomOut();
         });
         */
        // and add panning buttons

        // little helper for taking the repetitive work out of placing
        // panning arrows

        /* function addArrow(dir, right, top, offset) {
         $("<img class='button' src='images/arrow-" + dir + ".gif' style='right:" + right + "px;top:" + top + "px'>")
         .appendTo(holder)
         .click(function (e) {
         e.preventDefault();
         output_plot.pan(offset);
         input_plot.pan(offset);
         });
         }
         */

        // addArrow("left", 55, 60, { left: -100 });
        // addArrow("right", 25, 60, { left: 100 });



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
        timeformat: "%m/%d %H:%M",
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




// ************************************ INPUT GRAPH **************************


function processInputDataFetch(name, resultdata) {


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


            //$(".message").html("Panning to x: "  + axes.xaxis.min.toFixed(2)
            //    + " &ndash; " + axes.xaxis.max.toFixed(2)
            //   + " and y: " + axes.yaxis.min.toFixed(2)
            //   + " &ndash; " + axes.yaxis.max.toFixed(2));
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
        timeformat: "%m/%d %H:%M",
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


function setWindowHours(hours)
{

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

}

