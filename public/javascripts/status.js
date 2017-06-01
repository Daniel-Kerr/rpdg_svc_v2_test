/**
 * Created by Nick on 11/29/2016.
 */

var cachedconfig;
var gaugesmap = {};
var bulb_icon_map = {};
var daylight_limit_icon_map = {};

// periodic poll of data.
setInterval(function () {
    getConfig(updateUIPageComponents);
}, 5000);


$(document).ready(function() {
    initFixtureStatusBoxes();
});

function initStatusHandler(config)
{
    cachedconfig = config;
    constructFixtureStatusBoxes();
    updateUIPageComponents(undefined);
}


function initFixtureStatusBoxes() {
    getConfig(initStatusHandler);

    getVersion(function(ver) {
        document.getElementById("version").innerHTML = ver.controller + " / " + ver.firmware;
    })
}

function updateUIPageComponents(config)
{
    if(config != undefined)
        cachedconfig = config;

    for (var i = 0 ; i < cachedconfig.fixtures.length; i++) {
        var fixobj = cachedconfig.fixtures[i];
        updateFixtureStatusBox(fixobj,i);
    }

    var fc = voltageToFC(cachedconfig.daylightlevelvolts);
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
    oCell4.innerHTML = "Level";

    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oRow.appendChild(oCell3);
    oRow.appendChild(oCell4);
    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-3";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-2";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-2";
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

            var units = "";
            var val = "";
            if(levelinputlist[i].interface == "rpdg") {

                if(levelinputlist[i].type == "dimmer")
                {
                    val = levelinputlist[i].value + " Volts";
                }
                else {

                    var fc = voltageToFC(levelinputlist[i].value);
                    val = levelinputlist[i].value + " Volts  /  " + fc + " (FC)";
                }
            }
            else if(levelinputlist[i].interface == "enocean") {
               // val = levelinputlist[i].value  + " LUX";
                var fc = voltageToFC(levelinputlist[i].value);
                val = levelinputlist[i].value + " Volts  /  " + fc + " (FC)";
            }

            var col4part = document.createElement("TD");
            col4part.innerHTML = val;



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




// ***********************************************************************************************************
// ******************************************** 5/26/17 **************************** new fixture status boxes
// ***********************************************************************************************************

function removeElement(id) {
    var elem = document.getElementById(id);
    if(elem != undefined)
        return elem.parentNode.removeChild(elem);
}

function constructFixtureStatusBoxes()
{
    var currentrow_div = document.getElementById("fixture_row1");
    currentrow_div.innerHTML = "";
    for (var i = 0; i < cachedconfig.fixtures.length; i++) {
        constructFixtureStatusBox(currentrow_div, cachedconfig.fixtures[i],i);
    }
}


function constructFixtureStatusBox(currentdiv, fixture, index) {
    removeElement("fix"+index);
    var fixcol = document.createElement("div");
    fixcol.className = "col-sm-4";
    currentdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "card-box";
    fixbox.id = "fix"+index;

    fixcol.appendChild(fixbox);

    updateFixtureStatusBox(fixture,index);
}

function updateFixtureStatusBox(fixture, index)
{
    var cardboxdiv = document.getElementById("fix"+index);
    if(cardboxdiv != undefined)
    {

        cardboxdiv.innerHTML = "";
        var header = document.createElement("h4");
        header.className = "text-dark  header-title m-t-0 m-b-10";
        header.innerHTML = fixture.assignedname;
        cardboxdiv.appendChild(header);

        var fixcontent = document.createElement("div");
        fixcontent.className = "contentholder";
        cardboxdiv.appendChild(fixcontent);

        var statleft = document.createElement("div");
        statleft.className = "status_left";
        fixcontent.appendChild(statleft);

        var statright = document.createElement("div");
        statright.className = "status_right";
        fixcontent.appendChild(statright);

        var image_hold = document.createElement("div");
        image_hold.className = "imagehold";
        statleft.appendChild(image_hold);

        var power_hold = document.createElement("div");
        power_hold.className = "powerhold";
        statleft.appendChild(power_hold);

        var lbval = document.createElement("label");
        lbval.innerHTML = fixture.powerwatts + " Watts";
        lbval.className = "powerlabel";
        power_hold.appendChild(lbval);


        var daylight_hold = document.createElement("div");
        daylight_hold.className = "daylighthold";
        statleft.appendChild(daylight_hold);


        if(fixture.daylightlimited) {
            var image = document.createElement("img");
            image.src = "images/sun_1.gif";
            image.style.marginTop = "5px";
            image.width = "40";
            image.height = "40";
            daylight_hold.appendChild(image);
        }

        var image = document.createElement("img");
        image.src = fixture.image; //"fixtureimg/1.jpg";
        image.width = "100";
        image.height = "100";
        image_hold.appendChild(image);

        if(fixture.type == "on_off" || fixture.type == "dim")
            constructDimmableIndicators(statright,fixture.level);
        else if(fixture.type == "cct")
            constructColorTempIndicators(statright, fixture.brightness, fixture.colortemp, fixture.min, fixture.max);
        else if(fixture.type == "rgbw")
            constructRGBWndicators(statright, fixture.red,fixture.green,fixture.blue,fixture.white);

    }
}


function constructDimmableIndicators(parentdiv, brightpct)
{
    constructBasicLevelIndicator(parentdiv,100,190,brightpct,"level_bar", brightpct+"%");
}

function constructColorTempIndicators(parentdiv, brightpct, colortemplevel, ctempmin, ctempmax)
{
    constructBasicLevelIndicator(parentdiv,50,190,brightpct,"level_bar", brightpct+"%");
    // calc ctemp as pct
    var min = Number(ctempmin);
    var max = Number(ctempmax);
    var range = max-min;
    var barval2 = ((Number(colortemplevel) - min)/range) * 100;
    constructBasicLevelIndicator(parentdiv,50,190,barval2,"color_temp_bar", colortemplevel+"K");
}



function constructRGBWndicators(parentdiv, red, green, blue, white)
{
    constructBasicLevelIndicator(parentdiv,20,190,red,"red_bar", red);
    constructBasicLevelIndicator(parentdiv,20,190,green,"green_bar", green);
    constructBasicLevelIndicator(parentdiv,20,190,blue,"blue_bar", blue);
    constructBasicLevelIndicator(parentdiv,20,190,white,"white_bar", white);
}


function constructBasicLevelIndicator(parentdiv, width, height, pct, barclass, labelval )
{
    // main wrapper is 200px,
    // level holder is 190 px high,
    var holder = document.createElement("div");
    holder.className = "level_holder";
    holder.style.width =  width+"px";
    holder.style.height =  height+"px";
    parentdiv.appendChild(holder);

    var bar = document.createElement("div");
    bar.className = barclass;
    var bar_height = height-20;
    bar.style.height =  bar_height+"px";  //
    holder.appendChild(bar);

    var label = document.createElement("div");
    label.className = "level_label";
    label.style.width = width+"px";
    holder.appendChild(label);

    var lbval = document.createElement("label");
    lbval.innerHTML = labelval;
    label.appendChild(lbval);

    var mark = document.createElement("div");
    mark.className = "level_mark";
    var bla = bar_height - ((pct * bar_height)/ 100);
    mark.style.marginTop =  bla + "px"; //"90px";  //set level mark,, calc. based on 150 tall,
    mark.style.width =  width+"px";
    bar.appendChild(mark);


}


