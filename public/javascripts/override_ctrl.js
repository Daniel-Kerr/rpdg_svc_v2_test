/**
 * Created by Nick on 11/29/2016.
 */
var SlidersDiv = new Array ();
var PWMLabels = new Array();
var IncInScene = new Array();
var ToggleSel = new Array();

var rgbwsettimer; // timer used to send off override calls for rgb fixtures.
var cachedconfig;
var selectedfixtureobj;
var loading = false; // used for blocking plc controls from going to hw.
var lastrgbcolor;


$(document).ready(function() {


    // handler for fixture table,
    $("#fixturetable").on("click", " tr", function(e) {

        // 3/15/17, remove selected scene if on the table,
        if(selecteditem != undefined) {

            selecteditem.css("border-color", defaultcolor);
            selecteditem.droppable("option", "disabled", true);
            enableDisableFixturesInDiv(selecteditem, false);
            selected_scene = undefined;
            filterAvalibleFixtures();
            selecteditem = undefined;
        }



        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
        }
        else {

            var fixsetting = document.getElementById("fixturesettingsdiv");

            fixsetting.innerHTML = ""; //clear
            //$("#fixturetable").$('tr.active').removeClass('active');
            $(this).addClass('active').siblings().removeClass('active');

            var row = $(this).find('td:first').text();
            var type = "";
            //  var uid = "";
            var index = 0;
            for(var i = 0; i < cachedconfig.fixtures.length; i++) {
                if(row == cachedconfig.fixtures[i].assignedname)
                {
                    selectedfixtureobj = cachedconfig.fixtures[i];
                    type = cachedconfig.fixtures[i].type;

                    index++;
                    break;
                }
            }

            if(type == "on_off")
            {
                var curr_state = selectedfixtureobj.level;

                var fixrow1 = document.createElement("DIV");
                fixrow1.id = 'fix_toggle1';
                fixrow1.className="singlerow";
                fixsetting.appendChild(fixrow1);
                var toggleelement = $("<input/>").appendTo('#fix_toggle1');
                toggleelement.attr('type', 'checkbox');
                toggleelement.attr('id','toggle1');
                toggleelement.attr('data-toggle', 'toggle');
                toggleelement.attr('checked', curr_state);

                $("[data-toggle='toggle']").bootstrapToggle('destroy')
                $("[data-toggle='toggle']").bootstrapToggle();


                $('#toggle1').change(function() {

                    var state = $(this).prop('checked');
                    var levelpct = 0;
                    if(state)
                        levelpct = 100;

                    var element = {};
                    element.requesttype = "override";
                    element.name = selectedfixtureobj.assignedname;
                    element.level = levelpct;
                    setFixtureLevel(element);
                })
            }
            else if(type == "dim")
            {
                var dimlevel = selectedfixtureobj.level; //scenesettingsholdermap[selectedfixtureobj.assignedname].status.currentlevels;
                var current_brightness = "50";

                if(dimlevel != undefined)
                    current_brightness = dimlevel;


                var $ctrldiv = $("<div>", {id: "controldiv", "class": "singlerow"});  // create a control div
                $('#fixturesettingsdiv').append($ctrldiv);
                $('<label>Level</label>').appendTo('#controldiv');

                var orgId = 'o1';
                var charityId = 'c1';
                var sliderElement = $("<input/>").appendTo('#controldiv');

                sliderElement.attr('name', selectedfixtureobj.assignedname);
                var sliderUnique= orgId.concat("Slider");
                var sliderUniqueVal = orgId.concat("SliderVal");
                sliderElement.attr('id', selectedfixtureobj.assignedname + "_DIM");
                sliderElement.attr('data-slider-id', sliderUnique);
                sliderElement.attr('type', 'text');
                sliderElement.attr('data-slider-min', '0');
                sliderElement.attr('data-slider-max', '100');
                sliderElement.attr('data-slider-step', '1');
                sliderElement.attr('data-slider-value', current_brightness);
                sliderElement.bootstrapSlider({tooltip: 'show'});
                sliderElement.on("slideStop", function(slideEvt) {
                    var bla2 = slideEvt.currentTarget.getAttribute("name");
                    var levelpct = document.getElementById(bla2 + "_DIM").value;
                    if(bla2 != undefined) {
                        var element = {};
                        element.requesttype = "override";
                        element.name = bla2;
                        element.level = levelpct;
                        // var dim = {};
                        // dim.levelpct = levelpct;
                        //element.dim = dim;
                        setFixtureLevel(element);
                        //console.log("dim set: "  + levelpct);
                    }
                });

            }
            else if(type == "cct")
            {
                var current_ctemp = selectedfixtureobj.colortemp; //"3500";
                var current_brightness = selectedfixtureobj.brightness; //"50";

                var fixrow1 = document.createElement("DIV");
                fixrow1.className = "row";
                fixrow1.id = 'fixrow'+i;
                fixsetting.appendChild(fixrow1);

                var $testdiv = $("<div>", {id: "controldiv", "class": "btntable"});
                $("#fixrow"+i).append($testdiv);

                var $ctrl1 = $("<div>", {id: "ctrl1", "class": "btntable"});

                $("#controldiv").append($ctrl1);

                var ctemplbl = $('<label>Color Temp</label>').appendTo('#ctrl1');
                var ctempslider = $("<input/>").appendTo('#ctrl1');
                ctempslider.attr('name', selectedfixtureobj.assignedname);
                var sliderUnique= selectedfixtureobj.assignedname + "_CTEMP";
                ctempslider.attr('id', selectedfixtureobj.assignedname + "_CTEMP");
                ctempslider.attr('data-slider-id', sliderUnique);
                ctempslider.attr('type', 'text');

                ctempslider.attr('data-slider-min', selectedfixtureobj.min);
                ctempslider.attr('data-slider-max', selectedfixtureobj.max);
                ctempslider.attr('data-slider-step', '100');
                ctempslider.attr('data-slider-value', current_ctemp);  // note var.
                ctempslider.bootstrapSlider({tooltip: 'show'});
                ctempslider.on("slideStop", function(slideEvt) {
                    var bla2 = slideEvt.currentTarget.getAttribute("name");
                    var ctemp = document.getElementById(bla2 + "_CTEMP").textContent;
                    var bright = document.getElementById(bla2 + "_BRIGHT").textContent;

                    if(bla2 != undefined)
                    {
                        var element = {};
                        element.name = bla2;
                        element.requesttype = "override";
                        element.colortemp = ctemp;
                        element.brightness = bright;
                        setFixtureLevel(element);
                    }
                });

                var $gapdiv = $("<div>", {id: "gapdiv", "class": "gap"});
                $("#controldiv").append($gapdiv);
                var $ctrl2 = $("<div>", {id: "ctrl2", "class": "btntable"});
                $("#controldiv").append($ctrl2);
                var ctemplbl = $('<label>Brightness</label>').appendTo('#ctrl2');


                var brightslider = $("<input/>").appendTo('#ctrl2');
                brightslider.attr('name', selectedfixtureobj.assignedname);
                var sliderUnique= selectedfixtureobj.assignedname + "_BRIGHT"; //orgId.concat("Slider");
                brightslider.attr('id', selectedfixtureobj.assignedname + "_BRIGHT");
                //brightslider.attr('uid', uid);
                brightslider.attr('data-slider-id', sliderUnique);
                brightslider.attr('type', 'text');
                brightslider.attr('data-slider-min', '0');
                brightslider.attr('data-slider-max', '100');
                brightslider.attr('data-slider-step', '1');
                brightslider.attr('data-slider-value', current_brightness);

                brightslider.bootstrapSlider({tooltip: 'show'});
                brightslider.on("slideStop", function(slideEvt) {

                    var bla2 = slideEvt.currentTarget.getAttribute("name");
                    var ctemp = document.getElementById(bla2 + "_CTEMP").textContent;
                    var bright = document.getElementById(bla2 + "_BRIGHT").textContent;

                    if(bla2 != undefined)
                    {
                        var element = {};
                        element.name = bla2;
                        element.requesttype = "override";
                        element.colortemp = ctemp;
                        element.brightness = bright;
                        setFixtureLevel(element);
                    }
                });
            }

            else if(type == "rgbw")
            {

                var fixrow1 = document.createElement("DIV");
                fixrow1.className = "rgbrowcell";
                fixrow1.id = 'wheel'+index;
                fixsetting.appendChild(fixrow1);

                var $colorpicker1 = $("<div>", {id: "colorWheelDemo", "class": "wheel"});
                $("#wheel"+index).append($colorpicker1);

                // get the last known status levels, and set up control

                var cwheelvalues = "rgb(255,255,255)";
                //if(scenesettingsholdermap[selectedfixtureobj.uid] != undefined)
                //{
               // var rgbwlevels = scenesettingsholdermap[selectedfixtureobj.uid].status.currentlevels;

                //if(rgbwlevels != undefined)
               // {
                    //convert from pct back to rgb 8 bit,
                    var red = (selectedfixtureobj.red * 255)/100;
                    var green = (selectedfixtureobj.green * 255)/100;
                    var blue = (selectedfixtureobj.blue * 255)/100;

                    cwheelvalues = "rgb(" + red.toFixed()+ "," + green.toFixed() + "," + blue.toFixed() + ")";
               // }
                // }


                var colorWheel = iro.ColorWheel("#colorWheelDemo", {
                    width: 300,
                    height: 300,
                    padding: 4,
                    sliderMargin: 24,
                    markerRadius: 4,
                    color: cwheelvalues,
                    CSS: {} // apply colors to any elements
                });

                colorWheel.watch(function(color) {
                    //console.log(color.rgb);
                    startRGBWCallHWCallTimer(color);
                });

            }
        }
    });

});  // end doc ready.


