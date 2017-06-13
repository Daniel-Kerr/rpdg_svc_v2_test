/**
 * Created by Nick on 3/23/2017.
 */
// client code behind for wallstation support

//var fixtureImagePath, fixtureImagePathfound;

//var returnSceneList,returnGroupList;
// this must be the same as the html that shows these
///var mainMenuOptionDivList = ["SceneButtonArray","GroupButtonArray","FixtureButtonArray","StatusButtonArray"];
var selected_group = undefined;
var selected_fixture = undefined;
var top_menu_selection = undefined;

var rgbwsettimer; // timer used to send off override calls for rgb fixtures.
var lastrgbcolor;
var colorwheel_control;

function resizeImg(img, height, width) {
    img.height = height;
    img.width = width;
    return img;
    console.log ("resizeing image, ", img);
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

function init() {
    getConfig(processConfig);


    var cwheelvalues = "rgb(255,255,255)";
    //convert from pct back to rgb 8 bit,
    //var red = (selected_fixture.red * 255)/100;
    // var green = (selected_fixture.green * 255)/100;
    // var blue = (selected_fixture.blue * 255)/100;

    // cwheelvalues = "rgb(" + red.toFixed()+ "," + green.toFixed() + "," + blue.toFixed() + ")";

    colorwheel_control = iro.ColorWheel("#colorWheelDemo", {
        width: 300,
        height: 300,
        padding: 4,
        sliderMargin: 24,
        markerRadius: 4,
        color: cwheelvalues,
        CSS: {} // apply colors to any elements
    });

    colorwheel_control.watch(function(color) {
        startRGBWCallHWCallTimer(color);
    });
}


// RGB support

function setRGBWToHW()
{
    if(lastrgbcolor != undefined && selected_fixture != undefined) {
        var element = {};
        element.requesttype = "override";
        element.name = selected_fixture.assignedname;
        element.red = ((lastrgbcolor.rgb.r * 100) / 255).toFixed(0);  // convert to pct
        element.green = ((lastrgbcolor.rgb.g * 100) / 255).toFixed(0);  // convert to pct
        element.blue = ((lastrgbcolor.rgb.b * 100) / 255).toFixed(0);  // convert to pct
        element.white = 100;
        setFixtureLevel(element);
    }
}



function startRGBWCallHWCallTimer(color)
{
    // stop timer ,,
    if(rgbwsettimer != undefined)
    {
        clearTimeout(rgbwsettimer);
    }
    lastrgbcolor = color;
    rgbwsettimer = setTimeout(setRGBWToHW, 250)  //600ms,  reset,
}

// end rgb support **********************************





function processConfig(configobj) {
    cachedconfig = configobj;  // just so we can copy over groups on save.

    top_menu_selection = "Scenes";
    if(pending_menu_selection != undefined) {
        top_menu_selection = pending_menu_selection;
        pending_menu_selection = undefined;
    }
    updateDynButtonBar();





}


var pending_menu_selection = undefined;
function showOnlyTheseButtons (whichButtons) {
    // Hide all of them and then make visible the one chosen

    pending_menu_selection = whichButtons;
   // top_menu_selection = whichButtons;
    getConfig(processConfig);
    //updateDynButtonBar();
}

function updateDynButtonBar()
{
    // clear the button bar.
    var scenebuttonholder = document.getElementById("dynbuttonbar");
    scenebuttonholder.innerHTML = "";

    // clear content.
    hideDivID("BrightnessBar");
    hideDivID("CCTBar");
    hideDivID("ToggleButton");
    hideDivID("RGB_ColorWheel");
    hideDivID("StatusPage");
    hideDivID("occ_vac_holder");

    switch(top_menu_selection)
    {
        case "Scenes":
            showDivID("controlscontent","block");
            constructSceneButtons();
            break;
        case "Groups":
            showDivID("controlscontent","block");

            constructGroupButtons();
            break;
        case "Fixtures":
            showDivID("controlscontent","block");
            constructFixtureButtons();
            break;
        case "Status":

            hideDivID("controlscontent");
            constructFixtureStatusBoxs();
            updateLevelInputsTable();
            updateContactInputsTable();
            showDivID("StatusPage","inline");
          //  showDivID("levelinputsdiv","block");

            break;
        case "Config":
            //hideDivID("StatusPage");
            hideDivID("controlscontent");
            constructConfigItemsDiv();
            showDivID("ConfigPage","inline");
            break;
        default:
            break;
    }
}

function updateControlsContentRegion()
{
    showDivID("StatusPage","inline");
}


function onVacancy()
{
    var element = {};
    element.groupname = selected_group.name;
    var dataset = JSON.stringify(element);
    $.ajax({
        url: "/tester/sendvacancytogroup",
        type: 'post',
        data: dataset,
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function (series) {
        },
        error: function (xhr, ajaxOptions, thrownError) {
        }
    });
}

function onOccupancy()
{
    var element = {};
    element.groupname = selected_group.name;
    var dataset = JSON.stringify(element);
    $.ajax({
        url: "/tester/sendoccupancytogroup",
        type: 'post',
        data: dataset,
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function (series) {
        },
        error: function (xhr, ajaxOptions, thrownError) {
        }
    });
}

function constructConfigItemsDiv()
{

}

function constructSceneButtons()
{
    var scenebuttonholder = document.getElementById("dynbuttonbar");
    scenebuttonholder.innerHTML = "";
    for(var i = 0 ; i < cachedconfig.scenes.length; i++)
    {
        var sceneobj = cachedconfig.scenes[i];
        var buttonholder = document.createElement("div");
        scenebuttonholder.appendChild(buttonholder);

        var scenebutton = document.createElement("button");
        scenebutton.id = sceneobj.name;
        scenebutton.value = sceneobj.name;
        scenebutton.setAttribute('scene', sceneobj.name);
        scenebutton.onclick = function(){

            var targetscene = this.getAttribute('scene');
            var element = {};
            element.name = targetscene;
            element.requesttype = "wallstation";
            invokescene(element, function (retval) {
                if (retval != undefined)
                {
                    cachedconfig = retval;
                    // do update here.
                }
                else if (retval.error != undefined)
                    noty({text: 'Error invoking ' + retval.error, type: 'error'});
            });
        }
        buttonholder.appendChild(scenebutton);
        var btnText = document.createTextNode(sceneobj.name);
        scenebutton.appendChild(btnText);
    }
}


function getGroupByName(name)
{
    for(var i = 0 ; i < cachedconfig.groups.length; i++)
    {
        var grp = cachedconfig.groups[i];
        if(grp.name == name)
            return grp;
    }
    return undefined;
}


function getFixtureByName(name)
{
    for(var i = 0 ; i < cachedconfig.fixtures.length; i++)
    {
        var fix = cachedconfig.fixtures[i];
        if(fix.assignedname == name)
            return fix;
    }
    return undefined;
}



function constructGroupButtons()
{
    var groupbuttonholder = document.getElementById("dynbuttonbar");
    groupbuttonholder.innerHTML = "";
    for(var i = 0 ; i < cachedconfig.groups.length; i++)
    {
        var groupobj = cachedconfig.groups[i];
        var buttonholder = document.createElement("div");
        groupbuttonholder.appendChild(buttonholder);
        var groupbutton = document.createElement("button");
        groupbutton.id = groupobj.name;
        groupbutton.value = groupobj.name;
        groupbutton.setAttribute('group', groupobj.name);
        groupbutton.onclick = function(){

            var grpname = this.getAttribute('group');

            selected_group = getGroupByName(grpname);
            if(selected_group.type == "brightness")
            {
                showDivID("BrightnessBar","block");
                hideDivID("CCTBar");
            }
            else
            {
                showDivID("BrightnessBar","block");
                showDivID("CCTBar","block");
            }

            showDivID("occ_vac_holder","block");

        }
        buttonholder.appendChild(groupbutton);
        var btnText = document.createTextNode(groupobj.name);
        groupbutton.appendChild(btnText);
    }

}






function constructFixtureButtons()
{


    var groupbuttonholder = document.getElementById("dynbuttonbar");
    groupbuttonholder.innerHTML = "";

    groupbuttonholder.style.display="inline";
    for(var i = 0 ; i < cachedconfig.fixtures.length; i++)
    {
        var fixtureobj = cachedconfig.fixtures[i];
        var buttonholder = document.createElement("div");
        groupbuttonholder.appendChild(buttonholder);
        var fixbutton = document.createElement("button");
        fixbutton.id = fixtureobj.assignedname;
        fixbutton.value = fixtureobj.assignedname;
        fixbutton.setAttribute('fixture', fixtureobj.assignedname);
        fixbutton.onclick = function(){

            var fixname = this.getAttribute('fixture');
            selected_fixture = getFixtureByName(fixname);
            hideDivID("BrightnessBar");
            hideDivID("CCTBar");
            hideDivID("RGB_ColorWheel");
            hideDivID("ToggleButton");

            switch(selected_fixture.type)
            {
                case "on_off":
                    showDivID("ToggleButton","block");
                    var toggleswitch = document.getElementById("ToggleObject");
                    toggleswitch.checked = (selected_fixture.level == 100)?true:false;
                    break;
                case "dim":
                    showDivID("BrightnessBar","block");
                    //..

                    document.getElementById("brightnesssliderobject").value = selected_fixture.level;
                    break;

                case "cct":
                    showDivID("BrightnessBar","block");
                    showDivID("CCTBar","block");
                    document.getElementById("brightnesssliderobject").value = selected_fixture.brightness;

                    var min = Number(selected_fixture.min);
                    var max = Number(selected_fixture.max);
                    var range = max-min;
                    var barval2 = ((Number(selected_fixture.colortemp) - min)/range) * 100;
                  //  var ctempcalc = (min + (max-min)*(Number(value)/100));


                    var barval = barval2; //((Number(selected_fixture.colortemp) - 2000)*100) / 4500;
                   // var min = selected_fixture.min;
                   // var max = selected_fixture.max;

                    document.getElementById("CCTsliderobject").value = barval;
                    break;
                case "rgbw":
                    showDivID("RGB_ColorWheel","block");
                    // set rgb wheel to the correct value.
                    var cwheelvalues = "rgb(255,255,255)";
                    //convert from pct back to rgb 8 bit,
                    var red = (selected_fixture.red * 255)/100;
                    var green = (selected_fixture.green * 255)/100;
                    var blue = (selected_fixture.blue * 255)/100;

                    cwheelvalues = "rgb(" + red.toFixed()+ "," + green.toFixed() + "," + blue.toFixed() + ")";

                    //var k = document.getElementById("colorWheelDemo");

                    colorwheel_control.color.hexString = cwheelvalues;
                    break;
                default:
                    break;
            }
        }
        buttonholder.appendChild(fixbutton);
        var btnText = document.createTextNode(fixtureobj.assignedname);
        fixbutton.appendChild(btnText);
    }
}


function onBrightnessSliderChange(value)
{
    if(top_menu_selection == undefined)
        return;

    switch(top_menu_selection)
    {
        case "Scenes":

            break;
        case "Groups":
            if(selected_group != undefined)
            {
                if(selected_group.type == "brightness")
                {
                    var element = {};
                    element.name = selected_group.name;
                    element.level = value;
                    setGroupToLevel(element, function (retval) {
                        if (retval != undefined)
                        {
                            cachedconfig = retval;
                            constructFixtureStatusBoxs();
                            // do update here.
                        }
                        // else if (retval.error != undefined)
                        //  noty({text: 'Error invoking ' + retval.error, type: 'error'});
                    });
                }
                else if(selected_group.type == "ctemp")
                {
                    var ctempslider = document.getElementById("CCTsliderobject");

                    // per JOE H,  use any cct fixtures min / maxs to calc value to send over. well take first one in .ist
                    var defcct = getDefaultCCTFixture();
                    var min = 3000;
                    var max = 6500;
                    if(defcct != undefined)
                    {
                        min = Number(defcct.min);
                        max = Number(defcct.max);
                    }
                    var ctempcalc = (min + (max-min)*(Number(ctempslider.value)/100));


                    var element = {};
                    element.name = selected_group.name;
                    element.ctemp = ctempcalc;
                    element.brightness = value;
                    setGroupToColorTemp(element, function (retval) {
                        if (retval != undefined)
                        {
                            cachedconfig = retval;
                            constructFixtureStatusBoxs();
                            // do update here.
                        }
                        // else if (retval.error != undefined)
                        //  noty({text: 'Error invoking ' + retval.error, type: 'error'});
                    });
                }
            }
            break;
        case "Fixtures":

            switch(selected_fixture.type)
            {
                case "on_off":

                    break;
                case "dim":
                    var element = {};
                    element.requesttype = "wallstation";
                    element.name =  selected_fixture.assignedname;
                    element.level = value;
                    setFixtureLevel(element);
                    break;
                case "cct":
                    var element = {};
                    element.requesttype = "wallstation";
                    element.name = selected_fixture.assignedname;
                    element.brightness = value;
                    var ctempslider = document.getElementById("CCTsliderobject");
                    element.ctemp = ctempslider.value;;
                    setFixtureLevel(element);
                    break;
                case "rgbw":
                    break;
                default:
                    break;

            }
            break;


        default:
            break;
    }
}


function onToggleButtonChange(value)
{
    switch(top_menu_selection)
    {
        case "Fixtures":

            if(selected_fixture != undefined && selected_fixture.type == "on_off")
            {
                var element = {};
                element.requesttype = "wallstation";
                element.name =  selected_fixture.assignedname;
                element.level = (value)?100:0;
                setFixtureLevel(element);
            }
            break;
        default:
            break;

    }
}



function processUpdatedConfig()
{
    constructFixtureStatusBoxs();
  //  constructFixtureButtons();
}


function postSetFixtureHandler(config)
{
    if (config != null) {
        cachedconfig = config;
        constructFixtureStatusBoxs();
    }
}

function setFixtureLevel(element)
{
    setFixtureLevel2(element,postSetFixtureHandler);
}

function onCCTSliderChange(value)
{
    if(top_menu_selection == undefined)
        return;

    switch(top_menu_selection)
    {
        case "Scenes":
            var k = 0;
            k = k + 1;
            break;
        case "Groups":
            if(selected_group != undefined)
            {
                if(selected_group.type == "ctemp")
                {
                    var brightslider = document.getElementById("brightnesssliderobject");
                    var bright = brightslider.value;
                    var element = {};
                    element.name = selected_group.name;


                    // per JOE H,  use any cct fixtures min / maxs to calc value to send over. well take first one in .ist
                    var defcct = getDefaultCCTFixture();
                    var min = 3000;
                    var max = 6500;
                    if(defcct != undefined)
                    {
                        min = Number(defcct.min);
                        max = Number(defcct.max);
                    }
                    var ctempcalc = (min + (max-min)*(Number(value)/100));

                    element.ctemp =  ctempcalc; //(2000 + (4500*value/100));
                    element.brightness = bright;

                    setGroupToColorTemp(element, function (retval) {
                        if (retval != undefined)
                        {
                            cachedconfig = retval;
                            constructFixtureStatusBoxs();
                        }
                        // else if (retval.error != undefined)
                        //  noty({text: 'Error invoking ' + retval.error, type: 'error'});
                    });
                }
            }
            break;
        case "Fixtures":
            switch(selected_fixture.type)
            {
                case "cct":
                    var element = {};
                    element.requesttype = "wallstation";
                    element.name = selected_fixture.assignedname;
                    element.brightness = document.getElementById("brightnesssliderobject").value;

                    var min = Number(selected_fixture.min);
                    var max = Number(selected_fixture.max);
                    var ctempcalc = (min + (max-min)*(Number(value)/100));


                    element.colortemp = ctempcalc; //(2000 + (4500*value/100));
                    setFixtureLevel(element);
                    break;
                default:
                    break;

            }
            break;

        default:
            break;
    }
}




function constructFixtureStatusBoxs()
{

    for(var k = 1; k <= 8; k++)
    {
        var div = document.getElementById("StatusBlock"+(k));
        div.innerHTML = ""; // = 0;
    }


    for (var i = 0 ; i < cachedconfig.fixtures.length; i++) {
        var fixobj = cachedconfig.fixtures[i];
        var divID = "StatusBlock"+(i+1);

        var level = undefined;
        var colortemp = undefined;
        switch(fixobj.type)
        {
            case "on_off":
            case "dim":
                level = Number(fixobj.level).toFixed(0);
                break;
            case "cct":
                colortemp = fixobj.colortemp;
                level = Number(fixobj.brightness).toFixed(0);
                break;

            case "rgbw":
                break;

            default:
                break;
        }

        createFixtureStatusTable(divID,fixobj.assignedname,fixobj.type,fixobj.image,
            fixobj.powerwatts,level,colortemp,fixobj.daylightlimited);

    }  // end fixture for loop ,

}


function createFixtureStatusTable(divID,fixtureName,fixtureType,fixtureImage,fixturePower,fixtureLevel,fixtureCCT, fixtureDLLimited) {
    // Declare global variables and create the header, footer, and caption.
   // console.log ("fixture image  is ", fixtureImage);
    var oTable = document.createElement("TABLE");
    var oTHead = document.createElement("TH");
    var oRow1 = document.createElement("TR");
    var oRow2 = document.createElement("TR");
    var oRow3 = document.createElement("TR");
    var oTDpicture = document.createElement("TD");
    var oTDdimlevel = document.createElement("TD");
    var oTDcctstatus = document.createElement("TD");
    var oTDpowerlevel = document.createElement("TD");
    var oTDdaylight = document.createElement("TD");
    var oTDempty = document.createElement("TD");

    oTHead.innerHTML = fixtureName;
    oTHead.style.backgroundColor = "darkgrey";
    oTHead.style.textAlign = "center";
    oTHead.colspan = "7";
    oTHead.rowspan = "1";


    oTDpicture.innerHTML = "Picture";
    oTDpicture.className = "picturediv";
    var img = document.createElement('img');
    img.src = fixtureImage;
    img.style.width = "120px";
    img.style.height = "120px";
    //img.style.paddingRight = "10px";
    oTDpicture.appendChild(img);
    oTDpicture.id = "pic_" + fixtureName;

    oTDdimlevel.innerHTML = "Level";
    oTDdimlevel.className = "dimleveldiv";
    var para = document.createElement("H2");                       // Create a <p> element
    if (fixtureType != "rgbw") {
        var p = document.createTextNode(fixtureLevel+ "%");}
    else { var p = document.createTextNode("N/A");   }
    para.appendChild(p);
    oTDdimlevel.appendChild(para);
    oTDdimlevel.id = "level_" + fixtureName;

    //console.log ("fixtureType was ", fixtureType);
    oTDcctstatus.innerHTML = "CCT Level ";
    oTDcctstatus.className = "cctstatusdiv";
    var para = document.createElement("H3");
    if (fixtureType == "cct") {
        var p = document.createTextNode(fixtureCCT+ "K");  }
    else { var p = document.createTextNode("N/A");  }
    para.appendChild(p);
    oTDcctstatus.appendChild(para);
    oTDcctstatus.id = "ctemp_" + fixtureName;

    oTDpowerlevel.innerHTML = "Power Level";
    var para = document.createElement("H1");                       // Create a <p> element
    var p = document.createTextNode(fixturePower+ " W");
    para.appendChild(p);
    oTDpowerlevel.appendChild(para);
    oTDpowerlevel.className = "powerleveldiv";

    oTDpowerlevel.id = "power_" + fixtureName;

    oTDdaylight.innerHTML = "Daylight Limited";
    oTDdaylight.className = "daylightdiv";
    var img = document.createElement('img');
    if (fixtureDLLimited) {
        img.src = "images/sun40x40.jpg";
    } else {img.src = "/images/handtinytrans.gif"}
    oTDdaylight.appendChild(img);
    oTDdaylight.id = "dl_" + fixtureName;

//Build the table smallest element to biggest
    oRow1.appendChild(oTDpicture);
    oRow1.appendChild(oTDdimlevel);
    oRow1.appendChild(oTDpowerlevel);

    oRow2.appendChild(oTDcctstatus);

    oRow2.appendChild(oTDempty);
    oRow2.appendChild(oTDdaylight);

    oTHead.appendChild(oRow1);
    oTHead.appendChild(oRow2);
    oTable.appendChild(oTHead);
    var x = document.getElementById(divID);
    x.appendChild(oTable);


}

// **************************** END NEW CODE *********************************************


// START OLD CODE ***********************


function showDivID (DivID, how) {
    var elem=document.getElementById(DivID);
    elem.style.display=how;
}
function hideDivID (DivID) {
    var elem=document.getElementById(DivID);
    elem.style.display="none";
}





function SetDaylightPolling () {

    var selection = $('#daylightpoll').val();
   // console.log ("seconds are: ", selection);
    var element = {};
    element.interval = selection;
    var dataset = JSON.stringify(element);
    //console.log ("Sending daylight polling request", dataset);
    $.ajax({
        url: "/tester/setdaylighttimerinterval",
        type: 'post',
        data: dataset,
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function (series) {
        },
        error: function (xhr, ajaxOptions, thrownError) {
        }
    });
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

    oTHead.style.backgroundColor = "darkgrey";
    oTBody.style.backgroundColor = "white";

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
                var fc = voltageToFC(levelinputlist[i].value);
                val = levelinputlist[i].value  + " Volts  /  " + fc + " (FC)";
            }
            else if(levelinputlist[i].interface == "enocean") {
                val = levelinputlist[i].value  + " LUX";
            }

            var col4part = document.createElement("TD");
            col4part.innerHTML = val;



            oRow.appendChild(col1part);
            oRow.appendChild(col2part);
            oRow.appendChild(col3part);
            oRow.appendChild(col4part);
        }
    }

   // $("#tableOutput").html(oTable);
     document.getElementById("levelinputsdiv").appendChild(oTable);
}




