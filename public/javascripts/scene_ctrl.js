/**
 * Created by Nick on 3/13/2017.
 */


var selecteditem;
var defaultcolor = "rgba(0,0,0,0)";
var selected_scene;


// These are the constraints used to validate the form
var constraints = {
    name: {
        length: {
            minimum: 3,
            maximum: 15
        },
        format: {
            pattern: "[a-z0-9_]+",
            flags: "i",
            message: "Name can only contain a-z ,0-9, and _"
        },
        presence: true
    }
}
$(function () {
    // click handler for boxes.. just under test.
    $('.scene_dropzone').live('click', function(){

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
            //disable action buttons on all ,
            for(var k = 0; k <  cachedconfig.scenes.length; k++)
            {
                var disableele = '#actionbuttons_'+k;
                $(disableele).children().addClass('disabled');
                $(disableele).children().removeClass('active');
            }


            selecteditem.css("border-color", defaultcolor);
            selecteditem.droppable("option", "disabled", true);
            enableDisableFixturesInDiv(selecteditem, false);

            $(this).css("border-color", "blue");
            selecteditem = selecteditemthistime; //$(this);
            enableDisableFixturesInDiv(selecteditem, true);
            $(this).droppable("option", "disabled", false);

            var selectedindex = selecteditem.attr('index');

            var btns = document.getElementById("actionbuttons_0");


            var enableelement = '#actionbuttons_'+selectedindex;
            $(enableelement).children().removeClass('disabled');
            $(enableelement).children().addClass('active');


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

            var enableelement = '#actionbuttons_'+selectedindex;
            $(enableelement).children().removeClass('disabled');
            $(enableelement).children().addClass('active');

            selected_scene = cachedconfig.scenes[Number(selectedindex)];
            filterAvalibleFixtures();
        }
    });

});

function redrawScenes()
{
    var groups_div = document.getElementById("active_scenes_holder");

    if(groups_div == undefined)
        return;

    groups_div.innerHTML = "";
    for(var i = 0; i < cachedconfig.scenes.length; i++)
    {
        var scene = cachedconfig.scenes[i];
        constructSceneBox(groups_div, scene,i);
    }
}