function init() {
    getConfig(processConfig);
    //  getSceneNameList(cacheAndProcessSceneNames);
}

function processConfig(configobj)
{
    cachedconfig = configobj;
    updateFixturesTable();
    redrawScenes();
}



function setRGBWToHW()
{
    if(lastrgbcolor != undefined && selectedfixtureobj != undefined) {
        var element = {};
        element.requesttype = "override";
        element.name = selectedfixtureobj.assignedname;
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
    rgbwsettimer = setTimeout(setRGBWToHW, 600)  //600ms,  reset,
}





function postSetFixtureHandler(status)
{
    if (status != null) {
        cachedconfig = status;
        scenesettingsholdermap = status.fixtures;
        // nullselectedscene();  //on change of level,
    }
}

function setFixtureLevel(element)
{
    setFixtureLevel2(element,postSetFixtureHandler);
}


function initStatusHandler(status)
{
    scenesettingsholdermap = status.fixtures;
    loading = true;
    for(var i = 0; i < status.plcoutput.length; i++)
    {
        var name = "#plc" +(i+1);
        var value = (status.plcoutput[i] == "ON")?true:false;
        $(name).prop('checked', value).change();
    }
    loading = false;
}


function updateFixturesTable() {

    var fixtures = cachedconfig.fixtures;
    // var fixturescontainerdiv = document.getElementById("fixturetablediv");

    var oTable = document.getElementById("fixturetable");
    // build a table with all the known
    // var oTable = document.createElement("TABLE");
    //  oTable.id = "fixturetable";
    // fixturescontainerdiv.appendChild(oTable);

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3;

    var slider;
    var i, j;
    //oTable.className ="table  table-bordered";
    // Insert a row into the header and set its background color.
    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Name";
    //oCell.colSpan = 2;
    oCell2 = document.createElement("TD");
    oCell2.innerHTML = "Type";
    oCell3 = document.createElement("TD");
    oCell3.innerHTML = "Output#'s";

    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oRow.appendChild(oCell3);
    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-2";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-6";
    oTColGrp.appendChild(coldef);

    oTable.appendChild(oTHead);
    oTable.appendChild(oTColGrp);
    oTable.appendChild(oTBody);

    // Insert rows and cells into bodies.
    for (i=0; i< fixtures.length; i++)   {
        var oBody = oTBody;
        oRow = document.createElement("TR");
        oBody.appendChild(oRow);

        // column1 = Zone Label
        var nametd = document.createElement("TD");
        var fixname = document.createElement("label");
        fixname.innerHTML = fixtures[i].assignedname;
        nametd.appendChild(fixname);
        oRow.appendChild(nametd);

        var typetd = document.createElement("TD");
        var type = document.createElement("label");
        type.innerHTML = fixtures[i].type;
        typetd.appendChild(type);
        oRow.appendChild(typetd);

        var assigntd = document.createElement("TD");
        var ass = document.createElement("label");
        // ass.innerHTML = fixtures[i].assignment;
        assigntd.appendChild(ass);
        oRow.appendChild(assigntd);

    }

}


function captureCurrentTime () {
    var d = new Date();
    var n = d.getTime();
    return n;
}
function returnFutureTime (timeadderinseconds) {
    var d = new Date();
    var n = d.getTime();
    return n+(timeadderinseconds*1000);
}
function timeDifferenceSecondsFromNow (futuretime) {
    var diff = futuretime - captureCurrentTime ();
    return diff;
}


function validateuserinputs()
{
    if ($('#scenename').valid()){
        if ($('#scenedesc').valid()){
            return true;
        }
    }
    return false;
}
