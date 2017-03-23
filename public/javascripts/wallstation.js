/**
 * Created by Nick on 3/23/2017.
 */
// client code behind for wallstation support

//global variables
var fixtureImagePath, fixtureImagePathfound;
var scenedivIDList = ["SceneButtonArray"];
var groupdivIDList = ["GroupButtonArray"];
var fixturedivIDList = ["FixtureButtonArray"];
var returnSceneList,returnGroupList;
// this must be the same as the html that shows these
var mainMenuOptionDivList = ["SceneButtonArray","GroupButtonArray","FixtureButtonArray","StatusButtonArray"];

function setglobalvariable(fixtureImagePathfound){
    console.log ("  here is the image path", fixtureImagePathfound);
    fixtureImagePath = fixtureImagePathfound;
};

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

    constructSceneButtons();
    constructGroupButtons();
    constructFixtureButtons();
    hideDivID("BrightnessBar");
    hideDivID("CCTBar");
    hideDivID("ToggleButton");
    hideDivID("occ_vac_switch");
    hideDivID("StatusPage");
    //showOnlyTheseButtons("Scenes");      // start here
}


function constructSceneButtons()
{
    var scenebuttonholder = document.getElementById("SceneButtonArray");
    scenebuttonholder.style.display="inline";
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

var selected_group = undefined;
var selected_fixture = undefined;
var top_menu_selection = undefined;

function constructGroupButtons()
{
    var groupbuttonholder = document.getElementById("GroupButtonArray");
    groupbuttonholder.style.display="inline";
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
                showDivID("BrightnessBar");
                hideDivID("CCTBar");
            }
            else
            {
                showDivID("BrightnessBar");
                showDivID("CCTBar");
            }
        }
        buttonholder.appendChild(groupbutton);
        var btnText = document.createTextNode(groupobj.name);
        groupbutton.appendChild(btnText);
    }
}



function constructFixtureButtons()
{
    var groupbuttonholder = document.getElementById("FixtureButtonArray");
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
            hideDivID("ToggleButton");

            switch(selected_fixture.type)
            {
                case "on_off":
                    showDivID("ToggleButton");
                    break;
                case "dim":
                    showDivID("BrightnessBar");
                    break;
                case "cct":
                    showDivID("BrightnessBar");
                    showDivID("CCTBar");
                    break;
                case "rgbw":
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
                            // do update here.
                        }
                        // else if (retval.error != undefined)
                        //  noty({text: 'Error invoking ' + retval.error, type: 'error'});
                    });
                }
                else if(selected_group.type == "ctemp")
                {
                    var ctempslider = document.getElementById("CCTsliderobject");
                    var ctemp = ctempslider.value;
                    var element = {};
                    element.name = selected_group.name;
                    element.ctemp = ctemp;
                    element.brightness = value;
                    setGroupToColorTemp(element, function (retval) {
                        if (retval != undefined)
                        {
                            cachedconfig = retval;
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
                    element.requesttype = "override";
                    element.name =  selected_fixture.assignedname;
                    element.level = value;
                    setFixtureLevel(element);
                    break;
                case "cct":

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
                element.requesttype = "override";
                element.name =  selected_fixture.assignedname;
                element.level = (value)?100:0;
                setFixtureLevel(element);
            }
            break;
        default:
            break;

    }
}




function postSetFixtureHandler(config)
{
    if (config != null) {
        cachedconfig = config;
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
                    element.ctemp = value;
                    element.brightness = bright;
                    setGroupToColorTemp(element, function (retval) {
                        if (retval != undefined)
                        {
                            cachedconfig = retval;
                            // do update here.
                        }
                        // else if (retval.error != undefined)
                        //  noty({text: 'Error invoking ' + retval.error, type: 'error'});
                    });
                }
            }
            break;

        default:
            break;
    }
}

