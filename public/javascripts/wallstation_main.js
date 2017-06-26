/**
 * Created by Nick on 3/23/2017.
 */
var selected_group = undefined;
var selectedfixtureobj = undefined;
var top_menu_selection = undefined;
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

            constructFixtureStatusBoxes("StatusPage", cachedconfig.fixtures);
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
                onSlideEnd : function( position, value ) {

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
            selectedfixtureobj = getFixtureByName(fixname);

            constructFixtureStatusBox(ctrlsholder, selectedfixtureobj, idx );  //status box

            if(selectedfixtureobj.type == "on_off")
            {
                constructONOFFCtrl(ctrlsholder);
            }
            if(selectedfixtureobj.type == "dim" || selectedfixtureobj.type == "cct") {
                constructBrightnessBar(ctrlsholder,true);
            }
            if(selectedfixtureobj.type == "cct") {
                constructColorTempBar(ctrlsholder,true);
            }
            if(selectedfixtureobj.type == "rgb")
            {
                constructControlRGB(ctrlsholder,idx);
            }
            if(selectedfixtureobj.type == "rgbw")
            {
                constructControlRGBW(ctrlsholder,idx);
            }

            if(selectedfixtureobj.type == "rgbwwcw")
            {
                constructControlRGBWWCW(ctrlsholder,idx);
            }
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

        if (selectedfixtureobj.type == "on_off") {
            var element = {};
            element.requesttype = "wallstation";
            element.name = selectedfixtureobj.assignedname;
            element.level = level;
            setFixtureLevel(element);
        }

    }

    on_off_toggle.checked = (selectedfixtureobj.level == 100);

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
        if (selectedfixtureobj.type == "dim") {
            bright_guage.value = selectedfixtureobj.level;
            header.innerHTML = selectedfixtureobj.level;
        }
        else {
            bright_guage.value = selectedfixtureobj.brightness;
            header.innerHTML = selectedfixtureobj.brightness;
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
        var min = Number(selectedfixtureobj.min);
        var max = Number(selectedfixtureobj.max);
        var range = max - min;
        var barval2 = ((Number(selectedfixtureobj.colortemp) - min) / range) * 100;


        ctemp_guage.value = barval2;
        header.innerHTML = selectedfixtureobj.colortemp;
    }
    else
    {
        var range = 6500 - 3500;
        var barval2 = ((Number(3500) - 2700) / range) * 100;
        ctemp_guage.value = barval2;
        header.innerHTML = 3500;
    }

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
