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

var line_colors = ['#33AAAA','#3322FF','#3377FF','#33AA11','#33AA99'];
function init()
{
    getConfig(function (cfg) {

        if(cfg != undefined)
        {
            outputcount = 0;

            var fixtures = cfg.fixtures;

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


function processOutputDataFetch(name, resultdata) {


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
            dataholder.push([Number(Number(point.date) * 1000),Number(point.level)]);
        } catch(err )
        {
        }
    }

    element.data = dataholder;
    output_dataset.push(element);

    if(outputcount >= totaloutputs)
    {
        output_plot = $.plot($("#output-graph"),
            output_dataset, // dataDetail,
            detailOptions
        );
    }
}

togglePlot = function(seriesIdx)
{
    var someData = output_plot.getData();
    someData[seriesIdx].lines.show = !someData[seriesIdx].lines.show;
    output_plot.setData(someData);
    output_plot.draw();
}


/*var dataDetail = [
    {
        data: output_dataset,idx:0,
        label: "dim1",
        color: '#33AAFF'
    }
];  */

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
        ticksize: 20
    },
    xaxis:{
        show: true,
        mode: "time",
        timezone: "browser"
    },
    selection:{
        mode: "x"
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
            dataholder.push([Number(Number(point.date) * 1000),Number(point.level)]);
        } catch(err )
        {
        }
    }

    element.data = dataholder;
    input_dataset.push(element);

    if(inputcount >= totalinputs)
    {
        input_plot = $.plot($("#input-graph"),
            input_dataset,
            inputdetailOptions
        );
    }
}

/*
var inputdataDetail = [
    {
        data: input_dataset,idx:0,
        label: "occ_sensor",
        color: '#77FFFF'
    }
];
*/

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
        ticksize: 20
    },
    xaxis:{
        show: true,
        mode: "time",
        timezone: "browser"
    },
    selection:{
        mode: "x"
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