function getStatus () {
    showDivID("StatusPage");
    hideDivID("BrightnessBar");
    hideDivID("CCTBar");
    hideDivID("ToggleButton");
    hideDivID("occ_vac_switch");
    var nameArray = [];
    var typeArray =[];
    var uidArray =[];
    var powerArray = [];
    var pctlevelArray = [];
    var daylightlimitArray = [];
    var cctlevelArray =[];
    var i=0;
    //var fixtureImagePath = "images/suspended_linear120x120.jpg";    // set default in case none assigned

    $.get("/status/getstatus", function(data, status){
        console.log ("Got the status bonehead ", data);
        var statusdata = JSON.parse(data);
        //console.log ("JSON is ", statusdata);
        var fixlist = statusdata.fixtures;
        var fixarray = Object.keys(fixlist);
        //console.log ("this is the fixtures object ", fixlist);
        //console.log ("this is the fixtures array ", fixarray);
        for (var key in statusdata.fixtures) {
            var fixobj = statusdata.fixtures[key];
            //console.log ("This is the fixobj ", fixobj);
            nameArray[i] = fixobj.fixture.name;
            typeArray[i] = fixobj.fixture.type;
            uidArray[i] = fixobj.fixture.uid;
            powerArray[i] = (fixobj.status.current * 24).toFixed(1);
            pctlevelArray[i] = fixobj.status.currentlevels.levelpct;
            if (typeArray[i] == "cct") {
                cctlevelArray[i] = fixobj.status.currentlevels.ctemp;
                //pctlevelArray[i] = fixobj.status.lastuserintensity;
                //cctlevelArray[i] = fixobj.status.lastusercolortemp;
            } else { cctlevelArray[i] = "N/A";  }

            daylightlimitArray[i] = fixobj.status.isdaylightlimited;
            var divID = "StatusBlock"+(i+1);
            $.get("/config/getconfig", function(data, status){
                //console.log ("CONFIG JSON is ", data);
                for(var j=0; j < data.fixtures.length; j++) {
                    //console.log( " here are the two ", data.fixtures[j].uid, fixobj.fixture.uid);
                    if (data.fixtures[j].uid == fixobj.fixture.uid) {
                        console.log ("Ding ding ding found a match", data.fixtures[j].image);
                        var fixtureImagePathfound = data.fixtures[j].image;
                    }
                }
                setglobalvariable(fixtureImagePathfound);
            });
            //var fixtureImagePath = "/images/suspended_linear.jpg";   //default
            switch (typeArray[i]){
                case 'cct':
                    fixtureImagePath = "/images/2x2_flat_panel.jpg";
                    break;
                case 'dim':
                    fixtureImagePath = "/images/suspended_linear.jpg";
                    break;
                case 'on_off':
                    fixtureImagePath = "/images/ceiling_spotlight.jpg";
                    break;
                case 'rgbw':
                    fixtureImagePath = "/images/rgbw_fixture.jpg";
                    break;
                default:
                    fixtureImagePath = "/images/bulb_on.jpg";

            }
            createFixtureStatusTable(divID,nameArray[i],typeArray[i],uidArray[i],fixtureImagePath,
                powerArray[i],pctlevelArray[i],cctlevelArray[i],daylightlimitArray[i]);
            i=i+1;
        }

        var input = 0;
        for (var key in statusdata.zero2ten) {
            var val = ((statusdata.zero2ten[key]*10).toFixed(0)) + " %";
            var numval = ((statusdata.zero2ten[key]*10).toFixed(0));
            var label = document.getElementById("input" + (input + 1));
            var labeldiv = document.getElementById("input" + (input + 1) +"div");

            console.log ("numval is ", numval);
            label.innerHTML = val;
            //document.getElementById("input1div").style.height = (175-(175*numval)) +"px";
            labeldiv.style.height = (175-(175*(numval/100))) +"px";
            console.log ("labeldiv is ",labeldiv);
            input++;
        }

        if(statusdata.plcoutput != undefined) {
            for (var input = 0; input < statusdata.plcoutput.length; input++) {
                var label = document.getElementById("output" + (input + 1));
                var level = statusdata.plcoutput[input];
                if (level == "ON") {label.style.background = "green";}
                else {label.style.background = "red";}

                label.innerHTML = level;
            }
        }

        if(statusdata.daylightlevelvolts != undefined)
        {
            var fc = voltageToFC(statusdata.daylightlevelvolts);
            //var dllabel = statusdata.daylightlevelvolts.toFixed(2) + " V  -- " + fc;
            document.getElementById("DaylightLevelReading").style.background = "yellow";
            document.getElementById("DaylightLevelReading").style.color = "black";
            document.getElementById("DaylightLevelReading").innerHTML = "Current light meter: " + fc+" FC";
        }

        if(statusdata.wetdrycontacts != undefined)
        {
            input = 0;
            for (var key in statusdata.wetdrycontacts) {
                var level = statusdata.wetdrycontacts[key];
                var name = "wdc"+ (input+1);
                var label = document.getElementById(name);
                if (level == "1") {label.style.background = "green";}
                else {label.style.background = "red";}
                label.innerHTML = level;
                input++;
            }
        }

        var occ_or_vac =  statusdata.occupancy;
        var occlabel;
        if (occ_or_vac = "Occupied") {occlabel = "Occupied";}
        else {occlabel = "Vacant";}
        console.log ("  Currently it is ", occ_or_vac);
        document.getElementById("occ_state").style.background = "orange";
        document.getElementById("occ_state").style.color = "black";
        document.getElementById("occ_state").style.textAlign = "center";;
        document.getElementById("occ_state").innerHTML = occlabel;


    });
}  // get status


