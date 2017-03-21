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
    redrawScenes();
    filterAvalibleFixtures();
}

$(function () {
    // click handler for boxes.. just under test.
   /* $('.dropzone2').live('click', function(){

        // 3/15/17, remove any thing else that is highlighted,
        // remove any selected items from table X
        $('#fixturetable > tbody  > tr').each(function() {
            $(this).removeClass('active');
        });
        //  var fixsetting = document.getElementById("fixturesettingsdiv");  // clear the control
        // fixsetting.innerHTML = ""; //clear


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

           // selected_scene = cachedconfig.scenes[Number(selectedindex)];
            // filterAvalibleFixtures();

        }
        else if(selecteditem == undefined)
        {
            $(this).css("border-color", "blue");
            selecteditem = selecteditemthistime; //$(this);
            enableDisableFixturesInDiv(selecteditem, true);
            $(this).droppable("option", "disabled", false);

            var selectedindex = selecteditem.attr('index');
          //  selected_scene = cachedconfig.scenes[Number(selectedindex)];
            // filterAvalibleFixtures();
        }
    });*/

});

function redrawScenes()
{
    var groups_div = document.getElementById("active_scenes_holder");
    groups_div.innerHTML = "";
    for(var i = 0; i < cachedconfig.scenelists.length; i++)
    {
        var scenelist = cachedconfig.scenelists[i];
        constructSceneListBox(groups_div, scenelist,i);
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


/*
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
               // var updatelayout = selected_scene.fixtures.length == 4;  // if going from 4--> 3

               // var index = selected_scene.fixtures.indexOf(name);
               // if (index > -1) {
               //     selected_scene.fixtures.splice(index, 1);
               // }
               // var element = {};
               // element.scenename = selected_scene.name;
               // element.fixturename = name;

               // // todo ,  dont allow duplicates.
                /* deleteFixtureFromScene(element,function (retval) {
                 if(retval != undefined)  // as of 1/24/17, added version.
                 {
                 cachedconfig = retval;
                 }
                 else if(retval.error != undefined)
                 noty({text: 'Error saving config ' + retval.error, type: 'error'});
                 });
                 */

                //if (updatelayout)
               // {
               //     var selectedindex = selecteditem.attr('index');
                    // var k = $('.selecteditem').attr('id');
                    // this should be a "group_X",
                    //   var num = k.substr(6);
                //    var bla = document.getElementById("group_holder_"+selectedindex);
                //    bla.className = "col-lg-5";
               // }

          //  }
            //  droppedOn.droppable("disable");
       // }
   // });
   // */

    // $(".availiblefixture").draggable();
    // $(".dropzone2").droppable();

}

function captureScenceSettings()
{
    var k = 0;
    k = k + 1;

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


    var capturesettings = document.createElement("input");
    capturesettings.className = "btn btn-large btn-primary";
    capturesettings.type = "button";
    capturesettings.value = "Step";
    capturesettings.setAttribute('scenelist', scenelist.name);
    capturesettings.onclick = function () {

        var scenename = this.getAttribute('scenelist');
        var element = {};
        element.name = scenename;

        /* saveFixtureSettingsToScene(element,function (retval) {
         if(retval != undefined)  // as of 1/24/17, added version.
         {
         cachedconfig = retval;
         }
         else if(retval.error != undefined)
         noty({text: 'Error saving config ' + retval.error, type: 'error'});
         });*/
    };
    fixboxheader.appendChild(capturesettings);

    var header = document.createElement("h2");
    header.innerHTML = scenelist.name;
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
           //  $(dropped).parent().droppable("enable");  // enable by default
            $(dropped).detach().appendTo(droppedOn);
            var name = dropped.get(0).innerText;
            var updatelayout = false;
            if (name != undefined) {

                var k = 0;
                k = k + 1;
                // 1/28/17, make sure its not already in the array:
               // if(selected_scene.scenes == undefined)
                //    return;

              //  selected_scene.scenes.push(name);

              //  var element = {};
              //  element.scenename = selected_scene.name;
              //  element.fixturename = name;
                // element.type = getFixtureByName(name).type;

                /* addFixtureToScene(element,function (retval) {
                 if(retval != undefined && retval.version != undefined)  // as of 1/24/17, added version.
                 {
                 cachedconfig = retval;
                 }
                 else if(retval.error != undefined)
                 noty({text: 'Error saving fixture to group: ' + retval.error, type: 'error'});
                 });*/

                /*if (selected_scene.scenes != undefined && selected_scene.scenes.length == 4)  // if going from 2-->3
                 {
                 var k = $(this).attr('id');
                 // this should be a "group_X",
                 var num = k.substr(6);
                 var bla = document.getElementById("group_holder_"+num);
                 bla.className = "col-lg-10";
                 }*/
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

    }


    var test = $(dropzonediv);
   // enableDisableFixturesInDiv(test,false);
    $(dropzonediv).droppable("option", "disabled", false);
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