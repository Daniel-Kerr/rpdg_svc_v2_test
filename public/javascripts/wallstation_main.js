/**
 * Created by Nick on 3/23/2017.
 */
var selected_group = undefined;
var selected_fixture = undefined;
var top_menu_selection = undefined;

var rgbwsettimer; // timer used to send off override calls for rgb fixtures.
var lastrgbcolor;
var colorwheel_control;
var pending_menu_selection = undefined;

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


function showOnlyTheseButtons (whichButtons) {
    // Hide all of them and then make visible the one chosen
    pending_menu_selection = whichButtons;
    getConfig(processConfig);
}

function updateDynButtonBar()
{
    // clear the button bar.
    var scenebuttonholder = document.getElementById("dynbuttonbar");
    scenebuttonholder.innerHTML = "";

    hideDivID("StatusPage");
    hideDivID("dynbuttonbar");
    hideDivID("controls");
    hideDivID("ConfigPage");
    cancelStatusFetchTimer();
    switch(top_menu_selection)
    {
        case "Scenes":
            showDivID("dynbuttonbar","inline");
            constructSceneButtons();
            break;
        case "Groups":
            showDivID("controls","inline");
            showDivID("dynbuttonbar","inline");
            constructGroupButtons();
            break;
        case "Fixtures":
            showDivID("controls","inline");
            showDivID("dynbuttonbar","inline");
            constructFixtureButtons();
            break;
        case "Status":

            constructFixtureStatusBoxes();
            constructLevelInputStatusBox();
            constructContactInputStatusBox();
            showDivID("StatusPage","inline");
            startStatusFetchTimer();
            break;
        case "Config":
            // constructConfigItemsDiv();
            showDivID("ConfigPage","inline");
            break;
        default:
            break;
    }
}

var statusfetch_timer = undefined;

function startStatusFetchTimer()
{
    statusfetch_timer = setInterval(function () {

        getConfig(function(cfgdata){

            if (cfgdata != null) {
                cachedconfig = cfgdata;
                for (var i = 0 ; i < cachedconfig.fixtures.length; i++) {
                    var fixobj = cachedconfig.fixtures[i];
                    updateFixtureStatusBox(fixobj,i);
                }

                // update level status.
                updateLevelInputStatusBox();

                updateContactInputStatusBox();
                //()

            }
        });



        }, 5000);
}

function cancelStatusFetchTimer()
{
    if(statusfetch_timer != undefined)
    {
        clearInterval(statusfetch_timer);
        statusfetch_timer = undefined;
    }
}
//function updateControlsContentRegion()
//{
//   showDivID("StatusPage","inline");
//}


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