function createAllSceneButtons (divIDList) {
    // This is broken into a loop of individual button creations so that if you want to put the buttons in differnet div's you can based on divIDList
    // if all in one divIDList then it is an array with one element.  Otherwise restructure so divIDList elements are handed to button gen fx
    //console.log ("sending back data is ",returnSceneList);
    var divID = divIDList[0];
    for(var i = 0; i < returnSceneList.length; i++) {
        var sceneName = returnSceneList[i];
        var buttonText = beatifyText(returnSceneList[i]);
        if (sceneName != "----") {
            createSceneButton (divID,sceneName,buttonText);
            //console.log ("creating dynamic button ", buttonText, sceneName);
        }
    }

}

function createSceneButton (divID,sceneName,buttonText) {
    var select = document.getElementById(divID);
    var btn = document.createElement("button");
    btn.value = buttonText;
    btn.id = buttonText;
    btn.onclick = function(){invokeScene(sceneName);}
    btnText = document.createTextNode(buttonText);
    btn.appendChild(btnText);
    select.appendChild(btn);
    // Uncomment the next 2 lines if you want a new line between the buttons
    //var br = document.createElement("BR");
    //select.appendChild(br);

}


function createAllGroupButtons (divIDList,GroupList) {
    // groupList is array of records, each record has {"name","type","fixtures"}.  fixtures is an array of UID's
    // create a toggle for Occ/Vac emulation/test
    console.log ("groupList is ", GroupList);
    var divID = divIDList[0];
    for(var i = 0; i < GroupList.length; i++) {
        var groupName = GroupList[i].name;
        var groupType = GroupList[i].type;
        var groupFixtures = GroupList[i].fixtures;
        var buttonText = beatifyText(GroupList[i].name);
        if (groupName != "") {
            createGroupButton (divID,groupName,groupType,groupFixtures,buttonText);
        }
    }

}

function createGroupButton (divID,groupName,groupType,groupFixtures,buttonText) {
    console.log ("creating group button ",groupName, buttonText);
    var select = document.getElementById(divID);
    var btn = document.createElement("button");
    btn.value = buttonText;
    btn.id = buttonText;
    btn.name = groupName;
    if (groupType == "ctemp") { btn.style.backgroundColor = "lightblue";}   // differentiate CCT groups
    btn.onclick = function(){groupAction(groupName,groupType,groupFixtures);}
    btnText = document.createTextNode(buttonText);
    btn.appendChild(btnText);
    select.appendChild(btn);

}


