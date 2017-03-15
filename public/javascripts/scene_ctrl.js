/**
 * Created by Nick on 3/13/2017.
 */


var selecteditem;
var defaultcolor = "rgba(0,0,0,0)";
var selected_scene;

$(function () {
    // click handler for boxes.. just under test.
    $('.dropzone2').live('click', function(){

        // 3/15/17, remove any thing else that is highlighted,
        // remove any selected items from table X
        $('#fixturetable > tbody  > tr').each(function() {
            $(this).removeClass('active');
        });
        var fixsetting = document.getElementById("fixturesettingsdiv");  // clear the control
        fixsetting.innerHTML = ""; //clear


        var x = $(this).css('backgroundColor');
        var selecteditemthistime = $(this);
        // if selected item is not ud , and it does not equal the current.
        // then disable the current,
        if(selecteditem != undefined && selecteditem.get(0) != selecteditemthistime.get(0))
        {

            selecteditem.css("border-color", defaultcolor);
            selecteditem.droppable("option", "disabled", true);
            enableDisableFixturesInDiv(selecteditem, false);

            $(this).css("border-color", "blue");
            selecteditem = selecteditemthistime; //$(this);
            enableDisableFixturesInDiv(selecteditem, true);
            $(this).droppable("option", "disabled", false);

            var selectedindex = selecteditem.attr('index');

            selected_scene = cachedconfig.scenes[Number(selectedindex)];
            filterAvalibleFixtures();

        }
        else if(selecteditem == undefined)
        {
            $(this).css("border-color", "blue");
            selecteditem = selecteditemthistime; //$(this);
            enableDisableFixturesInDiv(selecteditem, true);
            $(this).droppable("option", "disabled", false);

            var selectedindex = selecteditem.attr('index');
            selected_scene = cachedconfig.scenes[Number(selectedindex)];
            filterAvalibleFixtures();
        }
    });

});

function redrawScenes()
{
    var groups_div = document.getElementById("active_groups_holder");
    groups_div.innerHTML = "";
    for(var i = 0; i < cachedconfig.scenes.length; i++)
    {
        var scene = cachedconfig.scenes[i];
        constructSceneBox(groups_div, scene,i);
    }
}

function redrawGroup(groupname)
{
    var groups_div = document.getElementById("active_groups_holder");

    $('.group_holder_0 div').remove();
    // groups_div.innerHTML = "";
    //for(var i = 0; i < loadedconfig.groups.length; i++)
    //{
    //    var group = loadedconfig.groups[i];
    //    constructSceneBox(groups_div, group,i);
    // }
    //.
}

function openNewSceneEditDlg()
{
    bootbox.confirm("<form id='infos' action=''>\
    Scene Name:<input type='text' id='group_name' /><br/>\
    </form>", function(result) {
        if(result) {
            var grouptype = $('#grouptype').val();
            var scenename = $('#group_name').val();
            if(scenename.length > 0) {  //todo validate its unique.
                var groups_div = document.getElementById("active_groups_holder");
                var scene = {};
                scene.name = scenename;

                saveConfigObject("scene", scene,function (retval) {
                    if(retval != undefined)  // as of 1/24/17, added version.
                    {
                        cachedconfig = retval;
                        var grpnum = cachedconfig.scenes.length-1;
                        constructSceneBox(groups_div, scene, grpnum);
                    }
                    else
                        noty({text: 'Error creating group ', type: 'error'});
                });
            }
            else
                noty({text: 'Incomplete Name, please try again ', type: 'error'});
        }
    });
}


function createNewScene()
{
    openNewSceneEditDlg();
}
function enableDisableFixturesInDiv(groupdiv, enable)
{
    //var test = document.getElementById(groupdiv.attr('id'));
    var kids = groupdiv.children();
    for(var i = 0; i < kids.length; i++ )
    {
        var fixdiv = kids[i];
        // fixdiv.draggable( "option", "disabled", !enable );
        $(fixdiv).draggable({disabled:!enable});
    }
}


function deleteSelScene()
{
    deleteConfigObject("scene",selected_scene,function (retval) {
        //deleteConfigObject(selected_scene.name, function (retval) {
        if(retval != undefined)  // as of 1/24/17, added version.
        {
            cachedconfig = retval;
            selected_scene = undefined;
            redrawScenes();

            filterAvalibleFixtures();
        }
        else
            noty({text: 'Error deleting group: ' + retval, type: 'error'});
    });
}

