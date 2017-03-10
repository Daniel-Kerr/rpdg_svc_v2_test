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
//var scenesettingsholdermap = {}; //map that holder per uid,  the current settings the usre has set.

var plc_output_state; // copy to hold stae.
var loading = false; // used for blocking plc controls from going to hw.


$(function(){
    $("#includedContent").load("customtitlebar.html");
});

$(document).ready(function() {

    $("#sceneeditform").validate({
        "rules": {
            "scenename": {
                "required": true,
                "maxlength": 40,
                "minlength": 4
            },
            "scenedesc": {
                "required": true,
                "maxlength": 40,
                "minlength": 8
            }
        },
        "messages": {
            "scenename": {
                "required": "scene name is required."
            },
            "scenedesc": {
                "required": "scene desc is required."
            }
        }
    });


    // $("#ex9").slider({
    //     precision: 2,
    //     value: 8.115 // Slider will instantiate showing 8.12 due to specified precision
    // });

    // With JQuery
    $('#ex1').bootstrapSlider({
        formatter: function(value) {
            return 'Current value: ' + value;
        }
    });


    // handler for fixture table,
    $("#fixturetable").on("click", " tr", function(e) {
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
                {
                    current_brightness = dimlevel.levelpct;
                }

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
                var cctlevels = scenesettingsholdermap[selectedfixtureobj.uid].status.currentlevels;

                var current_ctemp = "3500";
                var current_brightness = "50";

                if(cctlevels != undefined)
                {
                    if(cctlevels.ctemp != undefined && cctlevels.ctemp.length > 0 )
                        current_ctemp = cctlevels.ctemp;

                    if(cctlevels.levelpct != undefined && cctlevels.levelpct.length > 0 )
                        current_brightness = cctlevels.levelpct;
                }

                var fixrow1 = document.createElement("DIV");
                fixrow1.className = "row";
                fixrow1.id = 'fixrow'+i;
                fixsetting.appendChild(fixrow1);

                var $testdiv = $("<div>", {id: "controldiv", "class": "btntable"});
                $("#fixrow"+i).append($testdiv);

                var $ctrl1 = $("<div>", {id: "ctrl1", "class": "btntable"});

                $("#controldiv").append($ctrl1);

                var ctemplbl = $('<label>Color Temp</label>').appendTo('#ctrl1');

                // var orgId = 'o1';
                // var charityId = 'c1';
                var ctempslider = $("<input/>").appendTo('#ctrl1');

                ctempslider.attr('uid', uid);
                var sliderUnique= uid + "_CTEMP"; //orgId.concat("Slider");
                // var sliderUniqueVal = orgId.concat("SliderVal");
                ctempslider.attr('id', uid + "_CTEMP");
                ctempslider.attr('data-slider-id', sliderUnique);
                ctempslider.attr('type', 'text');
                ctempslider.attr('data-slider-min', '2500');
                ctempslider.attr('data-slider-max', '6500');
                ctempslider.attr('data-slider-step', '100');
                ctempslider.attr('data-slider-value', current_ctemp);  // note var.
                ctempslider.bootstrapSlider({tooltip: 'show'});

                ctempslider.on("slideStop", function(slideEvt) {

                    var bla2 = slideEvt.currentTarget.getAttribute("uid");
                    var bla3 = slideEvt.currentTarget.value;
                    var ctemp = document.getElementById(bla2 + "_CTEMP").textContent; //.value;
                    var bright = document.getElementById(bla2 + "_BRIGHT").textContent //.value;

                    if(bla2 != undefined)
                    {
                        var element = {};
                        var cct = {};
                        element.requesttype = "override";
                        element.uid = bla2;
                        cct.levelpct = bright;
                        cct.ctemp = ctemp;
                        element.cct = cct;
                        setFixtureLevel(element);
                    }
                });

                var $gapdiv = $("<div>", {id: "gapdiv", "class": "gap"});
                $("#controldiv").append($gapdiv);
                var $ctrl2 = $("<div>", {id: "ctrl2", "class": "btntable"});
                $("#controldiv").append($ctrl2);
                var ctemplbl = $('<label>Brightness</label>').appendTo('#ctrl2');

                var brightslider = $("<input/>").appendTo('#ctrl2');
                var sliderUnique= uid + "_BRIGHT"; //orgId.concat("Slider");
                brightslider.attr('id', uid + "_BRIGHT");
                brightslider.attr('uid', uid);
                brightslider.attr('data-slider-id', sliderUnique);
                brightslider.attr('type', 'text');
                brightslider.attr('data-slider-min', '0');
                brightslider.attr('data-slider-max', '100');
                brightslider.attr('data-slider-step', '1');
                brightslider.attr('data-slider-value', current_brightness);

                brightslider.bootstrapSlider({tooltip: 'show'});
                brightslider.on("slideStop", function(slideEvt) {
                    var bla2 = slideEvt.currentTarget.getAttribute("uid");
                    //var ctemp = document.getElementById(bla2 + "_CTEMP").value;
                    //var bright = document.getElementById(bla2 + "_BRIGHT").value;
                    var ctemp = document.getElementById(bla2 + "_CTEMP").textContent; //.value;
                    var bright = document.getElementById(bla2 + "_BRIGHT").textContent //.value;

                    if(bla2 != undefined)
                    {
                        var element = {};
                        var cct = {};
                        element.requesttype = "override";
                        element.uid = bla2;
                        cct.levelpct = bright;
                        cct.ctemp = ctemp;
                        element.cct = cct;
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
                if(scenesettingsholdermap[selectedfixtureobj.uid] != undefined)
                {
                    var rgbwlevels = scenesettingsholdermap[selectedfixtureobj.uid].status.currentlevels;

                    if(rgbwlevels != undefined)
                    {
                        //convert from pct back to rgb 8 bit,
                        var red = (rgbwlevels.red * 255)/100;
                        var green = (rgbwlevels.green * 255)/100;
                        var blue = (rgbwlevels.blue * 255)/100;

                        cwheelvalues = "rgb(" + red+ "," + green + "," + blue + ")";
                    }
                }


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




    $('#plc1').change(function() {
        var state = $(this).prop('checked');
        var stateval = (state)?1:0;
        setPLC(1,stateval);
        // if(loading)
        //     nullselectedscene();

    })

    $('#plc2').change(function() {
        var state = $(this).prop('checked');
        var stateval = (state)?1:0;
        setPLC(2,stateval);

    })

    $('#plc3').change(function() {
        var state = $(this).prop('checked');
        var stateval = (state)?1:0;
        setPLC(3,stateval);

    })

    $('#plc4').change(function() {
        var state = $(this).prop('checked');
        var stateval = (state)?1:0;
        setPLC(4,stateval);

    })




});  // end doc ready.



function init() {

    getConfig(processConfig);
    getSceneNameList(cacheAndProcessSceneNames);
    // getStatus(initStatusHandler);
}

function processConfig(configobj)
{
    cachedconfig = configobj;
    updateFixturesTable();
    // initSceneEditSaveTable(); temp cmt out.
}
function setRGBWToHW()
{
    if(lastrgbcolor != undefined && selectedfixtureobj != undefined) {
        var element = {};
        element.request = "override";
        element.uid = selectedfixtureobj.uid;
        var rgbw = {};
        rgbw.red = (lastrgbcolor.rgb.r * 100) / 255;  // convert to pct
        rgbw.green = (lastrgbcolor.rgb.g * 100) / 255;  // convert to pct
        rgbw.blue = (lastrgbcolor.rgb.b * 100) / 255;  // convert to pct
        rgbw.white = 100;
        element.rgbw = rgbw;
        setFixtureLevel(element);
    }
}

var lastrgbcolor;

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
        scenesettingsholdermap = status.fixtures;
        nullselectedscene();  //on change of level,
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



function trimLastCharFromValue(val)
{
    if(val.length > 0)
        return val.substring(0,val.length-1);

    return val;
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



function initSceneEditSaveTable() {
    // Declare global variables and create the header, footer, and caption.
    var oTable = document.createElement("TABLE");
    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    // var oTFoot = document.createElement("TFOOT");
    var oRow;

    var i, j;

    oTable.className ="table  table-bordered";
    // Insert a row into the header and set its background color.
    oRow = document.createElement("TR");
    var oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Fixture";
    oRow.appendChild(oCell1);
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Include In Scene";
    oRow.appendChild(oCell1);
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Toggle";
    oRow.appendChild(oCell1);


    oTHead.appendChild(oRow);
    //var MinButtonCell, minselector;

    var coldef = document.createElement("col");
    coldef.className = "col-sm-1";
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
    for (i=0; i< cachedconfig.fixtures.length; i++)   {

        var fixture = cachedconfig.fixtures[i];

        var oBody = oTBody;
        oRow = document.createElement("TR");
        oBody.appendChild(oRow);

        var fixturelabel = document.createElement("TD");
        fixturelabel.id = "ZoneLabel"+i;
        var ZoneLabelDIV = document.createElement("DIV");

        fixturelabel.innerHTML = fixture.name;
        fixturelabel.appendChild(ZoneLabelDIV);

        var inczonecell = document.createElement("TD");
        var inczone = document.createElement("input");
        inczone.id = "inc"+(i+1);
        inczone.name = "inc"+(i+1);
        inczone.type = "checkbox";
        inczone.className = "btn btn-large btn-primary";
        inczonecell.appendChild(inczone);

        //  inczone.addEventListener("change", onIncInSceneChanged);
        inczone.setAttribute('index',i);
        IncInScene.push(inczone);



        var togglezonecell = document.createElement("TD");
        var togglezone = document.createElement("input");
        togglezone.id = "inc"+(i+1);
        togglezone.name = "inc"+(i+1);
        togglezone.type = "checkbox";
        togglezone.className = "btn btn-large btn-primary";
        togglezonecell.appendChild(togglezone);

        //  togglezone.addEventListener("change", onMinChanged);
        togglezone.setAttribute('index',i);
        ToggleSel.push(togglezone);

        oRow.appendChild(fixturelabel);
        oRow.appendChild(inczonecell);
        oRow.appendChild(togglezonecell);

    }
    sceneeditsave.appendChild(oTable);
}



function cacheAndProcessSceneNames(namelist)
{
    if(namelist != null)
    {
        var sel = document.getElementById('scene_sel');
        for (var i = 0 ; i < namelist.length; i += 1) {
            var opt = document.createElement('option');
            opt.setAttribute('value', namelist[i]);
            opt.appendChild(document.createTextNode(namelist[i]));
            sel.appendChild(opt);
        }
    }
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



function processSceneListChangeResult(result)
{
    if(result == "error")
    {
        noty({text: 'Error Deleting Scene', type: 'error'});
        return;
    }

    var sel = document.getElementById("scene_sel");
    // compare list returnd length and determine if added
    var delta = 0;
    if(result.length < sel.length) {
        noty({text: 'Item deleted', type: 'success'});
        delta = -1;
    }

    if(result.length > sel.length) {
        noty({text: 'Item Added', type: 'success'});
        delta = 1;
    }

    // clear all itesm ,
    while (sel.options.length > 0) {
        sel.remove(0);
    }
    for (var i = 0 ; i < result.length; i += 1) {
        var opt = document.createElement('option');
        opt.setAttribute('value', result[i]);
        opt.appendChild(document.createTextNode(result[i]));
        sel.appendChild(opt);
    }

    if(delta == -1) {
        sel.selectedIndex = 0;
        nullselectedscene();
    }
    else if(delta == 1)
    {
        sel.value = document.getElementById('scenename').value;  // to test.
    }

}

function deletescene() {

    deleteSceneByName(document.getElementById("scene_sel").value, processSceneListChangeResult);
}


function sendscenetohost() {
    // just simple test data for dev.  to be removed.
    var scene = {};
    var fixtures = [];

    if (validateuserinputs()) {

        var count = 0;
        for (var zidx = 0; zidx < cachedconfig.fixtures.length; zidx++) {

            var fix = cachedconfig.fixtures[zidx];
            var inc = IncInScene[zidx].checked;
            if(inc) {

                count++;
                var fixsettingobj = {};
                fixsettingobj.uid = fix.uid;
                var settings = {};
                var currentsettings = scenesettingsholdermap[fix.uid];
                var type = fix.type;
                if(type == "on_off" || type == "dim")
                {
                    settings.level = currentsettings.status.currentlevels.levelpct; //lastuserintensity;
                }
                else if (type == "cct")
                {
                    settings.level = currentsettings.status.currentlevels.levelpct;
                    settings.ctemp = currentsettings.status.currentlevels.ctemp;
                }
                else if (type == "rgbw")
                {
                    settings.white = currentsettings.status.currentlevels.white;
                    settings.red = currentsettings.status.currentlevels.red;
                    settings.green = currentsettings.status.currentlevels.green;
                    settings.blue = currentsettings.status.currentlevels.blue;
                }

                fixsettingobj.settings = settings;
                fixtures.push(fixsettingobj);
                // fixtures.push(currentsettings);
            }
        }

        if(count > 0) {
            scene.name = document.getElementById('scenename').value;
            scene.desc = document.getElementById('scenedesc').value;
            scene.fixtures = fixtures;

            var plcstate = {};
            plcstate._1 = "ignore";
            plcstate._2 = "ignore";
            plcstate._3 = "ignore";
            plcstate._4 = "ignore";

            if(document.getElementById('inc_plc1').checked)
                plcstate._1 = $('#plc1').prop('checked');

            if(document.getElementById('inc_plc2').checked)
                plcstate._2 = $('#plc2').prop('checked');

            if(document.getElementById('inc_plc3').checked)
                plcstate._3 = $('#plc3').prop('checked');

            if(document.getElementById('inc_plc4').checked)
                plcstate._4 = $('#plc4').prop('checked');

            scene.plcstate = plcstate;

            saveScene(scene, processSceneListChangeResult);
        }
        else
        {
            noty({text: 'Please include atleast one fixture', type: 'error'});
        }
    }
}



function nullselectedscene()
{
    document.getElementById('scene_sel').value = "----";

    document.getElementById('scenename').value = '';
    document.getElementById('scenedesc').value = '';

}

function processStatusResult(status)
{
    scenesettingsholdermap = status.fixtures;
    plc_output_state = status.plcoutput;

    updatePLCControls();

    if(status.plcoutput != undefined)
    {

    }

    var selscene = document.getElementById('scene_sel').value;
    getSceneDetails(selscene,processSceneDetails);
}


function processSceneDetails(scenedetails)
{
    document.getElementById('scenename').value = scenedetails.name;
    document.getElementById('scenedesc').value = scenedetails.desc;
    // clear all cbs.
    for(var j = 0; j < cachedconfig.fixtures.length; j++) {
        IncInScene[j].checked = false;
    }
    // for each fixture in the scene
    for (var i = 0; i < scenedetails.fixtures.length; i++) {

        var fix = scenedetails.fixtures[i];
        //find this fixture in the loaded fix list
        for (var j = 0; j < cachedconfig.fixtures.length; j++) {
            if (fix.uid == cachedconfig.fixtures[j].uid) {
                IncInScene[j].checked = true;
                break;
            }
        }

        // plc stuff,
        if(scenedetails.plcstate != undefined)
        {
            if(scenedetails.plcstate._1 != "ignore")
            {
                // var val = series.plcstate._1;
                // $('#plc1').prop('checked',val).change();
                $('#inc_plc1').prop('checked',true).change();
            }
            else
                $('#inc_plc1').prop('checked',false).change();

            if(scenedetails.plcstate._2 != "ignore")
            {
                //  var val = series.plcstate._2;
                //  $('#plc2').prop('checked',val).change();
                $('#inc_plc2').prop('checked',true).change();
            }
            else
                $('#inc_plc2').prop('checked',false).change();

            if(scenedetails.plcstate._3 != "ignore")
            {
                // var val = series.plcstate._3;
                //  $('#plc3').prop('checked',val).change();
                $('#inc_plc3').prop('checked',true).change();
            }
            else
                $('#inc_plc3').prop('checked',false).change();

            if(scenedetails.plcstate._4 != "ignore")
            {
                //  var val = series.plcstate._4;
                //  $('#plc4').prop('checked',val).change();
                $('#inc_plc4').prop('checked',true).change();
            }
            else
                $('#inc_plc4').prop('checked',false).change();
        }
        else
        {
            $('#inc_plc1').prop('checked',false).change();
            $('#inc_plc2').prop('checked',false).change();
            $('#inc_plc3').prop('checked',false).change();
            $('#inc_plc4').prop('checked',false).change();
        }

    }  //end for loop.

}
function applyselectedscene() {


    $('#fixturetable tr').removeClass("active");
    var fixsetting = document.getElementById("fixturesettingsdiv");
    fixsetting.innerHTML = ""; //clear
    // determine selected scene.
    var selscene = document.getElementById('scene_sel').value;

    if(selscene == "----")
        return;

    var element = {};
    element.name = selscene;
    element.requesttype = "override";
    invokeScene(element,processStatusResult);
}


function updatePLCControls()
{
    loading = true;

    if(plc_output_state != undefined && plc_output_state.length == 4)
    {
        var set = plc_output_state[0] == "ON";
        $('#plc1').prop('checked',set).change();

        set = plc_output_state[1] == "ON";
        $('#plc2').prop('checked',set).change();

        set = plc_output_state[2] == "ON";
        $('#plc3').prop('checked',set).change();

        set = plc_output_state[3] == "ON";
        $('#plc4').prop('checked',set).change();
    }

    loading = false;
}


function setPLC(outputnumber, state) {

    if (loading)
        return;

    if (document.getElementById('scene_sel').value != "----") {
        nullselectedscene();
    }
        var plcobj = {}
        plcobj.number = outputnumber;
        plcobj.state = state;
        setPLC2(plcobj, postPLCSetHandler);
    //}
}


function postPLCSetHandler(result) {
    if (result == "error") {
        noty({text: 'Error setting new PLC level ', type: 'error'});
        return;
    }

    scenesettingsholdermap = result.fixtures;
    plc_output_state = result.plcoutput;
    updatePLCControls();

}