function groupAction (groupName,groupType,groupFixtures) {
    console.log ("Got to the group action routine for group ", groupName, groupType, groupFixtures);
    // present slider and then send group that level....
    // "http://localhost:3000/groups/setgrouptolevel",  {    "name": "All",    "level": "44" }
    showDivID("occ_vac_switch");    // available for all group types
    if (groupType == "ctemp") {
        showDivID ("CCTBar")
        showDivID("BrightnessBar");
        hideDivID("ToggleButton");
    }
    else if (groupType == "brightness")
    {
        hideDivID("CCTBar");
        hideDivID("ToggleButton");
        showDivID("BrightnessBar");

    }   // todo else RGB/W  (do not have yet);  on_off are members of brightness group
    var occ_vac = document.getElementById("OccVacObject");
    var slide = document.getElementById('brightnesssliderobject');
    var cctslide = document.getElementById("CCTsliderobject");


    slide.onchange = function() {
        //sliderDiv.innerHTML = this.value;
        sliderValue = slide.value;
        var element = {};
        element.name = groupName;
        element.level = sliderValue;

        var dataset = JSON.stringify(element);
        console.log ("Saw a change in slider value ", dataset);
        $.ajax({
            url: "/groups/setgrouptolevel",
            type: 'post',
            data: dataset,
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function (series) {

            },
            error: function (xhr, ajaxOptions, thrownError) {

                alert ("ERROR: Unable to change level");
            }
        });

        cctslide.onchange = function() {
            //sliderDiv.innerHTML = this.value;
            cctsliderValue = cctslide.value;
            var element = {};
            element.name = groupName;
            element.ctemp ={};
            var createcct = (2000 + (4500*cctsliderValue/100)); // todo - change to min/max 2500 - 6500
            element.ctemp = createcct;
            var dataset = JSON.stringify(element);
            console.log ("Saw a change in slider value ", dataset);
            $.ajax({
                url: "/groups/setgrouptocolortemp",
                type: 'post',
                data: dataset,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                success: function (series) {

                },
                error: function (xhr, ajaxOptions, thrownError) {

                    alert ("ERROR: Unable to change level");
                }
            });
        }

        occ_vac.onchange = function() {
            toggleValue = occ_vac.checked;
            var element = {};
            element.groupname = groupName;
            var dataset = JSON.stringify(element);
            if (toggleValue) {
                console.log ("Saw an occupancy event to group ", groupName);
                $.ajax({
                    url: "/tester/sendoccupancytogroup",
                    type: 'post',
                    data: dataset,
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    success: function (series) {
                        console.log ("Sent occ_vac message", urltouse, groupName);
                    },
                    error: function (xhr, ajaxOptions, thrownError) {

                    }
                });
            }
            else {
                console.log ("Saw a vacancy event to group ", groupName);
                $.ajax({
                    url: "/tester/sendvacancytogroup",
                    type: 'post',
                    data: dataset,
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    success: function (series) {
                        console.log ("Sent occ_vac message", urltouse, groupName);
                    },
                    error: function (xhr, ajaxOptions, thrownError) {

                    }
                });

            }
// {urltouse = "/tester/sendvacancytogroup"}
        }

    }




}
var FixtureList;
function getFixtureList () {

    $.get("/config/getconfig", function(data, status){
        //var jsonData = JSON.parse(data);
        FixtureList = data.fixtures;
        var numberoffixtures = FixtureList.length;
        //console.log ("There were ", numberoffixtures , " fixtures");
        createAllFixtureButtons (fixturedivIDList,FixtureList);
    });
}

function createAllFixtureButtons (divIDList,FixtureList) {
    // groupList is array of records, each record has {"name","type","fixtures"}.  fixtures is an array of UID's
    //console.log ("Fixture List  is ",FixtureList);
    //console.log ("DivID is", divIDList);
    /*
     "fixtures": [    {
     "assignment": [ 1   ],
     "name": "TEST_FIX_DIM_A",
     "uid": "192_168_1_100_1",
     "type": "dim",
     "globalgroups": 0,
     "localgroups": "",
     "status": 0,
     "image": "/images/bulb_off.jpg"
     "zero2teninputs": [],
     "contactinputs": [],
     "parameters": {
     "dimoptions": "1",
     "dimrate": "0",
     "brightenrate": "0",
     "resptoocc": "-1",
     "resptovac": "0",
     "resptodl50": "0",
     "resptodl40": "10",
     "resptodl30": "25",
     "resptodl20": "50",
     "resptodl10": "75",
     "resptodl0": "100",
     "daylightceiling": "100",
     "manualceiling": "100",
     "daylightfloor": "0",
     "manualfloor": "0"
     }*/
    var divID = divIDList[0];
    for(var i = 0; i < FixtureList.length; i++) {
        var fixtureName = FixtureList[i].name;
        var fixtureUID = FixtureList[i].uid;
        var fixtureType = FixtureList[i].type;
        var fixtureImage = FixtureList[i].image;
        var buttonText = beatifyText (FixtureList[i].name);
        if (fixtureName != "") {
            createFixtureButton (divID,fixtureName,fixtureUID,fixtureType,fixtureImage,buttonText);
        }
    }

}

