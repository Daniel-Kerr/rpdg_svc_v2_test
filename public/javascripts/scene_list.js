/**
 * Created by Nick on 3/13/2017.
 */
//var selected_scene;
var pendingdeleteitem = undefined;
// for tracking walk
var current_sel_scene_map = {};  // scene name : sel index

function init() {
    getConfig(processConfig);
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
    filterAvalibleScenes();
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

function openNewSceneListEditDlg()
{
    bootbox.confirm({
        message: "<form id='infos' action=''>\
                Scene List:<input type='text' id='scenelist_name' /><br/>\
                </form>",
        size: 'small',
        callback: function(result) {
            if(result) {
                var listname = $('#scenelist_name').val();
                if(listname.length > 0) {
                    var groups_div = document.getElementById("active_scenes_holder");
                    var scenelist = {};
                    scenelist.name = listname;

                    saveConfigObject("scenelist", scenelist,function (retval) {
                        if(retval != undefined)
                        {
                            cachedconfig = retval;
                            refreshUpdatedConfig();
                        }
                        else
                            noty({text: 'Error creating scene ', type: 'error'});
                    });
                }
                else
                    noty({text: 'Incomplete Name, please try again ', type: 'error'});
            }
        }});
}


function filterAvalibleScenes()
{
    var fixturebucketdiv = document.getElementById("fixholder");
    fixturebucketdiv.innerHTML = ""; // blank it out.


    // 4/3/17,  add default "built in scenes",
    // var sceneobj = cachedconfig.scenes[i];
    var fixdiv = document.createElement("div");
    fixdiv.className = "availiblescene";
    fixturebucketdiv.appendChild(fixdiv);
    var debug_label = document.createElement("label");
    debug_label.innerHTML  = "ALL_ON";
    fixdiv.appendChild(debug_label);

    var fixdiv = document.createElement("div");
    fixdiv.className = "availiblescene";
    fixturebucketdiv.appendChild(fixdiv);
    var debug_label = document.createElement("label");
    debug_label.innerHTML  = "ALL_OFF";
    fixdiv.appendChild(debug_label);

    var fixdiv = document.createElement("div");
    fixdiv.className = "availiblescene";
    fixturebucketdiv.appendChild(fixdiv);
    var debug_label = document.createElement("label");
    debug_label.innerHTML  = "ALL_50";
    fixdiv.appendChild(debug_label);



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
                            }
                            else
                                noty({text: 'Error creating scene ', type: 'error'});
                        });
                    }
                }
                else
                    refreshUpdatedConfig();
                // remove it from the parent scenelist,  save it
            }
        }
    });


}
function constructSceneListBox(currentdiv, scenelist, groupnum) {
    var fixcol = document.createElement("div");
    fixcol.className = "col-lg-3";
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


    // scene list name,
    var header = document.createElement("h2");
    header.innerHTML = scenelist.name;
    fixboxheader.appendChild(header);


    var buttonholder = document.createElement("div");
    buttonholder.className = "actionbuttons";
    fixboxheader.appendChild(buttonholder);


    var btnwalk = document.createElement("input");
    btnwalk.className = "btn btn-xs btn-primary";
    btnwalk.type = "button";
    btnwalk.value = "Walk";
    btnwalk.setAttribute('scenelist', scenelist.name);
    btnwalk.onclick = function () {

        var scenelistname = this.getAttribute('scenelist');
        var scenelistobj = getSceneListByName(scenelistname);
        if (scenelistobj.scenes.length > 0) {

            var targetscene = undefined;
            if (current_sel_scene_map[scenelistname].selection == undefined) {
                // get first item , and highlight it, and invoke it,
                current_sel_scene_map[scenelistname].selection = 0;
                targetscene = scenelistobj.scenes[current_sel_scene_map[scenelistname].selection];
                console.log("todo: invoke: " + targetscene);
                var ctrl = current_sel_scene_map[scenelistname].controls[0];
                $( ctrl ).removeClass( "verticallistitem" ).addClass( "verticallistitem_sel" );



            }
            else {
                //switch curr back to unsel,
                var ctrl = current_sel_scene_map[scenelistname].controls[current_sel_scene_map[scenelistname].selection];
                $( ctrl ).removeClass( "verticallistitem_sel" ).addClass( "verticallistitem" );

                if (current_sel_scene_map[scenelistname].selection < scenelistobj.scenes.length -1) {

                  //  incrementscenelist to finish, ...when I get back,
                    current_sel_scene_map[scenelistname].selection++;


                }
                else
                {

                    current_sel_scene_map[scenelistname].selection = 0;
                }

                var ctrl = current_sel_scene_map[scenelistname].controls[current_sel_scene_map[scenelistname].selection];
                $( ctrl ).removeClass( "verticallistitem" ).addClass( "verticallistitem_sel" );

                targetscene = scenelistobj.scenes[current_sel_scene_map[scenelistname].selection];
                console.log("todo: invoke: " + targetscene);
            }





            if(targetscene != undefined) {
                var element = {};
                element.name = targetscene;
                invokescene(element, function (retval) {
                    if (retval != undefined)  // as of 1/24/17, added version.
                    {
                        cachedconfig = retval;
                    }
                    else if (retval.error != undefined)
                        noty({text: 'Error invoking ' + retval.error, type: 'error'});
                });
            }
        }

    };
    buttonholder.appendChild(btnwalk);


    var btnreset = document.createElement("input");
    btnreset.className = "btn btn-xs btn-warn";
    btnreset.type = "button";
    btnreset.value = "Reset";
    btnreset.setAttribute('scenelist', scenelist.name);
    btnreset.onclick = function () {
        var scenelistname = this.getAttribute('scenelist');
        var scenelistobj = getSceneListByName(scenelistname);
        if (scenelistobj.scenes.length > 0) {
            if(current_sel_scene_map[scenelistname].selection != undefined)
            {
                //switch curr back to unsel,
                var ctrl = current_sel_scene_map[scenelistname].controls[current_sel_scene_map[scenelistname].selection];
                $( ctrl ).removeClass( "verticallistitem_sel" ).addClass( "verticallistitem" );

                current_sel_scene_map[scenelistname].selection = undefined;
            }


        }

    };
    buttonholder.appendChild(btnreset);

    var btndelete = document.createElement("input");
    btndelete.className = "btn btn-xs btn-danger";
    btndelete.type = "button";
    btndelete.value = "Delete";
    btndelete.setAttribute('scenelist', scenelist.name);
    btndelete.onclick = function () {

        pendingdeleteitem = this.getAttribute('scenelist');

        bootbox.confirm({
            message : "Please Confirm Delete of Scene List",
            size: 'small',
            callback: function(result){
                if(result) {
                    var element = {};
                    element.name = pendingdeleteitem; //this.getAttribute('scenelist');

                    deleteConfigObject("scenelist", element, function (retval) {
                        if (retval != undefined) {
                            cachedconfig = retval;
                            refreshUpdatedConfig();
                        }
                        else
                            noty({text: 'Error deleting scenelist: ' + retval, type: 'error'});
                    });
                }
            }});

    };
    buttonholder.appendChild(btndelete);





    var fixcontent = document.createElement("div");
    fixcontent.className = "box-content";
    fixbox.appendChild(fixcontent);




    var dropzonediv = document.createElement("div");
    dropzonediv.className = "dropzone2";

    dropzonediv.id = scenelist.name;
    // dropzonediv.setAttribute(scenelist.name);
    fixcontent.appendChild(dropzonediv);



    //   var fixboxfooter = document.createElement("div");
    // fixboxfooter.className = "verticallistitem";
    //  fixbox.appendChild(fixboxfooter);


    $('.dropzone2').droppable({
        tolerance: 'touch',
        drop: function(event, ui) {
            var dropped = ui.draggable;
            var droppedOn = $(this);
            //  $(dropped).parent().droppable("enable");  // enable by default
            // $(dropped).detach().appendTo(droppedOn);
            $(dropped).appendTo(droppedOn);
            var name = dropped.get(0).innerText;

            // check if we are just reordering.
            var scenename = dropped[0].getAttribute('scene');

            if (name != undefined) {
                var scenelist = getSceneListByName(droppedOn[0].id);
                if(scenelist != undefined) {

                    if(scenename == undefined)
                        scenelist.scenes.push(dropped[0].innerText);


                    saveConfigObject("scenelist", scenelist, function (retval) {
                        if (retval != undefined)  // as of 1/24/17, added version.
                        {
                            cachedconfig = retval;
                            refreshUpdatedConfig();

                        }
                        else
                            noty({text: 'Error creating scene ', type: 'error'});
                    });
                }
            }
        }
    });




    $('.dropzone2').sortable({
        update: function( ) {
            var droppedOn = $(this);
            var name = droppedOn.get(0).innerText;
            if (name != undefined) {

                var updatedscenelist = {};
                updatedscenelist.name = droppedOn[0].id;
                updatedscenelist.scenes = [];
                var children = $(this).children();
                for(var i = 0 ; i < children.length; i++ )
                    updatedscenelist.scenes.push(children[i].innerText);

                //var scenelist = getSceneListByName(droppedOn[0].id);
                if(updatedscenelist != undefined) {

                    // if(scenename == undefined)
                    // scenelist.scenes.push(dropped[0].innerText);


                    saveConfigObject("scenelist", updatedscenelist, function (retval) {
                        if (retval != undefined)  // as of 1/24/17, added version.
                        {
                            cachedconfig = retval;
                            refreshUpdatedConfig();
                        }
                        else
                            noty({text: 'Error creating scene ', type: 'error'});
                    });
                }
            }

        }
    }).disableSelection();


    current_sel_scene_map[scenelist.name] = {};
    current_sel_scene_map[scenelist.name].selection = undefined;
    current_sel_scene_map[scenelist.name].controls = [];
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
        current_sel_scene_map[scenelist.name].controls.push(fixdiv);
    }

    var test = $(dropzonediv);
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
