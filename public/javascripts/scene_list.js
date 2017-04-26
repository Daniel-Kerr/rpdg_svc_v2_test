/**
 * Created by Nick on 3/13/2017.
 */
//var selected_scene;
var pendingdeleteitem = undefined;
// for tracking walk
var current_sel_scene_map = {};  // scene name : sel index


// These are the constraints used to validate the form
var constraints = {
    name: {
        length: {
            minimum: 6,
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

                    var j = validate({name: listname}, constraints);
                    if(j != undefined && j.name != undefined && j.name.length > 0)
                    {
                        noty({text: j.name[0], type: 'error', timeout:1000});
                        return false;
                    }


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
    var fixturebucketdiv = document.getElementById("sceneholder");
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

    var fixdiv = document.createElement("div");
    fixdiv.className = "availiblescene";
    fixturebucketdiv.appendChild(fixdiv);
    var debug_label = document.createElement("label");
    debug_label.innerHTML  = "ALL_10";
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

    var btn_down = document.createElement("input");
    btn_down.className = "btn btn-xs btn-primary";
    btn_down.type = "button";
    btn_down.value = "down";
    btn_down.setAttribute('scenelist', scenelist.name);
    btn_down.onclick = function () {
        var scenelistname = this.getAttribute('scenelist');
        var scenelistobj = getSceneListByName(scenelistname);
        if (scenelistobj.scenes.length > 0) {
            var targetscene = undefined;
                //switch curr back to unsel,
                var ctrl = current_sel_scene_map[scenelistname].controls[scenelistobj.activeindex];
                $( ctrl ).removeClass( "verticallistitem_sel" ).addClass( "verticallistitem" );
                //if (scenelistobj.activeindex < scenelistobj.scenes.length -1) {

                    var element = {};
                    element.name = scenelistname;
                    incrementscenelist(element, function (retval) {
                        if (retval != undefined)  // as of 1/24/17, added version.
                        {
                            cachedconfig = retval;
                            var scenelistobj = getSceneListByName(scenelistname);


                            var ctrl = current_sel_scene_map[scenelistname].controls[scenelistobj.activeindex];
                            $( ctrl ).removeClass( "verticallistitem" ).addClass( "verticallistitem_sel" );

                            targetscene = scenelistobj.scenes[scenelistobj.activeindex];
                            console.log("todo: invoke: " + targetscene);

                        }
                        else if (retval.error != undefined)
                            noty({text: 'Error invoking ' + retval.error, type: 'error'});
                    });

             //   }

        }

    };
    buttonholder.appendChild(btn_down);


    var btn_up = document.createElement("input");
    btn_up.className = "btn btn-xs btn-primary";
    btn_up.type = "button";
    btn_up.value = "up";
    btn_up.setAttribute('scenelist', scenelist.name);
    btn_up.onclick = function () {
        var scenelistname = this.getAttribute('scenelist');
        var scenelistobj = getSceneListByName(scenelistname);
        if (scenelistobj.scenes.length > 0) {
            var targetscene = undefined;
            //switch curr back to unsel,
            var ctrl = current_sel_scene_map[scenelistname].controls[scenelistobj.activeindex];
            $( ctrl ).removeClass( "verticallistitem_sel" ).addClass( "verticallistitem" );
           // if (scenelistobj.activeindex < scenelistobj.scenes.length -1) {
                var element = {};
                element.name = scenelistname;
                decrementscenelist(element, function (retval) {
                    if (retval != undefined)  // as of 1/24/17, added version.
                    {
                        cachedconfig = retval;
                        var scenelistobj = getSceneListByName(scenelistname);


                        var ctrl = current_sel_scene_map[scenelistname].controls[scenelistobj.activeindex];
                        $( ctrl ).removeClass( "verticallistitem" ).addClass( "verticallistitem_sel" );

                        targetscene = scenelistobj.scenes[scenelistobj.activeindex];
                        console.log("todo: invoke: " + targetscene);

                    }
                    else if (retval.error != undefined)
                        noty({text: 'Error invoking ' + retval.error, type: 'error'});
                });

          //  }
        }

    };
    buttonholder.appendChild(btn_up);



/*
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
    */

    var btndelete = document.createElement("input");
    btndelete.className = "btn btn-xs btn-danger";
    btndelete.type = "button";
    btndelete.value = "Delete";
    btndelete.setAttribute('scenelist', scenelist.name);
    btndelete.onclick = function () {

        pendingdeleteitem = this.getAttribute('scenelist');


        for(var i = 0; i < cachedconfig.contactinputs.length; i++)
        {
            if(cachedconfig.contactinputs[i].active_action.includes(scenelist.name) || cachedconfig.contactinputs[i].inactive_action.includes(scenelist.name))
            {
                noty({text: 'Please reassign contact input: ' + cachedconfig.contactinputs[i].assignedname + " to a different scene list ", type: 'error'});
                return;
            }
        }




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


/*
    var btnrollover = document.createElement("input");
    btnrollover.className = "btn btn-xs btn-danger";
    btnrollover.type = "checkbox";
    btnrollover.value = "rollover";
    btnrollover.setAttribute('scenelist', scenelist.name);
    btnrollover.onclick = function () {

        if (name != undefined) {
            var scenelist = getSceneListByName(droppedOn[0].id);
            if(scenelist != undefined) {
                scenelist.rollover = this.checked();
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




    };
    buttonholder.appendChild(btnrollover);
    */



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
  //  current_sel_scene_map[scenelist.name].selection = undefined;
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
