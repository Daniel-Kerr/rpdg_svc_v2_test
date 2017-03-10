/**
 * Created by Nick on 11/29/2016.
 */

// periodic poll of data.
setInterval(function () {
    rest_getpagedata();
}, 5000);


$(function () {
    $("#titlebar").load("customtitlebar.html");
});


function initStatusHandler(status)
{
    var fixcountinrow = 0;
    var row = 1;
    var currentrow_div = document.getElementById("fixture_row" + row);
    for (var key in status.fixtures) {
        if (fixcountinrow >= 4) {
            row++;
            currentrow_div = document.getElementById("fixture_row" + row);
        }
        var fixcol = constructFixtureBox(currentrow_div, status.fixtures[key].fixture);
    }
    updateUIPageComponents(status);
}

function initFixtureStatusBoxes() {
    getStatus(initStatusHandler);
}


var gaugesmap = {};
var bulb_icon_map = {};
var daylight_limit_icon_map = {};
function constructFixtureBox(currentdiv, fixture) {
    var fixcol = document.createElement("div");
    fixcol.className = "col-lg-2";
    currentdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "box";
    fixcol.appendChild(fixbox);

    var fixboxheader = document.createElement("div");
    fixboxheader.className = "box-header";
    fixbox.appendChild(fixboxheader);


   /* var sunbox = document.createElement("img");
    sunbox.src = "images/handtinytrans.gif";
    sunbox.height="20";
    sunbox.width="20";
    sunbox.style = "float: left";
    daylight_limit_icon_map[fixture.uid] = sunbox;
    fixboxheader.appendChild(sunbox);  */

    var header = document.createElement("h2");
    header.innerHTML = fixture.name;
    fixboxheader.appendChild(header);



    var fixcontent = document.createElement("div");
    fixcontent.className = "box-content";
    fixbox.appendChild(fixcontent);


    var contentrow1 = document.createElement("div");
    contentrow1.className = "guagerow";
    contentrow1.id = fixture.uid + "_level";


    fixcontent.appendChild(contentrow1);

    //<div id="gauge1" class="gaugeblock"></div>
    if (fixture.type == "on_off") {
        //var contentrow1 = document.createElement("div");
        // contentrow1.innerHTML = " this is row 1 content ";
        var bulb_icondiv = document.createElement("div");
        bulb_icondiv.className = "gaugeblock";
        bulb_icondiv.id = fixture.uid + "_bulb";
        // <img src="something.jpg" alt="" />
        var bulb_iconimg = document.createElement("img");
        bulb_iconimg.src = "images/bulb_off.jpg";
        bulb_iconimg.className = "bulbiconrow";

        bulb_icon_map[fixture.uid] = bulb_iconimg;

        bulb_icondiv.appendChild(bulb_iconimg);
        contentrow1.appendChild(bulb_icondiv);

    }
    else {
        var gaugediv = document.createElement("div");
        gaugediv.className = "gaugeblock";
        gaugediv.id = fixture.uid + "_gauge";
        contentrow1.appendChild(gaugediv);
        // place gauge element inside the div
        var test = new JustGage({id: fixture.uid + "_gauge", value: 50, min: 0, max: 100, title: "Dim Level"});
        gaugesmap[fixture.uid] = test;

    }



    var contentrow2 = document.createElement("div");
    contentrow2.style = "width: 100%; height: 20px";

    var row2left = document.createElement("div");
    //row2left.className = "guagerow";
    row2left.id = fixture.uid + "_power";
    row2left.innerHTML = " ??? Watts";
    row2left.style = "width:70%; float: left";
    contentrow2.appendChild(row2left);
   // row2left.appendChild(sunbox);

    var row2right = document.createElement("div");
    row2right.style = "float: left";
    var sunbox = document.createElement("img");
    sunbox.src = "images/handtinytrans.gif";
    sunbox.height="20";
    sunbox.width="20";
    //sunbox.style = "float: right";
    daylight_limit_icon_map[fixture.uid] = sunbox;
    row2right.appendChild(sunbox);
    contentrow2.appendChild(row2right);


    fixcontent.appendChild(contentrow2);


    return fixcol;

}