function redrawGroup(groupname)
{
    var groups_div = document.getElementById("active_scenes_holder");

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
    var box = bootbox.confirm("<form id='infos' action=''>\
    Scene Name:<input type='text' id='scene_name' /><br/>\
    </form>", function(result) {
        if(result) {
            var grouptype = $('#grouptype').val();
            var scenename = $('#scene_name').val();
            if(scenename.length > 0) {  //todo validate its unique.
                var groups_div = document.getElementById("active_scenes_holder");
                var scene = {};
                scene.name = scenename;


                if(scenename == "ALL_ON" || scenename == "ALL_OFF")
                {
                    noty({text: 'Error: scene name reserved  ', type: 'error'});
                    return ;
                }



                var j = validate({name: scenename}, constraints);
                if(j != undefined && j.name != undefined && j.name.length > 0)
                {
                    noty({text: j.name[0], type: 'error', timeout:1000});
                    return false;
                }



                saveConfigObject("scene", scene,function (retval) {
                    if(retval != undefined)  // as of 1/24/17, added version.
                    {
                        cachedconfig = retval;
                        var grpnum = cachedconfig.scenes.length-1;
                        constructSceneBox(groups_div, scene, grpnum);
                    }
                    else
                        noty({text: 'Error creating scene ', type: 'error'});
                });
            }
            else
                noty({text: 'Incomplete Name, please try again ', type: 'error'});
        }
    });

    box.on('shown.bs.modal',function(){
        $("#scene_name").focus();
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
        fixturebucketdiv.appendChild(fixdiv);

        var bulb_iconimg = document.createElement("img");
        bulb_iconimg.src = fix.image;
        bulb_iconimg.className = "fixture_icon_small";
        fixdiv.appendChild(bulb_iconimg);

        var labeldiv = document.createElement("div");
        labeldiv.className = "fixture_label";
        fixdiv.appendChild(labeldiv);

        var debug_label = document.createElement("label");
        debug_label.innerHTML  = fix.assignedname;
        labeldiv.appendChild(debug_label);

    }


    $('.availiblefixture').draggable({
        appendTo: 'body',
        revert: "invalid",
        scroll: false,
        zIndex: 100,
        helper: function() {
            return $("<div id='movingitem'>Moving</div>")[0];
        },
        start: function(event, ui) {
            $(this).hide();
        },
        stop: function(event, ui) {
            $(this).show();
        }
    });


    $('.availiblefix_wrapperbox').droppable({
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
                //var updatelayout = selected_scene.fixtures.length == 9;  // if going from 4--> 3
                var updatebox = false;
                var selindex = getIndexOfScene(selected_scene.name);
                var test = cachedconfig.scenes[selindex].fixtures.length;
                if(test == 5) // id going from 5 -->4, blow it out,
                    updatebox = true;



                var index = selected_scene.fixtures.indexOf(name);
                if (index > -1) {
                    selected_scene.fixtures.splice(index, 1);
                }


                var element = {};
                element.scenename = selected_scene.name;
                element.fixturename = name;

                var selindex = getIndexOfScene(selected_scene.name);

                deleteFixtureFromScene(element,function (retval) {
                    if(retval != undefined)  // as of 1/24/17, added version.
                    {
                        cachedconfig = retval;

                        if(updatebox) {
                            var point = document.getElementById('active_scenes_holder').scrollTop;
                            redrawScenes();
                            $('#group_' + selindex).trigger('click');
                            document.getElementById('active_scenes_holder').scrollTop = point;
                        }

                    }
                    else if(retval.error != undefined)
                        noty({text: 'Error saving config ' + retval.error, type: 'error'});
                });
            }
        }
    });


}

function captureScenceSettings()
{
    var k = 0;
    k = k + 1;

}


