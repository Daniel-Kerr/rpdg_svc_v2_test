/**
 * Created by Nick on 4/14/2017.
 */
var REST_GET_DATA = "history/getdata";

// output (fixture ) items
var output_dataset = [];
var output_plot = undefined;
var totaloutputs = 0;
var outputcount = 0;

// level input items:
var levelinput_dataset = [];
var levelinput_plot = undefined;
var levelinputcount = 0;
var totallevelinputs = 0;

// momentary contact items
var momentarycontact_dataset = [];
var momentarycontact_plot = undefined;
var momentarycontactcount = 0;
var cachedMomentaryContactData = {};
var totalmomentarycontacts = 0;

// maintained contact items:
var maintainedcontact_dataset = [];
var maintainedcontact_plot = undefined;
var maintainedcontactcount = 0;
var cachedMaintainedContactData = {};
var totalmaintainedcontacts = 0;


var panstartdate = new Date(2017,1,1);
var end_date = new Date();
var default_start_date = new Date();
var cachedconfig = undefined;

var line_colors = ['#33AAAA','#3322FF','#3377FF','#33AA11','#33AA99'];
function init()
{
    getConfig(function (cfg) {

        if(cfg != undefined)
        {
            currentwindowsizehours = 6; // 5/24/17

            default_start_date.setHours(default_start_date.getHours()-6);

            cachedconfig = cfg;
            outputcount = 0;
            totaloutputs = cfg.fixtures.length;
            var fixtures = cfg.fixtures;
            var levelinputs = cfg.levelinputs;
            var contactinputs = cfg.contactinputs;
            totallevelinputs = cfg.levelinputs.length;

            // preprocess to split between the two types.
            for (var i = 0; i < contactinputs.length; i++) {
                if(contactinputs[i].type == "momentary")
                    totalmomentarycontacts++;
                else
                    totalmaintainedcontacts++;
            }

            // totalmomentarycontacts =  cfg.contactinputs.length;

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

                if(contactinputs[i].type == "momentary")
                    getDataForObject(element, processMomentaryContactData);
                else
                    getDataForObject(element, processMaintainedContactDataFetch);
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

        // ***************************************************
      //  var par_out_div = $("#parent_output");  // 6/8/17 set
        var height = totaloutputs * 27;
        if(height < 260)
            height = 260;

        $("#parent_output").height(height);


        var choiceContainer = $("#choices");
        $.each(output_dataset, function(key, val) {
            choiceContainer.append(
                "<div class='checkbox checkbox-primary'>"+
                "<input type='checkbox' name='" + key +
                "' checked='checked' id='id" + key + "'></input>" +
                "<label for='id" + key + "'>"
                + val.label + "</label>" + "</div>");
        });

        choiceContainer.find("input").click(function() {
            var someData = output_plot.getData();
            someData[this.name].lines.show = !someData[this.name].lines.show;
            output_plot.setData(someData);
            output_plot.draw();

        });

        holder.bind("plotpan", function (event, output_plot) {
            var axes = output_plot.getAxes();

            if(levelinput_plot != undefined) {
                levelinput_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                levelinput_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                levelinput_plot.setupGrid();
                levelinput_plot.draw();

            }

            if(momentarycontact_plot != undefined) {
                momentarycontact_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                momentarycontact_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                momentarycontact_plot.setupGrid();
                momentarycontact_plot.draw();
            }

            if(maintainedcontact_plot != undefined) {
                maintainedcontact_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                maintainedcontact_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                maintainedcontact_plot.setupGrid();
                maintainedcontact_plot.draw();
            }
        });
    }
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
    element.color = line_colors[levelinputcount];
    element.idx = levelinputcount;

    levelinputcount++;

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
    levelinput_dataset.push(element);

    if(levelinputcount >= totallevelinputs)
    {
        var holder = $("#input-graph");


        levelinput_plot = $.plot($("#input-graph"),
            levelinput_dataset,
            levelinputdetailOptions
        );


        var height = totallevelinputs * 27;
        if(height < 260)
            height = 260;

        $("#parent_levelinput").height(height);

        var choiceContainer = $("#levelinputchoices");
        $.each(levelinput_dataset, function(key, val) {
            choiceContainer.append(
                "<div class='checkbox checkbox-primary'>"+
                "<input type='checkbox' name='" + key +
                "' checked='checked' id='level" + key + "'></input>" +
                "<label for='level" + key + "'>"
                + val.label + "</label>" + "</div>");
        });

        choiceContainer.find("input").click(function() {
            var someData = levelinput_plot.getData();
            someData[this.name].lines.show = !someData[this.name].lines.show;
            levelinput_plot.setData(someData);
            levelinput_plot.draw();

        });



        holder.bind("plotpan", function (event, levelinput_plot) {
            var axes = levelinput_plot.getAxes();

            if(output_plot != undefined) {
                output_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                output_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                output_plot.setupGrid();
                output_plot.draw();
            }

            if(momentarycontact_plot != undefined) {
                momentarycontact_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                momentarycontact_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                momentarycontact_plot.setupGrid();
                momentarycontact_plot.draw();
            }

            if(maintainedcontact_plot != undefined) {
                maintainedcontact_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                maintainedcontact_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                maintainedcontact_plot.setupGrid();
                maintainedcontact_plot.draw();
            }
        });
    }
}


var levelinputdetailOptions = {
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
    }

};


//*********************************************************************************************************
// ******************************************** Momentary Contact Input graph ******
//*********************************************************************************************************



function processMomentaryContactData(name, resultdata) {

    if(resultdata == undefined)
        return;

    cachedMomentaryContactData[name] = resultdata;

    var dataholder = [];
    var parts = resultdata.split('\n');

    // create obj
    var element = {};
    element.label = name;
    element.color = line_colors[momentarycontactcount];
    element.idx = momentarycontactcount;

    momentarycontactcount++;

    var maxbucketcount = 0;

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
                    else if (bucketcount > maxbucketcount)
                        maxbucketcount = bucketcount;

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

                // 5/31/17  calc bucket size in min
                var bucketminutes = 15; // default to 15 min,
                var windowmin = currentwindowsizehours*60;
                bucketminutes = windowmin/24;
                bucketenddate.setMinutes(bucketenddate.getMinutes() + bucketminutes);
            }

        } catch(err )
        {
        }
    }

    element.data = dataholder;
    momentarycontact_dataset.push(element);


    if(momentarycontactcount >= totalmomentarycontacts) {
        var holder = $("#contactinput-graph");

        momentarycontact_plot = $.plot($("#contactinput-graph"),
            momentarycontact_dataset,
            contactinputdetailOptions
        );

        var height = totalmomentarycontacts * 27;
        if(height < 260)
            height = 260;

        $("#parent_contactinput").height(height);


        var choiceContainer = $("#contactinputchoices");
        $.each(momentarycontact_dataset, function (key, val) {
            choiceContainer.append(
                "<div class='checkbox checkbox-primary'>" +
                "<input type='checkbox' name='" + key +
                "' checked='checked' id='contact" + key + "'></input>" +
                "<label for='contact" + key + "'>"
                + val.label + "</label>" + "</div>");
        });

        choiceContainer.find("input").click(function () {
            var someData = momentarycontact_plot.getData();
            someData[this.name].bars.show = !someData[this.name].bars.show;
            momentarycontact_plot.setData(someData);
            momentarycontact_plot.draw();

        });


        momentarycontact_plot.getOptions().yaxes[0].max = maxbucketcount + 5;
        if (output_plot != undefined)
        {
            momentarycontact_plot.getOptions().xaxes[0].min = output_plot.getOptions().xaxes[0].min;
            momentarycontact_plot.getOptions().xaxes[0].max = output_plot.getOptions().xaxes[0].max;

            var width = currentwindowsizehours*60;
            var  bla = momentarycontact_plot.getOptions().series.bars.barWidth;
            var windowmin = currentwindowsizehours*60;
            var bucketminutes = windowmin/24;
            var bucketsec = bucketminutes*60;
            var bucketmsec = bucketsec * 1000;
            momentarycontact_plot.getOptions().series.bars.barWidth = bucketmsec;
            momentarycontact_plot.setupGrid();
            momentarycontact_plot.draw();
        }

        holder.bind("plotpan", function (event, momentarycontact_plot) {
            var axes = momentarycontact_plot.getAxes();

            if(output_plot != undefined) {
                output_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                output_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                output_plot.setupGrid();
                output_plot.draw();
            }

            if(levelinput_plot != undefined) {
                levelinput_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                levelinput_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                levelinput_plot.setupGrid();
                levelinput_plot.draw();
            }

            if(maintainedcontact_plot != undefined) {
                maintainedcontact_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                maintainedcontact_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                maintainedcontact_plot.setupGrid();
                maintainedcontact_plot.draw();
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
        max: 20,
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
    }

};

//*********************************************************************************************************
// ****************************************************************** END Momentary Contact input *****************************
//*********************************************************************************************************





//*********************************************************************************************************
// ************************************Maintained contact input data **************************
//*********************************************************************************************************

function processMaintainedContactDataFetch(name, resultdata) {

    if(resultdata == undefined)
        return;


    var dataholder = [];
    var parts = resultdata.split('\n');

    // create obj
    var element = {};
    element.label = name;
    element.color = line_colors[maintainedcontactcount];
    element.idx = maintainedcontactcount;

    maintainedcontactcount++;

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
    maintainedcontact_dataset.push(element);

    if(maintainedcontactcount >= totalmaintainedcontacts)
    {
        var holder = $("#maintained_contactgraph");

        maintainedcontact_plot = $.plot($("#maintained_contactgraph"),
            maintainedcontact_dataset,
            maintainedContactOptions
        );

        var height = totalmaintainedcontacts * 27;
        if(height < 260)
            height = 260;

        $("#parent_levelinput").height(height);

        var choiceContainer = $("#maintained_contactchoices");
        $.each(maintainedcontact_dataset, function(key, val) {
            choiceContainer.append(
                "<div class='checkbox checkbox-primary'>"+
                "<input type='checkbox' name='" + key +
                "' checked='checked' id='level" + key + "'></input>" +
                "<label for='level" + key + "'>"
                + val.label + "</label>" + "</div>");
        });

        choiceContainer.find("input").click(function() {
            var someData = maintainedcontact_plot.getData();
            someData[this.name].lines.show = !someData[this.name].lines.show;
            maintainedcontact_plot.setData(someData);
            maintainedcontact_plot.draw();

        });

        holder.bind("plotpan", function (event, maintainedcontact_plot) {
            var axes = maintainedcontact_plot.getAxes();

            if(output_plot != undefined) {
                output_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                output_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                output_plot.setupGrid();
                output_plot.draw();
            }

            if(levelinput_plot != undefined) {
                levelinput_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                levelinput_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                levelinput_plot.setupGrid();
                levelinput_plot.draw();
            }

            if(momentarycontact_plot != undefined) {
                momentarycontact_plot.getOptions().xaxes[0].min = axes.xaxis.min;
                momentarycontact_plot.getOptions().xaxes[0].max = axes.xaxis.max;
                momentarycontact_plot.setupGrid();
                momentarycontact_plot.draw();
            }
        });
    }
}


var maintainedContactOptions = {
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
        max: 1,
        ticksize: 1,
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
    }

};


// ************************************** END Maintained contact input.

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

    if(levelinput_plot != undefined) {
        levelinput_plot.getOptions().xaxes[0].min = min.getTime();
        levelinput_plot.getOptions().xaxes[0].max = max.getTime();
        levelinput_plot.setupGrid();
        levelinput_plot.draw();
    }

    if(momentarycontact_plot != undefined) {
        momentarycontact_plot.getOptions().xaxes[0].min = min.getTime();
        momentarycontact_plot.getOptions().xaxes[0].max = max.getTime();
        momentarycontact_plot.setupGrid();
        momentarycontact_plot.draw();
    }

    if(maintainedcontact_plot != undefined) {
        maintainedcontact_plot.getOptions().xaxes[0].min = min.getTime();
        maintainedcontact_plot.getOptions().xaxes[0].max = max.getTime();
        maintainedcontact_plot.setupGrid();
        maintainedcontact_plot.draw();
    }

    refreshMomentaryContactHistorgram();
    refreshMaintainedContactHistorgram();
}