function updateContactInputsTable() {

    var contactinputlist = cachedconfig.contactinputs;

    var oTable = document.getElementById("contactinputstable");
    oTable.innerHTML = ""; //blank out table,

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3, oCell4, i;

    oTHead.style.backgroundColor = "darkgrey";
    oTBody.style.backgroundColor = "white";

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
    if(contactinputlist != undefined) {
        for (i = 0; i < contactinputlist.length; i++) {
            var oBody = oTBody;
            oRow = document.createElement("TR");
            oBody.appendChild(oRow);

            var col1part = document.createElement("TD");
            col1part.innerHTML = contactinputlist[i].assignedname;

            var col2part = document.createElement("TD");
            col2part.innerHTML = contactinputlist[i].type;

            var col3part = document.createElement("TD");
            col3part.innerHTML = contactinputlist[i].interface;

            var val = "";
            val = contactinputlist[i].value;

            var col4part = document.createElement("TD");
            col4part.innerHTML = val;

            oRow.appendChild(col1part);
            oRow.appendChild(col2part);
            oRow.appendChild(col3part);
            oRow.appendChild(col4part);
        }
    }

    document.getElementById("contactinputsdiv").appendChild(oTable);
}


function getDefaultCCTFixture()
{
    if(cachedconfig != undefined)
    {
        for(var i = 0; i < cachedconfig.fixtures.length; i++)
        {
            var fix = cachedconfig.fixtures[i];
            if(fix.type == "cct")
                return fix;
        }
    }
    return undefined;
}