function getIndexOfScene(name)
{
    for(var i = 0 ; i < cachedconfig.scenes.length; i++)
    {
        var sceneobj = cachedconfig.scenes[i];
        if(sceneobj.name == name)
            return i;
    }
    return -1;
}
function constructSceneBox(currentdiv, scene, groupnum) {
    var fixcol = document.createElement("div");
    fixcol.className = "col-lg-5";
    fixcol.id = "group_holder_"+groupnum;

    if(scene.fixtures != undefined && scene.fixtures.length > 4)
        fixcol.className = "col-lg-10";

    currentdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "box";
    fixcol.appendChild(fixbox);

    var fixboxheader = document.createElement("div");
    fixboxheader.className = "box-header";
    fixbox.appendChild(fixboxheader);


    var buttonholder = document.createElement("div");
    buttonholder.className = "actionbuttons";
    buttonholder.id = "actionbuttons_"+groupnum;
    fixboxheader.appendChild(buttonholder);


    var capturesettings = document.createElement("input");
    capturesettings.className = "btn btn-xs btn-primary disabled";
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
    buttonholder.appendChild(capturesettings);



    var btinvokescene = document.createElement("input");
    btinvokescene.className = "btn btn-xs btn-primary disabled";
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
    buttonholder.appendChild(btinvokescene);



    var btndelete = document.createElement("input");
    btndelete.className = "btn btn-xs btn-danger disabled";
    btndelete.type = "button";
    btndelete.value = "Delete";
    btndelete.setAttribute('scene', scene.name);
    btndelete.onclick = function () {



        for(var i = 0; i < cachedconfig.contactinputs.length; i++)
        {
            if(cachedconfig.contactinputs[i].active_action.includes(scene.name) || cachedconfig.contactinputs[i].inactive_action.includes(scene.name))
            {
                noty({text: 'Please reassign contact input: ' + cachedconfig.contactinputs[i].assignedname + " to a different scene ", type: 'error'});
                return;
            }
        }





        bootbox.confirm({
            message : "Please Confirm Delete of Scene",
            size: 'small',
            callback: function(result){
                if(result) {
                    //var element = {};
                    //element.name = pendingdeleteitem; //this.getAttribute('scenelist');
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
            }});

    };
    buttonholder.appendChild(btndelete);



    var header = document.createElement("h2");
    header.innerHTML = scene.name;
    fixboxheader.appendChild(header);

    var fixcontent = document.createElement("div");
    fixcontent.className = "box-content";
    fixbox.appendChild(fixcontent);

    var dropzonediv = document.createElement("div");
    dropzonediv.className = "scene_dropzone";
    dropzonediv.id = "group_"+groupnum;
    dropzonediv.setAttribute("index",groupnum);
    fixcontent.appendChild(dropzonediv);








    $('.scene_dropzone').droppable({
        tolerance: 'touch',
        drop: function(event, ui) {
            var dropped = ui.draggable;
            var droppedOn = $(this);
            $(dropped).detach().appendTo(droppedOn);
            $(dropped).appendTo(droppedOn);

            var name = dropped.get(0).innerText;
            var updatelayout = false;
            if (name != undefined) {


                // 1/28/17, make sure its not already in the array:
                if(selected_scene.fixtures == undefined)
                    return;

                var updatebox = false;
                if(selected_scene.fixtures.length == 4) // id going from 4---> 5 , blow it out,
                    updatebox = true;

                selected_scene.fixtures.push(name);
                var selindex = getIndexOfScene(selected_scene.name);
                var element = {};
                element.scenename = selected_scene.name;
                element.fixturename = name;
                element.type = getFixtureByName(name).type;

                addFixtureToScene(element,function (retval) {
                    if(retval != undefined)  // as of 1/24/17, added version.
                    {
                        cachedconfig = retval;


                        if(updatebox)
                        {
                            var point = document.getElementById('active_scenes_holder').scrollTop;
                             redrawScenes();
                             $('#group_'+selindex).trigger('click');

                            document.getElementById('active_scenes_holder').scrollTop = point;

                        }

                    }
                    else if(retval.error != undefined)
                        noty({text: 'Error saving fixture to group: ' + retval.error, type: 'error'});
                });
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
            bulb_iconimg.className = "fixture_icon_small";
            fixdiv.appendChild(bulb_iconimg);

            var labeldiv = document.createElement("div");
            labeldiv.className = "fixture_label";
            fixdiv.appendChild(labeldiv);

            var debug_label = document.createElement("label");
            debug_label.innerHTML  = fixobj.assignedname;
            labeldiv.appendChild(debug_label);

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



function invokeAllOn()
{
    var element = {};
    element.name = "ALL_ON";
    invokescene(element,function (retval) {
        if(retval != undefined)  // as of 1/24/17, added version.
        {
            cachedconfig = retval;
        }
        else if(retval.error != undefined)
            noty({text: 'Error invoking ' + retval.error, type: 'error'});
    });
}



function invokeAll10()
{
    var element = {};
    element.name = "ALL_10";
    invokescene(element,function (retval) {
        if(retval != undefined)  // as of 1/24/17, added version.
        {
            cachedconfig = retval;
        }
        else if(retval.error != undefined)
            noty({text: 'Error invoking ' + retval.error, type: 'error'});
    });
}


function invokeAll50()
{
    var element = {};
    element.name = "ALL_50";
    invokescene(element,function (retval) {
        if(retval != undefined)  // as of 1/24/17, added version.
        {
            cachedconfig = retval;
        }
        else if(retval.error != undefined)
            noty({text: 'Error invoking ' + retval.error, type: 'error'});
    });
}



function invokeAllOff() {
    var element = {};
    element.name = "ALL_OFF";
    invokescene(element,function (retval) {
        if(retval != undefined)  // as of 1/24/17, added version.
        {
            cachedconfig = retval;
        }
        else if(retval.error != undefined)
            noty({text: 'Error invoking ' + retval.error, type: 'error'});
    });
}