/**
 * Created by Nick on 3/13/2017.
 */


//var selecteditem;
var defaultcolor = "rgba(0,0,0,0)";
//var selected_scene;


function init() {
    getConfig(processConfig);
    //  getSceneNameList(cacheAndProcessSceneNames);
}

function processConfig(configobj)
{
    cachedconfig = configobj;
    refreshUpdatedConfig();
}


function refreshUpdatedConfig()
{
    cachedconfig.scenelists.sort(function(a, b){
        if(a.name < b.tname) return -1;
        if(a.name > b.name) return 1;
        return 0;
    })
    redrawSceneLists();
    filterAvalibleFixtures();
    constructTrashCan();
}

function redrawSceneLists()
{
    var groups_div = document.getElementById("active_scenes_holder");
    groups_div.innerHTML = "";
    for(var i = 0; i < cachedconfig.scenelists.length; i++)
    {
        var scenelist = cachedconfig.scenelists[i];
        constructSceneListBox(groups_div, scenelist,i);
    }
}


function openNewSceneEditDlg()
{
    bootbox.confirm("<form id='infos' action=''>\
    Scene List:<input type='text' id='scenelist_name' /><br/>\
    </form>", function(result) {
        if(result) {
            var listname = $('#scenelist_name').val();
            if(listname.length > 0) {
                var groups_div = document.getElementById("active_scenes_holder");
                var scenelist = {};
                scenelist.name = listname;

                saveConfigObject("scenelist", scenelist,function (retval) {
                    if(retval != undefined)  // as of 1/24/17, added version.
                    {
                        cachedconfig = retval;
                        var grpnum = cachedconfig.scenelists.length-1;
                        constructSceneListBox(groups_div, scenelist, grpnum);
                    }
                    else
                        noty({text: 'Error creating scene ', type: 'error'});
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
            // selected_scene = undefined;
            redrawScenes();

            filterAvalibleFixtures();
        }
        else
            noty({text: 'Error deleting group: ' + retval, type: 'error'});
    });
}

function filterAvalibleFixtures()
{
    var fixturebucketdiv = document.getElementById("fixholder");
    fixturebucketdiv.innerHTML = ""; // blank it out.
    for(var i = 0; i < cachedconfig.scenes.length; i++) {

        var sceneobj = cachedconfig.scenes[i];
        var fixdiv = document.createElement("div");
        fixdiv.className = "availiblescene";
        fixturebucketdiv.appendChild(fixdiv);
        var debug_label = document.createElement("label");
        debug_label.innerHTML  = sceneobj.name; //.assignedname;
        fixdiv.appendChild(debug_label);

    }

    $('.availiblescene').draggable({
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
}

function captureScenceSettings()
{
    var k = 0;
    k = k + 1;
}


function constructTrashCan()
{
    var fixturebucketdiv = document.getElementById("trashholder");
    fixturebucketdiv.innerHTML = "";
    var container = document.createElement("div");
    container.className = "trashcan";
    fixturebucketdiv.appendChild(container);

    $('.trashcan').droppable({
        tolerance: 'touch',
        drop: function(event, ui) {
            var dropped = ui.draggable;
            var droppedOn = $(this);
            //  $(dropped).parent().droppable("enable");  // enable by default
            // $(dropped).detach().appendTo(droppedOn);
            $(dropped).appendTo(droppedOn);
            var name = dropped.get(0).innerText;
            if (name != undefined) {

                var scenename = dropped[0].getAttribute("scene");
                if (scenename != undefined) {
                    var scenelist = getSceneListByName(scenename);

                    if(scenelist != undefined) {
                        var index = dropped[0].getAttribute("listindex");

                        scenelist.scenes.splice(Number(index),1);

                        saveConfigObject("scenelist", scenelist, function (retval) {
                            if (retval != undefined)  // as of 1/24/17, added version.
                            {
                                cachedconfig = retval;
                                refreshUpdatedConfig();
                                //redrawSceneLists();
                                //filterAvalibleFixtures();
                                //constructTrashCan();
                            }
                            else
                                noty({text: 'Error creating scene ', type: 'error'});
                        });
                        //filterAvalibleFixtures();
                    }
                }
                // remove it from the parent scenelist,  save it
            }
        }
    });


}
function constructSceneListBox(currentdiv, scenelist, groupnum) {
    var fixcol = document.createElement("div");
    fixcol.className = "col-lg-2";
    fixcol.id = "group_holder_"+groupnum;

    // if(scenelist.fixtures != undefined && scenelist.fixtures.length >= 4)
    //     fixcol.className = "col-lg-10";

    currentdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "box";
    fixcol.appendChild(fixbox);

    var fixboxheader = document.createElement("div");
    fixboxheader.className = "box-header";
    fixbox.appendChild(fixboxheader);


    /*
    var capturesettings = document.createElement("input");
    capturesettings.className = "btn btn-large btn-primary";
    capturesettings.type = "button";
    capturesettings.value = "Step";
    capturesettings.setAttribute('scenelist', scenelist.name);
    capturesettings.onclick = function () {

        var scenename = this.getAttribute('scenelist');
        var element = {};
        element.name = scenename;
    };
    fixboxheader.appendChild(capturesettings);
    */

    var header = document.createElement("h2");
    header.innerHTML = scenelist.name;
    fixboxheader.appendChild(header);

    var fixcontent = document.createElement("div");
    fixcontent.className = "box-content";
    fixbox.appendChild(fixcontent);

    var dropzonediv = document.createElement("div");
    dropzonediv.className = "dropzone2";

    dropzonediv.id = scenelist.name;
   // dropzonediv.setAttribute(scenelist.name);
    fixcontent.appendChild(dropzonediv);



    $('.dropzone2').droppable({
        tolerance: 'touch',
        drop: function(event, ui) {
            var dropped = ui.draggable;
            var droppedOn = $(this);
            //  $(dropped).parent().droppable("enable");  // enable by default
            // $(dropped).detach().appendTo(droppedOn);
            $(dropped).appendTo(droppedOn);
            var name = dropped.get(0).innerText;

            if (name != undefined) {
                var scenelist = getSceneListByName(droppedOn[0].id);

                if(scenelist != undefined) {
                    scenelist.scenes.push(dropped[0].innerText);

                    saveConfigObject("scenelist", scenelist, function (retval) {
                        if (retval != undefined)  // as of 1/24/17, added version.
                        {
                            cachedconfig = retval;
                            refreshUpdatedConfig();
                           // redrawSceneLists();
                            //filterAvalibleFixtures();
                            //constructTrashCan();
                        }
                        else
                            noty({text: 'Error creating scene ', type: 'error'});
                    });
                   // filterAvalibleFixtures();
                }
            }
        }
    });




    $('.dropzone2').sortable({
        //  connectWith: ".connectedSortable"
    }).disableSelection();




    // now add in the existing fixutres:
    for(var i = 0; i < scenelist.scenes.length; i++)
    {
        var scenename = scenelist.scenes[i];
        var fixdiv = document.createElement("div");
        fixdiv.className = "verticallistitem";
        dropzonediv.appendChild(fixdiv);
        var debug_label = document.createElement("label");
        debug_label.innerHTML = scenename;
        fixdiv.appendChild(debug_label);
        fixdiv.setAttribute("scene", scenelist.name);
        fixdiv.setAttribute("listindex", i);

    }


    var test = $(dropzonediv);
    // enableDisableFixturesInDiv(test,false);
    $(dropzonediv).droppable("option", "disabled", false);
}





function getSceneListByName(name)
{
    for(var i = 0 ; i < cachedconfig.scenelists.length; i++)
    {
        var scenelist = cachedconfig.scenelists[i];
        if(name == scenelist.name)
            return scenelist;
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