function constructSceneButtons()
{
    var scenebuttonholder = document.getElementById("dynbuttonbar");
    scenebuttonholder.innerHTML = "";
    for(var i = 0 ; i < cachedconfig.scenes.length; i++)
    {

        var hdiv = document.createElement("div");
        hdiv.className ="col-xs-4 col-sm-6 col-md-2 col-lg-2 top-buffer"; //"col-lg-1";


        var sceneobj = cachedconfig.scenes[i];
        var scenebutton = document.createElement("input");
        scenebutton.id = sceneobj.name;
        scenebutton.value = sceneobj.name;
        scenebutton.type = "button";
        scenebutton.className = "btn btn-large btn-success";
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

        hdiv.appendChild(scenebutton);
        scenebuttonholder.appendChild(hdiv);

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
    var ctrlsholder = document.getElementById("controls");
    ctrlsholder.innerHTML = ""; // blank it out.
    for(var i = 0 ; i < cachedconfig.groups.length; i++)
    {
        var hdiv = document.createElement("div");
        hdiv.className ="col-xs-4 col-sm-6 col-md-2 col-lg-2 top-buffer";

        var groupobj = cachedconfig.groups[i];
        var groupbutton = document.createElement("input");
        groupbutton.id = groupobj.name;
        groupbutton.value = groupobj.name;
        groupbutton.type = "button";
        groupbutton.className = "btn btn-large btn-success";
        groupbutton.setAttribute('group', groupobj.name);
        groupbutton.onclick = function(){

            var grpname = this.getAttribute('group');

            var ctrlsholder = document.getElementById("controls");
            ctrlsholder.innerHTML = ""; // blank it out.


            selected_group = getGroupByName(grpname);
            if(selected_group.type == "brightness")
            {
                constructBrightnessBar(ctrlsholder, false);

            }
            else
            {
                constructBrightnessBar(ctrlsholder, false);
                constructColorTempBar(ctrlsholder,false);
            }

            //  showDivID("occ_vac_holder","block");


            $('input[type="range"]').rangeslider({
                polyfill : false,
                rangeClass: 'custom_slider_range',
                fillClass: 'custom_slider_fill',
                onInit : function() {

                },
                onSlide : function( position, value ) {

                    if(selected_group.type == "brightness") {

                        var brightval = document.getElementById("brightctrl").value;
                        document.getElementById("brightvalue").innerHTML = brightval;

                        var element = {};
                        element.name = selected_group.name;
                        element.level = brightval;
                        setGroupToLevel(element, function (retval) {
                            if (retval != undefined) {
                                cachedconfig = retval;
                            }
                        });

                    }
                    else
                    {
                        // color temp val change.
                        var ctempvalpct = document.getElementById("colortempctrl").value;
                        var brightval = document.getElementById("brightctrl").value;

                        var min = Number(2700);
                        var max = Number(6500);
                        var ctempcalc = (min + (max-min)*(Number(ctempvalpct)/100));
                        document.getElementById("colortempvalue").innerHTML = ctempcalc + " K";
                        document.getElementById("brightvalue").innerHTML = brightval;

                        var element = {};
                        element.name = selected_group.name;
                        element.ctemp = ctempcalc;
                        element.brightness = brightval;  // this is ignored....
                        setGroupToColorTemp(element, function (retval) {
                            if (retval != undefined)
                            {
                                cachedconfig = retval;
                            }

                        });
                    }
                }
            });

        }

        hdiv.appendChild(groupbutton);
        groupbuttonholder.appendChild(hdiv);
    }

}


function constructFixtureButtons()
{

    var groupbuttonholder = document.getElementById("dynbuttonbar");
    groupbuttonholder.innerHTML = "";

    var ctrlsholder = document.getElementById("controls");
    ctrlsholder.innerHTML = ""; // blank it out.

    for(var i = 0 ; i < cachedconfig.fixtures.length; i++)
    {
        var fixtureobj = cachedconfig.fixtures[i];
        var buttonholder = document.createElement("div");
        buttonholder.className = "col-xs-4 col-sm-6 col-md-2 col-lg-2 top-buffer";



        var buttonframe = document.createElement("div");
        buttonframe.className = "button_frame";

        buttonholder.appendChild(buttonframe);

        groupbuttonholder.appendChild(buttonholder);
        var fixbutton = document.createElement("input");
        fixbutton.id = fixtureobj.assignedname;
        fixbutton.value = fixtureobj.assignedname;
        fixbutton.type = "button";
        fixbutton.className = "btn btn-large btn-success";
        fixbutton.setAttribute('fixture', fixtureobj.assignedname);
        fixbutton.setAttribute('index', i);

        fixbutton.onclick = function(){


            var ctrlsholder = document.getElementById("controls");
            ctrlsholder.innerHTML = ""; // blank it out.


            var fixname = this.getAttribute('fixture');
            var idx = this.getAttribute('index');
            selected_fixture = getFixtureByName(fixname);

            constructFixtureStatusBox(ctrlsholder, selected_fixture, idx );  //status box

            if(selected_fixture.type == "on_off")
            {
                constructONOFFCtrl(ctrlsholder);
            }

            if(selected_fixture.type == "dim" || selected_fixture.type == "cct") {
                constructBrightnessBar(ctrlsholder,true);
            }

            if(selected_fixture.type == "cct") {
                constructColorTempBar(ctrlsholder,true);
            }

            if(selected_fixture.type == "rgbw")
            {
                constructColorWheelControl(ctrlsholder);
            }


            $('input[type="range"]').rangeslider({
                polyfill : false,
                rangeClass: 'custom_slider_range',
                fillClass: 'custom_slider_fill',
                onInit : function() {
                    //  this.output = $( '<div class="range-output" />' ).insertAfter( this.$range ).html( this.$element.val() );
                },
                onSlide : function( position, value ) {
                    //  this.output.html( value );
                    // var k = $("brightctrl");
                    if(this.$element[0].id == "brightctrl")
                    {
                        document.getElementById("brightvalue").innerHTML = this.value;

                        if (selected_fixture.type == "dim") {
                            var element = {};
                            element.requesttype = "wallstation";
                            element.name = selected_fixture.assignedname;
                            element.level = this.value;
                            setFixtureLevel(element);
                        }
                        else if (selected_fixture.type == "cct") {
                            var element = {};
                            element.requesttype = "wallstation";
                            element.name = selected_fixture.assignedname;
                            element.brightness = this.value;
                            var ctempslider = document.getElementById("colortempctrl");
                            if(ctempslider != undefined) {

                                // convert pct to ctemp.
                                var min = Number(selected_fixture.min); //selected_fixture.min);
                                var max = Number(selected_fixture.max); //.max);
                                var ctempcalc = (min + (max-min)*(Number(ctempslider.value)/100));
                                element.ctemp = ctempcalc;
                                setFixtureLevel(element);
                            }
                        }
                    }
                    else
                    {
                        var min = Number(selected_fixture.min); //selected_fixture.min);
                        var max = Number(selected_fixture.max); //.max);
                        var ctempcalc = (min + (max-min)*(Number(this.value)/100));
                        document.getElementById("colortempvalue").innerHTML = ctempcalc + " K";

                        var element = {};
                        element.requesttype = "wallstation";
                        element.name = selected_fixture.assignedname;
                        element.brightness = document.getElementById("brightctrl").value;

                        element.colortemp = ctempcalc; //(2000 + (4500*value/100));
                        setFixtureLevel(element);
                    }

                }
            });



        }


        buttonframe.appendChild(fixbutton);
        var btnText = document.createTextNode(fixtureobj.assignedname);
        fixbutton.appendChild(btnText);
    }
}


function postSetFixtureHandler(config)
{
    if (config != null) {
        cachedconfig = config;

        for (var i = 0 ; i < cachedconfig.fixtures.length; i++) {
            var fixobj = cachedconfig.fixtures[i];

            updateFixtureStatusBox(fixobj,i);
        }

    }
}

function setFixtureLevel(element)
{
    setFixtureLevel2(element,postSetFixtureHandler);
}


// **********************************************************************


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

/*
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
*/


function removeElement(id) {
    var elem = document.getElementById(id);
    if(elem != undefined)
        return elem.parentNode.removeChild(elem);
}

function removeAllFixStatusBoxes()
{
    for (var i = 0; i < cachedconfig.fixtures.length; i++) {
        removeElement("fix"+i);
    }
}


function constructFixtureStatusBoxes()
{
    //  removeAllFixStatusBoxes();
    var currentrow_div = document.getElementById("StatusPage");
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
        var powerlevel = "";
        if(fixture.interfacename == "rpdg-pwm") // && boardtype == "LV") // && board is type lv. )
        {
            powerlevel = fixture.powerwatts + " Watts";
        }
        lbval.innerHTML = powerlevel;
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
            constructColorTempIndicators(statright, fixture.brightness, fixture.colortemp, fixture.min,fixture.max);
        else if(fixture.type == "rgbw")
            constructRGBWndicators(statright, fixture.red,fixture.green,fixture.blue,fixture.white);

    }
}


