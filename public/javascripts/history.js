/**
 * Created by Nick on 4/14/2017.
 */

var REST_GET_DATA = "history/getdata";

var output_plot = undefined;

var input_plot = undefined;


var output_dataset = [];
var input_dataset = [];

var outputcount = 1;  // number of outputs

var inputcount = 1;  // number of outputs

function init()
{
    getConfig(function (cfg) {

        if(cfg != undefined)
        {
            //var fixtures = cfg.fixtures;
            var element = {};
            element.name = "dim1";
            element.type = "output";
            getDataForObject(element, processOutputDataFetch);

            var element = {};
            element.name = "occ_sensor";
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
            callback(result);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            callback("error");
        }
    });
}


function processOutputDataFetch(resultdata) {

    var parts = resultdata.split('\n');
    for(var i = 0; i < parts.length; i++)
    {
        try {
            var point = JSON.parse(parts[i]);
            var ele = [];
            ele.push(Number(Number(point.date) * 1000));
            ele.push(Number(point.level));
            output_dataset.push(ele);
        } catch(err )
        {

        }
    }
    output_plot = $.plot($("#output-graph"),
        dataDetail,
        detailOptions
    );
}




function processInputDataFetch(resultdata) {

    var parts = resultdata.split('\n');
    for(var i = 0; i < parts.length; i++)
    {
        try {
            var point = JSON.parse(parts[i]);
            var ele = [];
            ele.push(Number(Number(point.date) * 1000));
            ele.push(Number(point.level));
            input_dataset.push(ele);
        } catch(err )
        {

        }
    }

    input_plot = $.plot($("#input-graph"),
        inputdataDetail,
        detailOptions
    );
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
    //legend: {
    //    position: "nw"
    //}
    // ,
    legend: {
        labelFormatter: function(label, series){
            return '<a href="#" onClick="togglePlot('+series.idx+'); return false;">'+label+'</a>';
        }
    }
};


var dataDetail = [
    {
        data: output_dataset,idx:0,
        label: "dim1",
        color: '#33AAFF'
    },
    {
        data: output_dataset,idx:1,
        label: "dim2",
        color: '#FFAA00'
    }

];


// ************************************ INPUT GRAPH **************************

var inputdataDetail = [
    {
        data: input_dataset,idx:0,
        label: "occ_sensor",
        color: '#77FFFF'
    }
];


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
    //legend: {
    //    position: "nw"
    //}
    // ,
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


/*

function constructObjectGraphHolder(object) {

    var contdiv = document.getElementById("outputs_graphs");

    var fixcol = document.createElement("div");
    fixcol.className = "col-lg-10";
    contdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "box";
    fixcol.appendChild(fixbox);

    var fixboxheader = document.createElement("div");
    fixboxheader.className = "box-header";
    fixbox.appendChild(fixboxheader);

    var header = document.createElement("h2");
    header.innerHTML = object; //fixture.assignedname;
    fixboxheader.appendChild(header);

    var fixcontent = document.createElement("div");
    fixcontent.className = "box-content";
    fixbox.appendChild(fixcontent);



    //<div id="tds-graph" class="demo-placeholder" style="height:260px;"></div>
    var contentrow1 = document.createElement("div");
    contentrow1.className = "demo-placeholder";
    contentrow1.id = object + "_graph";
    fixcontent.appendChild(contentrow1);



    //<div id="gauge1" class="gaugeblock"></div>
    /*  if (fixture.type == "on_off") {
     //var contentrow1 = document.createElement("div");
     // contentrow1.innerHTML = " this is row 1 content ";
     var bulb_icondiv = document.createElement("div");
     bulb_icondiv.className = "gaugeblock";
     bulb_icondiv.id = fixture.assignedname + "_bulb";
     // <img src="something.jpg" alt="" />
     var bulb_iconimg = document.createElement("img");
     bulb_iconimg.src = "images/bulb_off.jpg";
     bulb_iconimg.className = "bulbiconrow";

     bulb_icon_map[fixture.assignedname] = bulb_iconimg;

     bulb_icondiv.appendChild(bulb_iconimg);
     contentrow1.appendChild(bulb_icondiv);

     }
     else {
     var gaugediv = document.createElement("div");
     gaugediv.className = "gaugeblock";
     gaugediv.id = fixture.assignedname + "_gauge";
     contentrow1.appendChild(gaugediv);
     // place gauge element inside the div
     var test = new JustGage({id: fixture.assignedname + "_gauge", value: 50, min: 0, max: 100, title: "Dim Level"});
     gaugesmap[fixture.assignedname] = test;

     }



     var contentrow2 = document.createElement("div");
     contentrow2.style = "width: 100%; height: 20px";

     var row2left = document.createElement("div");
     //row2left.className = "guagerow";
     row2left.id = fixture.assignedname + "_power";
     row2left.innerHTML = fixture.powerwatts + " Watts";
     row2left.style = "width:70%; float: left";
     contentrow2.appendChild(row2left);

     var row2right = document.createElement("div");
     row2right.style = "float: left";
     var sunbox = document.createElement("img");
     sunbox.src = "images/handtinytrans.gif";
     sunbox.height="20";
     sunbox.width="20";
     //sunbox.style = "float: right";
     daylight_limit_icon_map[fixture.assignedname] = sunbox;
     row2right.appendChild(sunbox);
     contentrow2.appendChild(row2right);
     */
   // fixcontent.appendChild(contentrow2);
   // return fixcol;

//}
