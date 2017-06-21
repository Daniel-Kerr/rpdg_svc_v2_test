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
var lastwhite;


// timer added to peridoically fetch the status of script running,
setInterval(function () {

    getScriptRunStatus(function(data) {

        if(data)
        {
            document.getElementById("scriptstatus").innerHTML = "Script Running";
        }
        else
            document.getElementById("scriptstatus").innerHTML = "Idle";
    });

}, 5000);

$(document).ready(function() {


    //$(".clickable-row").click(function() {
    //    var k = 0;
    //     k  = k + 1;
    //window.location = $(this).data("href");
    //  });


    $('input[type="range"]').rangeslider({
        polyfill : false,
        onInit : function() {
            //  this.output = $( '<div class="range-output" />' ).insertAfter( this.$range ).html( this.$element.val() );
        },
        onSlide : function( position, value ) {
            //  this.output.html( value );
        }
    });

    // handler for fixture table,
    //  $('#fixturetable tbody tr').click(function() {
    $("#fixturetable").on("click", " tbody > tr", function(e) {

        // 3/15/17, remove selected scene if on the table,
        if(selecteditem != undefined) {

            selecteditem.css("border-color", defaultcolor);
            selecteditem.droppable("option", "disabled", true);
            enableDisableFixturesInDiv(selecteditem, false);
            selected_scene = undefined;
            filterAvalibleFixtures();
            selecteditem = undefined;
        }

        //disable action buttons on all ,
        for(var k = 0; k <  cachedconfig.scenes.length; k++)
        {
            var disableele = '#actionbuttons_'+k;
            $(disableele).children().addClass('disabled');
            $(disableele).children().removeClass('active');
        }


        if ($(this).hasClass('bg-success')) {
            $(this).removeClass('bg-success');
        }
        else {

            var fixsetting = document.getElementById("fixturesettingsdiv");

            fixsetting.innerHTML = ""; //clear
            fixsetting.className="settingholder";


            //$(this).addClass('active').siblings().removeClass('active');
            $(this).addClass('bg-primary').siblings().removeClass('bg-primary');

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

                var fixrow1 = document.createElement("DIV");
                fixrow1.className = "tophalf";
                fixrow1.id = 'fixrow_ctemp';
                fixsetting.appendChild(fixrow1);

                // label
                var ctrllabel2 = document.createElement("DIV");
                ctrllabel2.className = "controllabel";
                ctrllabel2.innerHTML  = "Level";
                fixrow1.appendChild(ctrllabel2);

                // control
                var ctrlholder2 = document.createElement("DIV");
                ctrlholder2.className = "controlholder";
                ctrlholder2.id = 'control2';
                fixrow1.appendChild(ctrlholder2);


                var ctrlvalue2 = document.createElement("DIV");
                ctrlvalue2.className = "controlvalue";
                ctrlvalue2.id = 'controlvalue2';
                ctrlvalue2.innerHTML  = selectedfixtureobj.level;
                fixrow1.appendChild(ctrlvalue2);

                var brightslider = document.createElement("INPUT");
                brightslider.setAttribute("type", "range");
                brightslider.setAttribute("id", "level");
                brightslider.setAttribute("target", selectedfixtureobj.assignedname);
                brightslider.value = selectedfixtureobj.level;
                ctrlholder2.appendChild(brightslider);

                $('input[type="range"]').rangeslider({
                    polyfill : false,
                    onInit : function() {
                        //  this.output = $( '<div class="range-output" />' ).insertAfter( this.$range ).html( this.$element.val() );
                    },
                    onSlideEnd : function( position, value ) {
                        var level = document.getElementById("level").value;
                        var bla2 = selectedfixtureobj.assignedname;
                        if(bla2 != undefined)
                        {
                            var element = {};
                            element.name = bla2;
                            element.requesttype = "override";
                            element.level = level;
                            setFixtureLevel(element);
                            document.getElementById("controlvalue2").innerHTML = level;
                        }
                    }
                });
            }
            else if(type == "cct")
            {
                var current_ctemp = selectedfixtureobj.colortemp; //"3500";
                var current_brightness = selectedfixtureobj.brightness; //"50";

                var fixrow1 = document.createElement("DIV");
                fixrow1.className = "tophalf";
                fixrow1.id = 'fixrow_ctemp';
                fixsetting.appendChild(fixrow1);


                var fixrow2 = document.createElement("DIV");
                fixrow2.className = "bottomhalf";
                fixrow2.id = 'bottomhalf';
                fixsetting.appendChild(fixrow2);


                // label
                var ctrllabel = document.createElement("DIV");
                ctrllabel.className = "controllabel";
                //     ctrllabel.id = 'controllabel1';
                ctrllabel.innerHTML  = "Color Temp";
                fixrow1.appendChild(ctrllabel);

                // control
                var ctrlholder = document.createElement("DIV");
                ctrlholder.className = "controlholder";
                ctrlholder.id = 'control1';
                fixrow1.appendChild(ctrlholder);


                var ctrlvalue = document.createElement("DIV");
                ctrlvalue.className = "controlvalue";
                ctrlvalue.id = 'controlvalue1';
                ctrlvalue.innerHTML  = selectedfixtureobj.colortemp;
                fixrow1.appendChild(ctrlvalue);

                //  Color Temp ***************************************************************************
                var ctempslider = document.createElement("INPUT");
                ctempslider.setAttribute("type", "range");
                ctrlholder.appendChild(ctempslider);
                ctempslider.setAttribute("id", "ctemp");
                ctempslider.setAttribute("min", selectedfixtureobj.min);
                ctempslider.setAttribute("max", selectedfixtureobj.max);
                ctempslider.value = selectedfixtureobj.colortemp;
                //  Brightness ***************************************************************************



                // label
                var ctrllabel2 = document.createElement("DIV");
                ctrllabel2.className = "controllabel";
                ctrllabel2.innerHTML  = "Brightness";
                fixrow2.appendChild(ctrllabel2);

                // control
                var ctrlholder2 = document.createElement("DIV");
                ctrlholder2.className = "controlholder";
                ctrlholder2.id = 'control2';
                fixrow2.appendChild(ctrlholder2);


                var ctrlvalue2 = document.createElement("DIV");
                ctrlvalue2.className = "controlvalue";
                ctrlvalue2.id = 'controlvalue2';
                ctrlvalue2.innerHTML  = selectedfixtureobj.brightness;
                fixrow2.appendChild(ctrlvalue2);

                var brightslider = document.createElement("INPUT");
                brightslider.setAttribute("type", "range");
                brightslider.setAttribute("id", "bright");
                brightslider.setAttribute("target", selectedfixtureobj.assignedname);
                brightslider.value = selectedfixtureobj.brightness;
                ctrlholder2.appendChild(brightslider);

                $('input[type="range"]').rangeslider({
                    polyfill : false,
                    onInit : function() {
                        //  this.output = $( '<div class="range-output" />' ).insertAfter( this.$range ).html( this.$element.val() );
                    },
                    onSlideEnd : function( position, value ) {
                        var ctemp = document.getElementById("ctemp").value;
                        var bright= document.getElementById("bright").value;
                        var bla2 = selectedfixtureobj.assignedname;
                        if(bla2 != undefined)
                        {
                            var element = {};
                            element.name = bla2;
                            element.requesttype = "override";
                            element.colortemp = ctemp;
                            element.brightness = bright;
                            setFixtureLevel(element);

                            document.getElementById("controlvalue2").innerHTML = bright;
                            document.getElementById("controlvalue1").innerHTML = ctemp;
                        }
                    }
                });
            }
            else if(type == "rgb")
            {
                constructControlRGB(fixsetting,index);
            }
            else if(type == "rgbw")
            {
                constructControlRGBW(fixsetting,index);
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
    document.title = cachedconfig.generalsettings.nodename;
    updateFixturesTable();
    redrawScenes();

    //  populateDropDown("scriptsel", ["alarmmode","???"]);


    getScriptNames(function (data) {
        scriptnames = data;

        populateDropDown("scriptsel",scriptnames);
    });
}

function runscript()
{
    var aa_p1 = $('#scriptsel').val();

    var element = {};
    element.script = aa_p1;
    executescript(element, function(result) {

        var k = 0;
        k = k + 1;
        //resutl of script here.
    });

}

function setRGBWToHW()
{
    if(pendingFixtureLevelObj != undefined)
    {
        setFixtureLevel(pendingFixtureLevelObj);
        pendingFixtureLevelObj = undefined;
    }
}


var pendingFixtureLevelObj = undefined;


function startRGBWCallHWCallTimer(redpct, greenpct, bluepct, whitepct)
{
    // stop timer ,,
    if(rgbwsettimer != undefined)
    {
        clearTimeout(rgbwsettimer);
    }

    pendingFixtureLevelObj = {};
    pendingFixtureLevelObj.requesttype = "override";
    pendingFixtureLevelObj.name = selectedfixtureobj.assignedname;

    pendingFixtureLevelObj.red = redpct; //((lastrgbcolor.rgb.r * 100) / 255).toFixed(0);  // convert to pct
    pendingFixtureLevelObj.green = greenpct; //((lastrgbcolor.rgb.g * 100) / 255).toFixed(0);  // convert to pct
    pendingFixtureLevelObj.blue = bluepct; //((lastrgbcolor.rgb.b * 100) / 255).toFixed(0);  // convert to pct
    pendingFixtureLevelObj.white = whitepct; //lastwhite;


    rgbwsettimer = setTimeout(setRGBWToHW, 600)  //600ms,  reset,
}



function startRGBCallHWCallTimer(redpct, greenpct, bluepct)
{
    // stop timer ,,
    if(rgbwsettimer != undefined)
    {
        clearTimeout(rgbwsettimer);
    }

    pendingFixtureLevelObj = {};
    pendingFixtureLevelObj.requesttype = "override";
    pendingFixtureLevelObj.name = selectedfixtureobj.assignedname;

    pendingFixtureLevelObj.red = redpct; //((lastrgbcolor.rgb.r * 100) / 255).toFixed(0);  // convert to pct
    pendingFixtureLevelObj.green = greenpct; //((lastrgbcolor.rgb.g * 100) / 255).toFixed(0);  // convert to pct
    pendingFixtureLevelObj.blue = bluepct; //((lastrgbcolor.rgb.b * 100) / 255).toFixed(0);  // convert to pct

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
    var oTable = document.getElementById("fixturetable");
    // build a table with all the known

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3;

    var slider;
    var i, j;
    oTable.className ="table table-bordered";
    // Insert a row into the header and set its background color.
    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Name";
    //oCell.colSpan = 2;
    oCell2 = document.createElement("TD");
    oCell2.innerHTML = "Type";
    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-2";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    oTable.appendChild(oTHead);
    oTable.appendChild(oTColGrp);
    oTable.appendChild(oTBody);

    // Insert rows and cells into bodies.
    for (i=0; i< fixtures.length; i++)   {
        var oBody = oTBody;
        oRow = document.createElement("TR");
        //  oRow.className = "clickable-row";
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




function populateDropDown(dropdown, optionslist)
{
    var sel = document.getElementById(dropdown);
    while (sel.options.length > 0) {
        sel.remove(0);
    }

    for (var i = 0 ; i < optionslist.length; i += 1) {
        var opt = document.createElement('option');
        opt.setAttribute('value', optionslist[i]);
        opt.appendChild(document.createTextNode(optionslist[i]));
        sel.appendChild(opt);
    }

}






// under dev,



function constructControlRGB(fixsettingdiv, ctrlidx)
{
    var fixrow1 = document.createElement("DIV");
    fixrow1.className = "rgbw_wheel";
    fixrow1.id = 'wheel'+ctrlidx;
    fixsettingdiv.appendChild(fixrow1);

    var controls_right = document.createElement("div");
    controls_right.className = "rgbw_right";
    fixsettingdiv.appendChild(controls_right);

    var $colorpicker1 = $("<div>", {id: "colorWheelDemo", "class": "wheel"});
    $("#wheel"+ctrlidx).append($colorpicker1);
    // get the last known status levels, and set up control
    var cwheelvalues = "rgb(255,255,255)";
    //convert from pct back to rgb 8 bit,
    var red = (selectedfixtureobj.red * 255)/100;
    var green = (selectedfixtureobj.green * 255)/100;
    var blue = (selectedfixtureobj.blue * 255)/100;

    cwheelvalues = "rgb(" + red.toFixed()+ "," + green.toFixed() + "," + blue.toFixed() + ")";

    lastrgbcolor = {};
    lastrgbcolor.rgb = {};
    lastrgbcolor.rgb.r = red;
    lastrgbcolor.rgb.g = green;
    lastrgbcolor.rgb.b = blue;

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
        lastrgbcolor = color;
        var redpct = ((color.rgb.r * 100) / 255).toFixed(0);
        var greenpct = ((color.rgb.g * 100) / 255).toFixed(0);
        var bluepct = ((color.rgb.b * 100) / 255).toFixed(0);
        startRGBCallHWCallTimer(redpct, greenpct, bluepct);
    });

}



function constructControlRGBW(fixsettingdiv, ctrlidx)
{
    var fixrow1 = document.createElement("DIV");
    fixrow1.className = "rgbw_wheel";
    fixrow1.id = 'wheel'+ctrlidx;
    fixsettingdiv.appendChild(fixrow1);

    var controls_right = document.createElement("div");
    controls_right.className = "rgbw_right";
    fixsettingdiv.appendChild(controls_right);

    var $colorpicker1 = $("<div>", {id: "colorWheelDemo", "class": "wheel"});
    $("#wheel"+ctrlidx).append($colorpicker1);
    // get the last known status levels, and set up control
    var cwheelvalues = "rgb(255,255,255)";
    //convert from pct back to rgb 8 bit,
    var red = (selectedfixtureobj.red * 255)/100;
    var green = (selectedfixtureobj.green * 255)/100;
    var blue = (selectedfixtureobj.blue * 255)/100;

    //var white = (selectedfixtureobj.white * 255)/100;

    cwheelvalues = "rgb(" + red.toFixed()+ "," + green.toFixed() + "," + blue.toFixed() + ")";

    lastrgbcolor = {};
    lastrgbcolor.rgb = {};
    lastrgbcolor.rgb.r = red;
    lastrgbcolor.rgb.g = green;
    lastrgbcolor.rgb.b = blue;

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
        lastrgbcolor = color;
        var redpct = ((color.rgb.r * 100) / 255).toFixed(0);
        var greenpct = ((color.rgb.g * 100) / 255).toFixed(0);
        var bluepct = ((color.rgb.b * 100) / 255).toFixed(0);
        var white = document.getElementById("brightctrl").value;

        startRGBWCallHWCallTimer(redpct, greenpct, bluepct, white);
    });




    // right side,
    var bright_grad = document.createElement("div");
    bright_grad.className = "vert_brightness_grad";
    controls_right.appendChild(bright_grad);

    var guageholder = document.createElement("div");
    guageholder.className = "vert_guage_holder";
    bright_grad.appendChild(guageholder);

    var bright_guage = document.createElement("input");
    bright_guage.type = "range";
    bright_guage.setAttribute("data-orientation","vertical");
    bright_guage.id = "brightctrl";
    bright_guage.value = selectedfixtureobj.white;
    guageholder.appendChild(bright_guage);

    $('input[type="range"]').rangeslider({
        polyfill : false,
        rangeClass: 'custom_slider_range',
        fillClass: 'custom_slider_fill',
        verticalClass: 'custom_rangeslider_vertical',

        onInit : function() {
            //  this.output = $( '<div class="range-output" />' ).insertAfter( this.$range ).html( this.$element.val() );
        },
        onSlideEnd : function( position, value ) {
            if(this.$element[0].id == "brightctrl")
            {
                var redpct = ((lastrgbcolor.rgb.r * 100) / 255).toFixed(0);
                var greenpct = ((lastrgbcolor.rgb.g * 100) / 255).toFixed(0);
                var bluepct = ((lastrgbcolor.rgb.b * 100) / 255).toFixed(0);

                startRGBWCallHWCallTimer(redpct, greenpct, bluepct, this.value);

            }
        }
    });

}




function constructSliderBar(currentdiv) {

    var bright_grad = document.createElement("div");
    bright_grad.className = "vert_brightness_grad";
    currentdiv.appendChild(bright_grad);

    var guageholder = document.createElement("div");
    guageholder.className = "vert_guage_holder";
    bright_grad.appendChild(guageholder);

    var bright_guage = document.createElement("input");
    bright_guage.type = "range";
    bright_guage.setAttribute("data-orientation","vertical");
    bright_guage.id = "brightctrl";
    guageholder.appendChild(bright_guage);




    $('input[type="range"]').rangeslider({
        polyfill : false,
        rangeClass: 'custom_slider_range',
        fillClass: 'custom_slider_fill',
        verticalClass: 'custom_rangeslider_vertical',

        onInit : function() {
            //  this.output = $( '<div class="range-output" />' ).insertAfter( this.$range ).html( this.$element.val() );
        },
        onSlideEnd : function( position, value ) {
            //  this.output.html( value );
            // var k = $("brightctrl");
            if(this.$element[0].id == "brightctrl")
            {
                document.getElementById("brightvalue").innerHTML = this.value;

                /* if (selected_fixture.type == "dim") {
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
                 }  */
            }

            /* else
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
             }  */

        }
    });

    // var bright_val = document.createElement("div");
    //  bright_val.className = "guage_value";
    // currentdiv.appendChild(bright_val);


    /*if(forfixture) {
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
     {*/
    //   bright_guage.value = 50;
    //    header.innerHTML = 50;
    //}
}