/**
 * Created by Nick on 11/29/2016.
 */

var cachedconfig;
// periodic poll of data.
setInterval(function () {
    getConfig(updateUIPageComponents);
}, 5000);


function initStatusHandler(config)
{
    cachedconfig = config;
    var fixcountinrow = 0;
    var row = 1;
    var currentrow_div = document.getElementById("fixture_row" + row);
    for (var i = 0; i < cachedconfig.fixtures.length; i++) {
        if (fixcountinrow >= 4) {
            row++;
            currentrow_div = document.getElementById("fixture_row" + row);
        }
        var fixcol = constructFixtureBox(currentrow_div, cachedconfig.fixtures[i]);
    }
    updateUIPageComponents(undefined);


}



function initFixtureStatusBoxes() {
    getConfig(initStatusHandler);
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
    header.innerHTML = fixture.assignedname;
    fixboxheader.appendChild(header);



    var fixcontent = document.createElement("div");
    fixcontent.className = "box-content";
    fixbox.appendChild(fixcontent);


    var contentrow1 = document.createElement("div");
    contentrow1.className = "guagerow";
    contentrow1.id = fixture.assignedname + "_level";


    fixcontent.appendChild(contentrow1);

    //<div id="gauge1" class="gaugeblock"></div>
    if (fixture.type == "on_off") {
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
    fixcontent.appendChild(contentrow2);
    return fixcol;

}

function updateUIPageComponents(config)
{
    if(config != undefined)
        cachedconfig = config;

    for (var i = 0; i < cachedconfig.fixtures.length; i++) {

        var fixobj = cachedconfig.fixtures[i];
        var type = fixobj.type;
        var line1 = document.getElementById(fixobj.assignedname + "_level");
        if (line1 != undefined) {

            var prefix = "";
            if (type == "on_off") {

                var imgholder = bulb_icon_map[fixobj.assignedname];
                if (imgholder != undefined) {
                    if (fixobj.level == 0)
                        imgholder.src = "images/bulb_off.jpg";
                    else
                        imgholder.src = "images/bulb_on.jpg";
                }
            }
            else if(type == "dim")
            {
                var gauge = gaugesmap[fixobj.assignedname];
                gauge.refresh(fixobj.level);
            }
            else if(type == "cct")
            {
                var gauge = gaugesmap[fixobj.assignedname];
                gauge.refresh(fixobj.brightness);
            }
            else if(type == "rgbw") {
                displevel = fixobj.white;
                var gauge = gaugesmap[fixobj.assignedname];
                gauge.refresh(fixobj.white);
            }
        }

        var line2 = document.getElementById(fixobj.assignedname + "_power");
        if (line2 != undefined) {
            var power = fixobj.powerwatts;
            line2.innerHTML = power + " Watts";
        }

        // 1/7/17, add dl limit icon toggle.
        var sunboxholder = daylight_limit_icon_map[fixobj.assignedname];
        if(sunboxholder != undefined)
        {
            if(fixobj.daylightlimited)
                sunboxholder.src = "/images/sun_1.gif";
            else
                sunboxholder.src = "/images/handtinytrans.gif";
        }

    }


    var fc = voltageToFC(cachedconfig.daylightlevelvolts);
    var dllabel = cachedconfig.daylightlevelvolts.toFixed(2) + " V  -- " + fc;
    document.getElementById("daylightlevel").innerHTML = dllabel;

    document.getElementById("occ_state").innerHTML = cachedconfig.occupiedstate;


    updateLevelInputsTable();
    updateWetDryContactTable();
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




function updateLevelInputsTable() {

    var levelinputlist = cachedconfig.levelinputs;

    var oTable = document.getElementById("levelinputstable");
    oTable.innerHTML = ""; //blank out table,

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3, oCell4, i;

    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Name";
    oCell2 = document.createElement("TD");
    oCell2.innerHTML = "Type";
    oCell3 = document.createElement("TD");
    oCell3.innerHTML = "Interface";
    oCell4 = document.createElement("TD");
    oCell4.innerHTML = "Level (volts)";

    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oRow.appendChild(oCell3);
    oRow.appendChild(oCell4);
    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-2";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    oTable.appendChild(oTHead);
    oTable.appendChild(oTColGrp);
    oTable.appendChild(oTBody);

    // Insert rows and cells into bodies.
    if(levelinputlist != undefined) {
        for (i = 0; i < levelinputlist.length; i++) {
            var oBody = oTBody;
            oRow = document.createElement("TR");
            oBody.appendChild(oRow);

            var col1part = document.createElement("TD");
            col1part.innerHTML = levelinputlist[i].assignedname;

            var col2part = document.createElement("TD");
            col2part.innerHTML = levelinputlist[i].type;

            var col3part = document.createElement("TD");
            col3part.innerHTML = levelinputlist[i].interface;

            var col4part = document.createElement("TD");
            col4part.innerHTML = levelinputlist[i].value;
            oRow.appendChild(col1part);
            oRow.appendChild(col2part);
            oRow.appendChild(col3part);
            oRow.appendChild(col4part);
        }
    }

    $("#tableOutput").html(oTable);
   // levelinputdiv.appendChild(oTable);
}



function updateWetDryContactTable() {

    var wetdrycontactlist = cachedconfig.contactinputs;
    var oTable = document.getElementById("wetdrycontactstable");
    oTable.innerHTML = ""; //blank out table,

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3, oCell4,
        oCell5,oCell6,oCell7,oCell8, i,j;

    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Name";
    oCell2 = document.createElement("TD");
    oCell2.innerHTML = "Type";
    oCell3 = document.createElement("TD");
    oCell3.innerHTML = "Interface";
    oCell4 = document.createElement("TD");
    oCell4.innerHTML = "State";

    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oRow.appendChild(oCell3);
    oRow.appendChild(oCell4);
    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-2";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    oTable.appendChild(oTHead);
    oTable.appendChild(oTColGrp);
    oTable.appendChild(oTBody);
    // Insert rows and cells into bodies.
    if(wetdrycontactlist != undefined) {
        for (i = 0; i < wetdrycontactlist.length; i++) {
            var oBody = oTBody;
            oRow = document.createElement("TR");
            oBody.appendChild(oRow);
            var col1part = document.createElement("TD");
            col1part.innerHTML = wetdrycontactlist[i].assignedname;
            var col2part = document.createElement("TD");
            col2part.innerHTML = wetdrycontactlist[i].type;
            var col3part = document.createElement("TD");
            col3part.innerHTML = wetdrycontactlist[i].interface;
            var col4part = document.createElement("TD");
            col4part.innerHTML = wetdrycontactlist[i].value;
            oRow.appendChild(col1part);
            oRow.appendChild(col2part);
            oRow.appendChild(col3part);
            oRow.appendChild(col4part);
        }
    }

    $("#tableOutput").html(oTable);
}

