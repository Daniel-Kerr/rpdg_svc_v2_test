/**
 * Created by Nick on 4/14/2017.
 */
var REST_GET_DATA = "history/getdata";

// output (fixture ) items
var output_dataset = [];
var output_plot = undefined;
var totaloutputs = 0;
//var outputcount = 0;

// level input items:
var levelinput_dataset = [];
var levelinput_plot = undefined;
//var levelinputcount = 0;
var totallevelinputs = 0;

// momentary contact items
var momentarycontact_dataset = [];
var momentarycontact_plot = undefined;
//var momentarycontactcount = 0;
var cachedMomentaryContactData = {};
var totalmomentarycontacts = 0;

// maintained contact items:
var maintainedcontact_dataset = [];
var maintainedcontact_plot = undefined;
//var maintainedcontactcount = 0;
var cachedMaintainedContactData = {};
var totalmaintainedcontacts = 0;


var panstartdate = new Date(2017,1,1);
var end_date = new Date();
var default_start_date = new Date();
var cachedconfig = undefined;

var currentwindowsizehours = 0;

var line_colors = ['#33AAAA','#3322FF','#3377FF','#33AA11','#33AA99'];
function init()
{
    getConfig(function (cfg) {

        if(cfg != undefined)
        {

            currentwindowsizehours = 6; // 5/24/17
            var zoomlevel = $.cookie("zoom");
            if(zoomlevel != undefined)
                currentwindowsizehours = Number(zoomlevel);

            var setmin = $.cookie("windowmin");
            var setmax = $.cookie("windowmax");


            default_start_date.setHours(default_start_date.getHours()-6);
            cachedconfig = cfg;
            document.title = cachedconfig.generalsettings.nodename;

            //outputcount = 0;
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
            var temparray = [];
            for (var i = 0; i < fixtures.length; i++) {
                temparray.push(fixtures[i].assignedname);
            }
            temparray.sort();
            for (var i = 0; i < temparray.length; i++) {
                var element = {};
                element.name = temparray[i];
                element.type = "output";
                //console.log(element.name + " assigned index: " + i);
                getDataForObject(element, i, processOutputDataFetch);
            }


            for (var i = 0; i < levelinputs.length; i++) {
                // FAUX data .
                var element = {};
                element.name = levelinputs[i].assignedname;
                element.type = "input";
                getDataForObject(element, i, processInputDataFetch);
            }

            for (var i = 0; i < contactinputs.length; i++) {
                // FAUX data .
                var element = {};
                element.name = contactinputs[i].assignedname;
                element.type = "input";

                if(contactinputs[i].type == "momentary")
                    getDataForObject(element, i, processMomentaryContactData);
                else
                    getDataForObject(element,i, processMaintainedContactDataFetch);
            }




        }
    });
}