var currentwindowsizehours = 0;

function windowZoomIn()
{
    var delta = currentwindowsizehours/4;

    currentwindowsizehours = currentwindowsizehours - delta;

    if(currentwindowsizehours <= 0)
        currentwindowsizehours = 1;

    var windowminutes = currentwindowsizehours*60;

    var axes = 0;
    if(output_plot != undefined)
        axes = output_plot.getAxes();
    else if(levelinput_plot != undefined)
        axes = levelinput_plot.getAxes();
    else if(momentarycontact_plot != undefined)
        axes = momentarycontact_plot.getAxes();


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

    if(levelinput_plot != undefined) {
        levelinput_plot.getOptions().xaxes[0].min = min.getTime();
        levelinput_plot.getOptions().xaxes[0].max = max.getTime();
        levelinput_plot.setupGrid();
        levelinput_plot.draw();
    }

    if(momentarycontact_plot != undefined) {
        momentarycontact_plot.getOptions().xaxes[0].min = min.getTime();
        momentarycontact_plot.getOptions().xaxes[0].max = max.getTime();
        momentarycontact_plot.setupGrid();
        momentarycontact_plot.draw();
    }

    if(maintainedcontact_plot != undefined) {
        maintainedcontact_plot.getOptions().xaxes[0].min = min.getTime();
        maintainedcontact_plot.getOptions().xaxes[0].max = max.getTime();
        maintainedcontact_plot.setupGrid();
        maintainedcontact_plot.draw();
    }

    refreshMomentaryContactHistorgram();
    refreshMaintainedContactHistorgram();
}