function createFixtureButton (divID,fixtureName,fixtureUID,fixtureType,fixtureImage,buttonText) {
    console.log ("creating fixture button ",fixtureName, buttonText);
    var select = document.getElementById(divID);
    var btn = document.createElement("button");
    var pictureframe = document.createElement('DIV');
    var textframe = document.createElement('DIV');
    var img = document.createElement('img');
    //var scaledimage = resizeImg(fixtureImage, 20, 20);
    img.src = fixtureImage;
    img.style.width = "50px";
    img.style.height = "50px";
    img.style.paddingRight = "10px";
    pictureframe.id = fixtureUID + "picture_cell";
    pictureframe.appendChild(img);
    btnText = document.createTextNode(buttonText);
    //btnText.style.verticalAlign = "top";
    pictureframe.appendChild(btnText);
    btn.value = buttonText;
    btn.id = fixtureUID;
    btn.onclick = function(){fixtureAction(fixtureName,fixtureUID,fixtureType);}
    btn.appendChild(pictureframe);
    //btn.appendChild(btnText);
    select.appendChild(btn);

}
function fixtureAction (fixtureName,fixtureUID,fixtureType) {
    console.log ("Got to the fixture action routine ", fixtureName, fixtureUID, fixtureType);
    var brightslide = document.getElementById('brightnesssliderobject');
    var cctslide = document.getElementById("CCTsliderobject");
    var toggleslide = document.getElementById("ToggleObject");
    brightSliderValue = brightslide.value;
    cctsliderValue = cctslide.value;
    toggleValue = toggleslide.checked;
    console.log ("The two slider values are ", brightSliderValue, cctsliderValue);
    console.log ("The togglevalue is ", toggleValue);


    if (fixtureType == "cct") {
        showDivID ("CCTBar")
        showDivID("BrightnessBar");
        hideDivID("ToggleButton");
    }
    else  if (fixtureType == "on_off") {
        showDivID ("ToggleButton");
        hideDivID("CCTBar");
        hideDivID("BrightnessBar");
    }
    else if (fixtureType == "dim")
    {
        hideDivID("CCTBar");
        hideDivID("ToggleButton");
        showDivID("BrightnessBar");

    }   // else RGB/W (do not have yet)
    /*  Format for a dim fixture set level
     {
     "requesttype": "override",
     "uid": "192_168_1_100_1",
     "dim": {   "levelpct": "50"  }
     }
     format for setting CCT fixture - NOTE you need BOTH intensity AND CCT values to be submitted.
     {
     "requesttype": "override",
     "uid": "192_168_1_100_3",
     "cct":
     {
     "levelpct": "50",
     "ctemp": "3000"
     }
     {
     "requesttype": "override",
     "uid": "192_168_1_100_2",
     "on_off": { "levelpct": "100"  }
     },

     */

    brightslide.onchange = function() {
        //sliderDiv.innerHTML = this.value;
        brightSliderValue = brightslide.value;
        cctsliderValue = cctslide.value;
        var element = {};
        element.requesttype = "wallstation";
        element.uid = fixtureUID;
        if (fixtureType == "cct") {   // cct fixtures require both intensity and CCT passed to it
            element.cct ={};
            element.cct.levelpct = brightSliderValue;
            var createcct = (2000 + (4500*cctsliderValue/100)); // todo - change to min/max 2500 - 6500
            element.cct.ctemp = createcct;
        }
        else  {
            element.dim ={};
            element.dim.levelpct = brightSliderValue;
        }
        var dataset = JSON.stringify(element);
        console.log ("Saw a change in slider value ", dataset);
        $.ajax({
            url: "/setfixturelevel",
            type: 'post',
            data: dataset,
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function (series) {
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert ("ERROR: Unable to change level");
            }
        });
    }

    cctslide.onchange = function() {
        //sliderDiv.innerHTML = this.value;
        cctsliderValue = cctslide.value;
        var element = {};
        element.requesttype = "wallstation";
        element.uid = fixtureUID;
        element.cct ={};
        element.cct.levelpct = brightSliderValue;
        var createcct = (2000 + (4500*cctsliderValue/100)); // todo - change to min/max 2500 - 6500
        element.cct.ctemp = createcct;
        var dataset = JSON.stringify(element);
        console.log ("Saw a change in slider value ", dataset);
        $.ajax({
            url: "/setfixturelevel",
            type: 'post',
            data: dataset,
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function (series) {

            },
            error: function (xhr, ajaxOptions, thrownError) {

                alert ("ERROR: Unable to change level");
            }
        });
    }

    toggleslide.onchange = function() {
        toggleValue = toggleslide.checked;
        var element = {};
        element.requesttype = "wallstation";
        element.uid = fixtureUID;
        element.on_off ={};
        if (toggleValue) {element.on_off.levelpct = 100} else {element.on_off.levelpct = 0}
        var dataset = JSON.stringify(element);
        console.log ("Saw a change in toggle value ", dataset);
        $.ajax({
            url: "/setfixturelevel",
            type: 'post',
            data: dataset,
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function (series) {
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert ("ERROR: Unable to change level");
            }
        });
    }

}
function toggleDivIDVisible(DivID)
{
    var elem=document.getElementById(DivID);
    var hide = elem.style.display =="none";
    if (hide) {
        elem.style.display="inline";
    }
    else {
        elem.style.display="none";
    }
}
function showDivID (DivID) {
    var elem=document.getElementById(DivID);
    elem.style.display="inline";
}
function hideDivID (DivID) {
    var elem=document.getElementById(DivID);
    elem.style.display="none";
    console.log("Hiding DIV", DivID);
}