function getDataForObject(obj, index, callback) {

    var dataset = JSON.stringify(obj);
    $.ajax({
        url: REST_GET_DATA,
        type: 'post',
        data: dataset,
        dataType: "text",
        contentType: "application/json; charset=utf-8",
        success: function (result) {
            callback(obj.name, index, result);
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


function processOutputDataFetch(name, index, resultdata) {

    console.log("processing data for: " + name);
    var dataholder = [];
    var parts = resultdata.split('\n');
    // create obj
    var element = {};
    element.label = name;
    element.color = line_colors[index];
    element.idx = index;

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
   // output_dataset.push(element);
    output_dataset.splice(index, 0,element);

    if(output_dataset.length >= totaloutputs)
    {
        var holder = $("#output-graph");
        output_plot = $.plot($("#output-graph"),
            output_dataset, // dataDetail,
            detailOptions
        );

        // ***************************************************
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

            var show = someData[this.name].lines.show;
            $.cookie("output."+this.name, show); //

            console.log("output enable change: " + this.name + "  : " + show);
            output_plot.setData(someData);
            output_plot.draw();

        });

        holder.bind("plotpan", function (event, output_plot) {
            var axes = output_plot.getAxes();
            setPlotWindowsValueRange(levelinput_plot, axes.xaxis.min,axes.xaxis.max);
            setPlotWindowsValueRange(momentarycontact_plot, axes.xaxis.min,axes.xaxis.max);
            setPlotWindowsValueRange(maintainedcontact_plot, axes.xaxis.min,axes.xaxis.max);

            $.cookie("windowmin", axes.xaxis.min);
            $.cookie("windowmax", axes.xaxis.max);
        });


        // cookie code to hold check boxes over , under dev. 8 /3
        var someData = output_plot.getData();
        for(var i = 0 ; i < someData.length; i++) {
            var bla = ($.cookie("output."+i) == "false")?false:true;
            someData[i].lines.show = bla;
            $("#id"+i).prop('checked', bla);
        }


        var min = $.cookie("windowmin"); //
        var max = $.cookie("windowmax"); //
        if(min != undefined && max != undefined)
            setPlotWindowsValueRange(output_plot, min,max);

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

function processInputDataFetch(name, index, resultdata) {

    if(resultdata == undefined)
        return;


    var dataholder = [];
    var parts = resultdata.split('\n');

    // create obj
    var element = {};
    element.label = name;
    element.color = line_colors[index];
    element.idx = index;



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
    levelinput_dataset.splice(index, 0,element);

    if(levelinput_dataset.length >= totallevelinputs)
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

            var show = someData[this.name].lines.show;
            $.cookie("levelinput."+this.name, show); //

            levelinput_plot.setData(someData);
            levelinput_plot.draw();

        });

        holder.bind("plotpan", function (event, levelinput_plot) {
            var axes = levelinput_plot.getAxes();
            setPlotWindowsValueRange(output_plot, axes.xaxis.min,axes.xaxis.max);
            setPlotWindowsValueRange(momentarycontact_plot, axes.xaxis.min,axes.xaxis.max);
            setPlotWindowsValueRange(maintainedcontact_plot, axes.xaxis.min,axes.xaxis.max);
        });


        // cookie code to hold check boxes over , under dev. 8 /3
        var someData = levelinput_plot.getData();
        for(var i = 0 ; i < someData.length; i++) {
            var bla = ($.cookie("levelinput."+i) == "false")?false:true;
            someData[i].lines.show = bla;
            $("#level"+i).prop('checked', bla);
        }

        var min = $.cookie("windowmin"); //
        var max = $.cookie("windowmax"); //
        if(min != undefined && max != undefined)
            setPlotWindowsValueRange(levelinput_plot, min,max);
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



function processMomentaryContactData(name, index , resultdata) {

    if(resultdata == undefined)
        return;

    cachedMomentaryContactData[name] = resultdata;

    var dataholder = [];
    var parts = resultdata.split('\n');

    // create obj
    var element = {};
    element.label = name;
    element.color = line_colors[index];
    element.idx = index;

   // momentarycontactcount++;

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
    momentarycontact_dataset.splice(index, 0,element);


    if(momentarycontact_dataset.length >= totalmomentarycontacts) {
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
                "' checked='checked' id='momcontact" + key + "'></input>" +
                "<label for='contact" + key + "'>"
                + val.label + "</label>" + "</div>");
        });

        choiceContainer.find("input").click(function () {
            var someData = momentarycontact_plot.getData();
            someData[this.name].bars.show = !someData[this.name].bars.show;
            momentarycontact_plot.setData(someData);
            momentarycontact_plot.draw();

            var show = someData[this.name].bars.show;
            $.cookie("momcontact."+this.name, show); //

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

            setPlotWindowsValueRange(output_plot, axes.xaxis.min,axes.xaxis.max);
            setPlotWindowsValueRange(levelinput_plot, axes.xaxis.min,axes.xaxis.max);
            setPlotWindowsValueRange(maintainedcontact_plot, axes.xaxis.min,axes.xaxis.max);

        });



        // cookie code to hold check boxes over , under dev. 8 /3
        var someData = momentarycontact_plot.getData();
        for(var i = 0 ; i < someData.length; i++) {
            var bla = ($.cookie("momcontact."+i) == "false")?false:true;
            someData[i].bars.show = bla;
            $("#momcontact"+i).prop('checked', bla);
        }

        var min = $.cookie("windowmin");
        var max = $.cookie("windowmax");
        if(min != undefined && max != undefined)
            setPlotWindowsValueRange(momentarycontact_plot, min,max);
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

function processMaintainedContactDataFetch(name, index, resultdata) {

    if(resultdata == undefined)
        return;


    cachedMaintainedContactData[name] = resultdata;


    var dataholder = [];
    var parts = resultdata.split('\n');

    // create obj
    var element = {};
    element.label = name;
    element.color = line_colors[index];
    element.idx = index;

  //  maintainedcontactcount++;

    for(var i = 0; i < parts.length; i++)
    {
        try {
            var point = JSON.parse(parts[i]);
            var d = new Date(point.date);
            if(point.value <= 0)
                dataholder.push([d,-1]);  // for now scale.
            dataholder.push([d,Number(point.value)]);  // for now scale.
        } catch(err )
        {
        }
    }

    element.data = dataholder;
    maintainedcontact_dataset.splice(index, 0,element);

    if(maintainedcontact_dataset.length >= totalmaintainedcontacts)
    {
        var holder = $("#maintained_contactgraph");

        maintainedcontact_plot = $.plot($("#maintained_contactgraph"),
            maintainedcontact_dataset,
            maintainedContactOptions
        );

        var height = totalmaintainedcontacts * 27;
        if(height < 260)
            height = 260;

        $("#parent_contactinput_main").height(height);

        var choiceContainer = $("#maintained_contactchoices");
        $.each(maintainedcontact_dataset, function(key, val) {
            choiceContainer.append(
                "<div class='checkbox checkbox-primary'>"+
                "<input type='checkbox' name='" + key +
                "' checked='checked' id='maincontact" + key + "'></input>" +
                "<label for='level" + key + "'>"
                + val.label + "</label>" + "</div>");
        });

        choiceContainer.find("input").click(function() {
            var someData = maintainedcontact_plot.getData();
            someData[this.name].lines.show = !someData[this.name].lines.show;
            maintainedcontact_plot.setData(someData);
            maintainedcontact_plot.draw();

            var show = someData[this.name].lines.show;
            $.cookie("maintainedcontact."+this.name, show); //

        });

        holder.bind("plotpan", function (event, maintainedcontact_plot) {
            var axes = maintainedcontact_plot.getAxes();


            setPlotWindowsValueRange(output_plot, axes.xaxis.min,axes.xaxis.max);
            setPlotWindowsValueRange(levelinput_plot, axes.xaxis.min,axes.xaxis.max);
            setPlotWindowsValueRange(momentarycontact_plot, axes.xaxis.min,axes.xaxis.max);

        });


        // cookie code to hold check boxes over , under dev. 8 /3
        var someData = maintainedcontact_plot.getData();
        for(var i = 0 ; i < someData.length; i++) {
            var bla = ($.cookie("maintainedcontact."+i) == "false")?false:true;
            someData[i].lines.show = bla;
            $("#maincontact"+i).prop('checked', bla);
        }

        var min = $.cookie("windowmin");
        var max = $.cookie("windowmax");
        if(min != undefined && max != undefined)
            setPlotWindowsValueRange(maintainedcontact_plot, min,max);
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


function setPlotWindowsTimeRange(plot, timemin, timemax)
{
    if(plot != undefined) {
        plot.getOptions().xaxes[0].min = timemin.getTime();
        plot.getOptions().xaxes[0].max = timemax.getTime();
        plot.setupGrid();
        plot.draw();
    }
}


function setPlotWindowsValueRange(plot, valmin, valmax)
{
    if(plot != undefined) {
        plot.getOptions().xaxes[0].min = valmin;
        plot.getOptions().xaxes[0].max = valmax;
        plot.setupGrid();
        plot.draw();
    }
}

function resetWindowView()
{
    currentwindowsizehours = 6;
    var windowminutes = currentwindowsizehours*60;
    var min = new Date();
    var max = new Date();

    min.setMinutes(min.getMinutes()-windowminutes);

    setPlotWindowsTimeRange(output_plot, min,max);
    setPlotWindowsTimeRange(levelinput_plot, min,max);
    setPlotWindowsTimeRange(momentarycontact_plot, min,max);
    setPlotWindowsTimeRange(maintainedcontact_plot, min,max);

    $.cookie("zoom", currentwindowsizehours); //
    $.cookie("windowmin", min.getTime()); //
    $.cookie("windowmax", max.getTime()); //
}


function setWindowHours(hours)
{
    currentwindowsizehours = hours;
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

    setPlotWindowsTimeRange(output_plot, min,max);
    setPlotWindowsTimeRange(levelinput_plot, min,max);
    setPlotWindowsTimeRange(momentarycontact_plot, min,max);
    setPlotWindowsTimeRange(maintainedcontact_plot, min,max);
    refreshMomentaryContactHistorgram();

    $.cookie("zoom", currentwindowsizehours); //
    $.cookie("windowmin", min.getTime()); //
    $.cookie("windowmax", max.getTime()); //
}

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

    setPlotWindowsTimeRange(output_plot, min,max);
    setPlotWindowsTimeRange(levelinput_plot, min,max);
    setPlotWindowsTimeRange(momentarycontact_plot, min,max);
    setPlotWindowsTimeRange(maintainedcontact_plot, min,max);
    refreshMomentaryContactHistorgram();

    $.cookie("zoom", currentwindowsizehours); //
    $.cookie("windowmin", min.getTime()); //
    $.cookie("windowmax", max.getTime()); //

}



function windowZoomOut() {
    var delta = currentwindowsizehours / 4;

    currentwindowsizehours = currentwindowsizehours + delta;
    if (currentwindowsizehours >= 720)
        currentwindowsizehours = 720;

    var windowminutes = currentwindowsizehours * 60;

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

    setPlotWindowsTimeRange(output_plot, min,max);
    setPlotWindowsTimeRange(levelinput_plot, min,max);
    setPlotWindowsTimeRange(momentarycontact_plot, min,max);
    setPlotWindowsTimeRange(maintainedcontact_plot, min,max);
    refreshMomentaryContactHistorgram();

    $.cookie("zoom", currentwindowsizehours); //
    $.cookie("windowmin", min.getTime()); //
    $.cookie("windowmax", max.getTime()); //
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

    setPlotWindowsTimeRange(output_plot, min,max);
    setPlotWindowsTimeRange(levelinput_plot, min,max);
    setPlotWindowsTimeRange(momentarycontact_plot, min,max);
    setPlotWindowsTimeRange(maintainedcontact_plot, min,max);

    $.cookie("windowmin", min.getTime()); //
    $.cookie("windowmax", max.getTime()); //
}




function refreshMomentaryContactHistorgram()
{
   // momentarycontactcount = 0;
    momentarycontact_dataset = [];
    var index = 0;
    $("#contactinputchoices").empty();
    for (var key in cachedMomentaryContactData) {
        var data = cachedMomentaryContactData[key];

        processMomentaryContactData(key,index , data);
        index++;

    }
}



function refreshMaintainedContactHistorgram()
{
   // maintainedcontactcount = 0;
    var index = 0;
    maintainedcontact_dataset = [];
    $("#maintained_contactchoices").empty();
    for (var key in cachedMaintainedContactData) {
        var data = cachedMaintainedContactData[key];
        processMaintainedContactDataFetch(key, index, data);
        index++;

    }
}