function windowZoomOut() {
    var delta = currentwindowsizehours / 4;

    currentwindowsizehours = currentwindowsizehours + delta;
    if (currentwindowsizehours >= 720)
        currentwindowsizehours = 720;

    var windowminutes = currentwindowsizehours * 60;

   // var axes = output_plot.getAxes();

    var axes = 0;
    if(output_plot != undefined)
        axes = output_plot.getAxes();
    else if(levelinput_plot != undefined)
        axes = levelinput_plot.getAxes();
    else if(momentarycontact_plot != undefined)
        axes = momentarycontact_plot.getAxes();

    var tempmin = axes.xaxis.min;
    var tempmax = axes.xaxis.max;

    var zoompoint = tempmax - ((tempmax - tempmin) / 2);

    var middletime = new Date(zoompoint);

    var min = new Date(middletime.getTime());
    var max = new Date(middletime.getTime());

    min.setMinutes(min.getMinutes() - windowminutes / 2);
    max.setMinutes(max.getMinutes() + windowminutes / 2);

    if (output_plot != undefined) {
        output_plot.getOptions().xaxes[0].min = min.getTime();
        output_plot.getOptions().xaxes[0].max = max.getTime();
        output_plot.setupGrid();
        output_plot.draw();
    }

    if (levelinput_plot != undefined) {
        levelinput_plot.getOptions().xaxes[0].min = min.getTime();
        levelinput_plot.getOptions().xaxes[0].max = max.getTime();
        levelinput_plot.setupGrid();
        levelinput_plot.draw();
    }

    if (momentarycontact_plot != undefined) {
        momentarycontact_plot.getOptions().xaxes[0].min = min.getTime();
        momentarycontact_plot.getOptions().xaxes[0].max = max.getTime();
        momentarycontact_plot.setupGrid();
        momentarycontact_plot.draw();
    }

    if(maintainedcontact_plot != undefined) {
        maintainedcontact_plot.getOptions().xaxes[0].min = min.getTime();
        maintainedcontact_plot.getOptions().xaxes[0].max = max.getTime();
        maintainedcontact_plot.setupGrid();
        maintainedcontact_plot.draw();
    }

    refreshMomentaryContactHistorgram();

    refreshMaintainedContactHistorgram();

}