function constructDimmableIndicators(parentdiv, brightpct)
{
    constructBasicLevelIndicator(parentdiv,100,190,brightpct,"level_bar", brightpct+"%");
}

/*function constructColorTempIndicators(parentdiv, brightpct, colortemplevel)
{
    constructBasicLevelIndicator(parentdiv,50,190,brightpct,"level_bar", brightpct+"%");
    // calc ctemp as pct
    var min = Number(2700);
    var max = Number(6500);
    var range = max-min;
    var barval2 = ((Number(colortemplevel) - min)/range) * 100;
    constructBasicLevelIndicator(parentdiv,50,190,barval2,"color_temp_bar", colortemplevel+"K");
}  */



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





function constructONOFFCtrl(currentdiv) {
    var fixcol = document.createElement("div");
    fixcol.className = "col-md-8";
    currentdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "card-box";
    fixcol.appendChild(fixbox);

    var header = document.createElement("h4");
    header.className = "text-dark  header-title m-t-0 m-b-10";
    header.innerHTML = "Toggle Switch";
    fixbox.appendChild(header);

    var content = document.createElement("div");
    // guageholder.className = "guage_holder";
    fixbox.appendChild(content);

    var lbval = document.createElement("label");
    lbval.innerHTML = "OFF";
    content.appendChild(lbval);

    var on_off_toggle = document.createElement("input");
    on_off_toggle.type = "checkbox";
    on_off_toggle.className="js-switch";


    on_off_toggle.onchange = function() {

        var level = (this.checked)?100:0;

        if (selected_fixture.type == "on_off") {
            var element = {};
            element.requesttype = "wallstation";
            element.name = selected_fixture.assignedname;
            element.level = level;
            setFixtureLevel(element);
        }

    }

    on_off_toggle.checked = (selected_fixture.level == 100);

    content.appendChild(on_off_toggle);

    var elem = document.querySelector('.js-switch');
    var switchery = new Switchery(elem, { color: '#0099ff' , secondaryColor: '#0099ff'});

    var lbval = document.createElement("label");
    lbval.innerHTML = "ON";
    content.appendChild(lbval);
}