function filterAvalibleFixtures()
{
    var filteredlist = [];
    // var groupobj = selected_scene;

    if(selected_scene != undefined)
    {
        // var type = selected_scene.type;
        // first filter what the group already has in it,
        var fixtures =  cachedconfig.fixtures;
        for(var i = 0; i < fixtures.length; i++) {
            var fix = fixtures[i];

            var include = true;
            // now check if its in the fixture is already in the grup.

            for(var k = 0; k < selected_scene.fixtures.length; k++)
            {
                var fixname = selected_scene.fixtures[k].name;
                if(fixname == fix.assignedname)
                {
                    include = false;
                    break;
                }
            }

            if (include)
                filteredlist.push(fix);

        }
    }

    var fixturebucketdiv = document.getElementById("fixholder");
    fixturebucketdiv.innerHTML = ""; // blank it out.

    for(var i = 0; i < filteredlist.length; i++) {

        var fix = filteredlist[i];
        var fixdiv = document.createElement("div");
        fixdiv.className = "availiblefixture";
        //fixdiv.id = "fixture_"+fix.id;
        fixturebucketdiv.appendChild(fixdiv);

        var bulb_iconimg = document.createElement("img");
        bulb_iconimg.src = fix.image;
        bulb_iconimg.className = "bulbiconrow";
        fixdiv.appendChild(bulb_iconimg);


        var debug_label = document.createElement("label");
        debug_label.innerHTML  = fix.assignedname;
        fixdiv.appendChild(debug_label);

    }


    $('.availiblefixture').draggable({
        appendTo: 'body',
        revert: "invalid",
        scroll: false,
        zIndex: 100,
        helper: function() {
            return $("<div id='testitem'>Moving</div>")[0];
        },
        start: function(event, ui) {
            $(this).hide();
        },
        stop: function(event, ui) {
            $(this).show();
        }
    });


    $('.availiblefixturesholder').droppable({
        tolerance: 'touch',
        drop: function(event, ui) {
            var dropped = ui.draggable;
            var droppedOn = $(this);
            //  $(dropped).parent().droppable("enable");
            $(dropped).detach().appendTo(droppedOn);
            // when droppede on, we need to remove it from the selected group.
            var name = dropped.get(0).innerText;
            //var uid = fixtureNameToUID(name);
            if (name != undefined) {
                var updatelayout = selected_scene.fixtures.length == 4;  // if going from 4--> 3

                var index = selected_scene.fixtures.indexOf(name);
                if (index > -1) {
                    selected_scene.fixtures.splice(index, 1);
                }
                var element = {};
                element.scenename = selected_scene.name;
                element.fixturename = name;

                deleteFixtureFromScene(element,function (retval) {
                    if(retval != undefined)  // as of 1/24/17, added version.
                    {
                        cachedconfig = retval;
                    }
                    else if(retval.error != undefined)
                        noty({text: 'Error saving config ' + retval.error, type: 'error'});
                });


                if (updatelayout)
                {
                    var selectedindex = selecteditem.attr('index');
                    // var k = $('.selecteditem').attr('id');
                    // this should be a "group_X",
                    //   var num = k.substr(6);
                    var bla = document.getElementById("group_holder_"+selectedindex);
                    bla.className = "col-lg-5";
                }

            }
            //  droppedOn.droppable("disable");
        }
    });
    // $(".availiblefixture").draggable();
    // $(".dropzone2").droppable();

}

function captureScenceSettings()
{
    var k = 0;
    k = k + 1;

}