function updateUIPageComponents(statusdata)
{
    for (var key in statusdata.fixtures) {
        //console.log("got status for: " + key);

        var fixobj = statusdata.fixtures[key];
        var type = fixobj.fixture.type;
        var line1 = document.getElementById(key + "_level");
        if (line1 != undefined) {

            var prefix = "";
            if (type == "on_off") {

                var imgholder = bulb_icon_map[fixobj.fixture.uid];
                if (imgholder != undefined) {
                    if (fixobj.status.currentlevels.levelpct == 0)
                        imgholder.src = "images/bulb_off.jpg";
                    else
                        imgholder.src = "images/bulb_on.jpg";
                }
            }
            else {
                var displevel = 0;
                if(type == "dim" || type == "cct")
                    displevel = fixobj.status.currentlevels.levelpct;

                if(type == "rgbw")
                    displevel = fixobj.status.currentlevels.white;

                var gauge = gaugesmap[fixobj.fixture.uid];
                gauge.refresh(displevel);
            }

        }

        var line2 = document.getElementById(key + "_power");
        if (line2 != undefined) {
            var power = fixobj.status.current * 24;
            line2.innerHTML = power.toFixed(2) + " Watts";
        }


        // 1/7/17, add dl limit icon toggle.
        var sunboxholder = daylight_limit_icon_map[fixobj.fixture.uid];
        if(sunboxholder != undefined)
        {
            if(fixobj.status.isdaylightlimited)
                sunboxholder.src = "/images/sun_1.gif";
            else
                sunboxholder.src = "/images/handtinytrans.gif";
        }

    }


    var input = 0;
    for (var key in statusdata.zero2ten) {
        var val = statusdata.zero2ten[key];
        var label = document.getElementById("input" + (input + 1));

        label.innerHTML = val.toFixed(2);
        input++;
    }

    if(statusdata.plcoutput != undefined) {
        for (var input = 0; input < statusdata.plcoutput.length; input++) {
            var label = document.getElementById("output" + (input + 1));
            var level = statusdata.plcoutput[input];
            label.innerHTML = level;
        }
    }

    if(statusdata.daylightlevelvolts != undefined)
    {
        var fc = voltageToFC(statusdata.daylightlevelvolts);
        var dllabel = statusdata.daylightlevelvolts.toFixed(2) + " V  -- " + fc;
        document.getElementById("daylightlevel").innerHTML = dllabel;
    }


    if(statusdata.wetdrycontacts != undefined)
    {
        input = 0;
        for (var key in statusdata.wetdrycontacts) {
            var level = statusdata.wetdrycontacts[key];
            var name = "wdc"+ (input+1);
            var label = document.getElementById(name);
            label.innerHTML = level;
            input++;
        }
    }

    document.getElementById("occ_state").innerHTML = statusdata.occupancy;
}



function rest_getpagedata() {
    getStatus(updateUIPageComponents);
}



function voltageToFC (volts) {

    var Zero2TenLevels =    [
        [0.0,50],
        [1.5,50],
        [2.3,50],
        [3.1,40],
        [4.9,40],
        [5.7,30],
        [6.1,20],
        [7.2,20],
        [8.5,10],
        [9.3,10]
    ];
    //  These are 10 points of calibration.  Factory defaults above but can be field calibrated
    for (var dimIndex = 0; dimIndex < Zero2TenLevels.length; dimIndex++) {
        var FCreading;
        if (volts >= Zero2TenLevels[dimIndex][0]) {
            FCreading = Zero2TenLevels[dimIndex][1];        // This will continually get reassigned until input level > the 0-10 level in array

        }
    }
    return FCreading;
}