function showOnlyTheseButtons (whichButtons) {
    // Hide all of them and then make visible the one chosen
    top_menu_selection = whichButtons;

    hideDivID("BrightnessBar");
    hideDivID("occ_vac_switch");
    hideDivID("CCTBar");
    hideDivID("ToggleButton");
    hideDivID("StatusPage");
    hideDivID("ConfigPage");
    var x;
    for(var i = 0; i < mainMenuOptionDivList.length; i++) {
        x = document.getElementById(mainMenuOptionDivList[i]);
        x.style.display = "none";
        console.log ("which button was pressed: ",whichButtons, x);
    }
    switch (whichButtons){
        case 'Scenes':
            showDivID("SceneButtonArray");
            break;
        case 'Groups':
            showDivID("GroupButtonArray");
            break;
        case 'Fixtures':
            showDivID("FixtureButtonArray");
            break;
        case 'Status':
            showDivID("StatusPage");
            for(var i = 0; i < 8; i++) {
                cleanUpList("StatusBlock"+(i+1));
            }
            getStatus ();
            break;
        case 'Config':
            showDivID("ConfigPage");
            break;
    }

}

function cleanUpList (passedID) {
    var list = document.getElementById(passedID);
    // If the element has any child nodes, remove its first child node until they are all gone.
    while (list.hasChildNodes()) {
        list.removeChild(list.childNodes[0]);
    }
}

function beatifyText(InputText) {
    var str = InputText;
    var res = str.replace(/_/g, " ");
    return res;
}
//  http://localhost:3000//config/getconfig

function createFixtureStatusTable(divID,fixtureName,fixtureType,fixtureUID,fixtureImage,fixturePower,fixtureLevel,fixtureCCT, fixtureDLLimited) {
    // Declare global variables and create the header, footer, and caption.
    console.log ("fixture image  is ", fixtureImage);
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
    oTDpicture.id = fixtureUID + "picture_cell";

    oTDdimlevel.innerHTML = "Level";
    oTDdimlevel.className = "dimleveldiv";
    var para = document.createElement("H2");                       // Create a <p> element
    if (fixtureType != "rgbw") {
        var p = document.createTextNode(fixtureLevel+ "%");}
    else { var p = document.createTextNode("N/A");   }
    para.appendChild(p);
    oTDdimlevel.appendChild(para);
    oTDdimlevel.id = fixtureUID + "dimlevel_cell";

    //console.log ("fixtureType was ", fixtureType);
    oTDcctstatus.innerHTML = "CCT Level ";
    oTDcctstatus.className = "cctstatusdiv";
    var para = document.createElement("H3");
    if (fixtureType == "cct") {
        var p = document.createTextNode(fixtureCCT+ "K");  }
    else { var p = document.createTextNode("N/A");  }
    para.appendChild(p);
    oTDcctstatus.appendChild(para);
    oTDcctstatus.id = fixtureUID + "cctlevel_cell";

    oTDpowerlevel.innerHTML = "Power Level";
    var para = document.createElement("H1");                       // Create a <p> element
    var p = document.createTextNode(fixturePower+ " W");
    para.appendChild(p);
    oTDpowerlevel.appendChild(para);
    oTDpowerlevel.className = "powerleveldiv";

    oTDpowerlevel.id = fixtureUID + "powerlevel_cell";

    oTDdaylight.innerHTML = "Daylight Limited";
    oTDdaylight.className = "daylightdiv";
    var img = document.createElement('img');
    if (fixtureDLLimited) {
        img.src = "images/sun40x40.jpg";
    } else {img.src = "/images/handtinytrans.gif"}
    oTDdaylight.appendChild(img);
    oTDdaylight.id = fixtureUID + "daylight_cell";

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

function SetDaylightPolling (seconds2wait) {
    console.log ("seconds are: ", seconds2wait);
    var element = {};
    element.interval = seconds2wait;
    var dataset = JSON.stringify(element);
    console.log ("Sending daylight polling request", dataset);
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