function constructBrightnessBar(currentdiv, forfixture) {
    var fixcol = document.createElement("div");
    fixcol.className = "col-md-8";
    currentdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "card-box";
    fixcol.appendChild(fixbox);

    var header = document.createElement("h4");
    header.className = "text-dark  header-title m-t-0 m-b-10";
    header.innerHTML = "BRIGHTNESS";
    fixbox.appendChild(header);

    var bright_grad = document.createElement("div");
    bright_grad.className = "brightness_grad";
    fixbox.appendChild(bright_grad);

    var guageholder = document.createElement("div");
    guageholder.className = "guage_holder";
    bright_grad.appendChild(guageholder);

    var bright_guage = document.createElement("input");
    bright_guage.type = "range";
    bright_guage.id = "brightctrl";

    guageholder.appendChild(bright_guage);

    var bright_val = document.createElement("div");
    bright_val.className = "guage_value";
    fixbox.appendChild(bright_val);

    var header = document.createElement("h3");
    header.className = "text-primary counter";
    header.style.textAlign = "center";
    header.id = "brightvalue";
    header.innerHTML = "44";
    bright_val.appendChild(header);

    if(forfixture) {
        if (selected_fixture.type == "dim") {
            bright_guage.value = selected_fixture.level;
            header.innerHTML = selected_fixture.level;
        }
        else {
            bright_guage.value = selected_fixture.brightness;
            header.innerHTML = selected_fixture.brightness;
        }
    }
    else
    {
        bright_guage.value = 50;
        header.innerHTML = 50;
    }
}

function constructColorTempBar(currentdiv, forfixture) {
    var fixcol = document.createElement("div");
    fixcol.className = "col-md-8";
    currentdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "card-box";
    fixcol.appendChild(fixbox);

    var header = document.createElement("h4");
    header.className = "text-dark  header-title m-t-0 m-b-10";
    header.innerHTML = "COLOR TEMPERATURE";
    fixbox.appendChild(header);

    var bright_grad = document.createElement("div");
    bright_grad.className = "ctemp_grad";
    fixbox.appendChild(bright_grad);

    var guageholder = document.createElement("div");
    guageholder.className = "guage_holder";
    bright_grad.appendChild(guageholder);

    var ctemp_guage = document.createElement("input");
    ctemp_guage.type = "range";
    ctemp_guage.id = "colortempctrl";

    guageholder.appendChild(ctemp_guage);

    var bright_val = document.createElement("div");
    bright_val.className = "guage_value";
    fixbox.appendChild(bright_val);

    var header = document.createElement("h3");
    header.className = "text-primary counter";
    header.style.textAlign = "center";
    header.id = "colortempvalue";
    header.innerHTML = "3500";
    bright_val.appendChild(header);


    // init
    // ctemp to pct, ref only.


    if(forfixture) {
        var min = Number(selected_fixture.min);
        var max = Number(selected_fixture.max);
        var range = max - min;
        var barval2 = ((Number(selected_fixture.colortemp) - min) / range) * 100;


        ctemp_guage.value = barval2;
        header.innerHTML = selected_fixture.colortemp;
    }
    else
    {
        var range = 6500 - 3500;
        var barval2 = ((Number(3500) - 2700) / range) * 100;
        ctemp_guage.value = barval2;
        header.innerHTML = 3500;
    }

}



function constructColorWheelControl(currentdiv) {
    var fixcol = document.createElement("div");
    fixcol.className = "col-md-8";
    currentdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "card-box";
    fixcol.appendChild(fixbox);

    var header = document.createElement("h4");
    header.className = "text-dark  header-title m-t-0 m-b-10";
    header.innerHTML = "Color Picker";
    fixbox.appendChild(header);

    //wheel.
    var content = document.createElement("div");
    content.className = "wheel";
    content.id = "colorWheelDemo";
    fixbox.appendChild(content);


    var cwheelvalues = "rgb(255,255,255)";
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

    //  content.appendChild(on_off_toggle);
}