function windowMove(direction)
{

    var windowminutes = currentwindowsizehours*60;

    var shiftminutes = windowminutes/4;

   // var axes = output_plot.getAxes();
    var axes = 0;
    if(output_plot != undefined)
        axes = output_plot.getAxes();
    else if(levelinput_plot != undefined)
        axes = levelinput_plot.getAxes();
    else if(momentarycontact_plot != undefined)
        axes = momentarycontact_plot.getAxes();

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

    if(levelinput_plot != undefined) {
        levelinput_plot.getOptions().xaxes[0].min = min.getTime();
        levelinput_plot.getOptions().xaxes[0].max = max.getTime();
        levelinput_plot.setupGrid();
        levelinput_plot.draw();
    }

    if(momentarycontact_plot != undefined) {
        momentarycontact_plot.getOptions().xaxes[0].min = min.getTime();
        momentarycontact_plot.getOptions().xaxes[0].max = max.getTime();
        momentarycontact_plot.setupGrid();
        momentarycontact_plot.draw();
    }

    if(maintainedcontact_plot != undefined) {
        maintainedcontact_plot.getOptions().xaxes[0].min = min.getTime();
        maintainedcontact_plot.getOptions().xaxes[0].max = max.getTime();
        maintainedcontact_plot.setupGrid();
        maintainedcontact_plot.draw();
    }
}




function refreshMomentaryContactHistorgram()
{
    momentarycontactcount = 0;
    momentarycontact_dataset = [];
    $("#contactinputchoices").empty();
    for (var key in cachedMomentaryContactData) {
        var data = cachedMomentaryContactData[key];
        processMomentaryContactData(key, data);

    }
}



function refreshMaintainedContactHistorgram()
{
    maintainedcontactcount = 0;
    maintainedcontact_dataset = [];
    $("#maintained_contactchoices").empty();
    for (var key in cachedMaintainedContactData) {
        var data = cachedMaintainedContactData[key];
        processMaintainedContactDataFetch(key, data);

    }
}