function constructSceneBox(currentdiv, scene, groupnum) {
    var fixcol = document.createElement("div");
    fixcol.className = "col-lg-5";
    fixcol.id = "group_holder_"+groupnum;

    if(scene.fixtures != undefined && scene.fixtures.length >= 4)
        fixcol.className = "col-lg-10";

    currentdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "box";
    fixcol.appendChild(fixbox);

    var fixboxheader = document.createElement("div");
    fixboxheader.className = "box-header";
    fixbox.appendChild(fixboxheader);


    var capturesettings = document.createElement("input");
    capturesettings.className = "btn btn-large btn-primary";
    capturesettings.type = "button";
    capturesettings.value = "capture settings";
    capturesettings.setAttribute('scene', scene.name);
    capturesettings.onclick = function () {

        var scenename = this.getAttribute('scene');
        var element = {};
        element.name = scenename;
        saveFixtureSettingsToScene(element,function (retval) {
            if(retval != undefined)  // as of 1/24/17, added version.
            {
                cachedconfig = retval;
            }
            else if(retval.error != undefined)
                noty({text: 'Error saving config ' + retval.error, type: 'error'});
        });
    };
    fixboxheader.appendChild(capturesettings);



    var btinvokescene = document.createElement("input");
    btinvokescene.className = "btn btn-large btn-primary";
    btinvokescene.type = "button";
    btinvokescene.value = "invoke";
    btinvokescene.setAttribute('scene', scene.name);
    btinvokescene.onclick = function () {
        var scenename = this.getAttribute('scene');
        var element = {};
        element.name = scenename;
        invokescene(element,function (retval) {
            if(retval != undefined)  // as of 1/24/17, added version.
            {
                cachedconfig = retval;
            }
            else if(retval.error != undefined)
                noty({text: 'Error invoking ' + retval.error, type: 'error'});
        });
    };
    fixboxheader.appendChild(btinvokescene);




    var header = document.createElement("h2");
    header.innerHTML = scene.name;
    fixboxheader.appendChild(header);

    var fixcontent = document.createElement("div");
    fixcontent.className = "box-content";
    fixbox.appendChild(fixcontent);

    var dropzonediv = document.createElement("div");
    dropzonediv.className = "dropzone2";
    dropzonediv.id = "group_"+groupnum;
    dropzonediv.setAttribute("index",groupnum);
    // dropzonediv.innerHTML = "test";
    fixcontent.appendChild(dropzonediv);



    $('.dropzone2').droppable({
        tolerance: 'touch',
        drop: function(event, ui) {
            var dropped = ui.draggable;
            var droppedOn = $(this);
            // $(dropped).parent().droppable("enable");
            $(dropped).detach().appendTo(droppedOn);
            var name = dropped.get(0).innerText;
            var updatelayout = false;
            if (name != undefined) {

                // 1/28/17, make sure its not already in the array:
                if(selected_scene.fixtures == undefined)
                    return;

                selected_scene.fixtures.push(name);

                var element = {};
                element.scenename = selected_scene.name;
                element.fixturename = name;
                element.type = getFixtureByName(name).type;

                addFixtureToScene(element,function (retval) {
                    if(retval != undefined && retval.version != undefined)  // as of 1/24/17, added version.
                    {
                        cachedconfig = retval;
                    }
                    else if(retval.error != undefined)
                        noty({text: 'Error saving fixture to group: ' + retval.error, type: 'error'});
                });

                if (selected_scene.fixtures != undefined && selected_scene.fixtures.length == 4)  // if going from 2-->3
                {
                    var k = $(this).attr('id');
                    // this should be a "group_X",
                    var num = k.substr(6);
                    var bla = document.getElementById("group_holder_"+num);
                    bla.className = "col-lg-10";
                }
            }
        }
    });
    // now add in the existing fixutres:
    for(var i = 0; i < scene.fixtures.length; i++)
    {
        var fixname = scene.fixtures[i].name;
        var fixobj = getFixtureByName(fixname);
        if(fixobj != undefined) {
            var fixdiv = document.createElement("div");
            fixdiv.className = "availiblefixture";
            dropzonediv.appendChild(fixdiv);
            var bulb_iconimg = document.createElement("img");
            bulb_iconimg.src = fixobj.image;
            bulb_iconimg.className = "bulbiconrow";
            fixdiv.appendChild(bulb_iconimg);
            var debug_label = document.createElement("label");
            debug_label.innerHTML = fixobj.assignedname;
            fixdiv.appendChild(debug_label);
        }
    }


    var test = $(dropzonediv);
    enableDisableFixturesInDiv(test,false);
    $(dropzonediv).droppable("option", "disabled", true);
}



function getFixtureByName(name)
{
    for(var i = 0 ; i < cachedconfig.fixtures.length; i++)
    {
        var fixobj = cachedconfig.fixtures[i];
        if(name == fixobj.assignedname)
            return fixobj;
    }
    return undefined;
}