function constructLevelInputStatusBox() {
    var currentrow_div = document.getElementById("StatusPage");
    removeElement("levelbox");
    var levelcol = document.createElement("div");
    levelcol.className = "col-sm-6";
    currentrow_div.appendChild(levelcol);

    var levelbox = document.createElement("div");
    levelbox.className = "card-box";
    levelcol.appendChild(levelbox);
    levelbox.id = "levelbox";

    updateLevelInputStatusBox();
}




function updateLevelInputStatusBox()
{
    var levelbox = document.getElementById("levelbox");
    if(levelbox != undefined)
    {
        levelbox.innerHTML = "";
        var header = document.createElement("h4");
        header.className = "text-dark  header-title m-t-0 m-b-10";
        header.innerHTML = "Level Inputs";
        levelbox.appendChild(header);


        for (var i = 0; i < cachedconfig.levelinputs.length; i++) {

            var inputobj = cachedconfig.levelinputs[i];


            var fixcontent = document.createElement("div");
            fixcontent.className = "levelinputitem";
            levelbox.appendChild(fixcontent);

            var name = document.createElement("div");
            name.className = "levelinputname";
            name.innerHTML = inputobj.assignedname;
            fixcontent.appendChild(name);


            var guage = document.createElement("div");  // 200 px wide fixed. black to white.
            guage.className = "levelinputgrad";
            fixcontent.appendChild(guage);

            var guagemark = document.createElement("div");
            guagemark.className = "inputlevel_mark";
            var sensorvoltage = inputobj.value;
            //sensorvoltage = 6.8;

            var pct = sensorvoltage * 10;
            var markloc = 0;
            if(inputobj.type == "daylight")
                markloc = 200 - ((pct * 200)/ 100);
            else
                markloc = ((pct * 200)/ 100);

            guagemark.style.marginLeft = markloc + "px";
            guage.appendChild(guagemark);

            var value = document.createElement("div");
            value.className = "levelinputvalue";
            value.innerHTML = "value";
            fixcontent.appendChild(value);

            if(inputobj.type == "daylight") {
                // convert value to fc,
                var fcval = voltageToFC(sensorvoltage);
                // this value is a value 0 - 10 volts, 0 (full bright,  10 dark.
                value.innerHTML = fcval + " FC";
            }
            else
            {
                value.innerHTML = sensorvoltage + " V";
            }
        }


    }
}


function constructContactInputStatusBox() {
    var currentrow_div = document.getElementById("StatusPage");
    removeElement("contactbox");
    var contactcol = document.createElement("div");
    contactcol.className = "col-sm-6";
    currentrow_div.appendChild(contactcol);

    var contactbox = document.createElement("div");
    contactbox.className = "card-box";
    contactcol.appendChild(contactbox);
    contactbox.id = "contactbox";

    updateContactInputStatusBox();
}



function updateContactInputStatusBox()
{
    var levelbox = document.getElementById("contactbox");
    if(levelbox != undefined)
    {
        levelbox.innerHTML = "";
        var header = document.createElement("h4");
        header.className = "text-dark  header-title m-t-0 m-b-10";
        header.innerHTML = "Contact Inputs";
        levelbox.appendChild(header);

        for (var i = 0; i < cachedconfig.contactinputs.length; i++) {

            var inputobj = cachedconfig.contactinputs[i];


            var fixcontent = document.createElement("div");
            fixcontent.className = "contactinputitem";
            levelbox.appendChild(fixcontent);

            var name = document.createElement("div");
            name.className = "contactinputname";
            name.innerHTML = inputobj.assignedname;
            fixcontent.appendChild(name);

            var value = document.createElement("div");
            value.className = "contactinputvalue";
            value.innerHTML = "value";
            fixcontent.appendChild(value);

            var dt = moment(inputobj.lastupdated);

            if(inputobj.type == "maintained") {

                var desc = (inputobj.value == 1)?"ACTIVE":"INACTIVE";
                value.innerHTML = desc + "   -- last: "+ dt.format('MMMM Do YYYY, h:mm:ss a');
            }
            else
            {
                // momentary.
                value.innerHTML = " -- last changed at: " + dt.format('MMMM Do YYYY, h:mm:ss a');
            }


        }


    }
}
