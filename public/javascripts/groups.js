/**
 * Created by Nick on 1/15/2017.
 */

var loadedconfig = "";
var selecteditem;
var defaultcolor = "rgba(0,0,0,0)";
var selected_group;

$(document).ready(function() {

    getConfigFromHost2(processConfig);
});


function processConfig(configobj)
{
    loadedconfig = configobj;  // cache config.
    redrawGroups();
}

$(function () {
    // click handler for boxes.. just under test.
    $('.dropzone2').live('click', function(){
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

            selected_group = loadedconfig.groups[Number(selectedindex)];
            filterAvalibleFixtures();

        }
        else if(selecteditem == undefined)
        {
            $(this).css("border-color", "blue");
            selecteditem = selecteditemthistime; //$(this);
            enableDisableFixturesInDiv(selecteditem, true);
            $(this).droppable("option", "disabled", false);

            var selectedindex = selecteditem.attr('index');
            selected_group = loadedconfig.groups[Number(selectedindex)];
            filterAvalibleFixtures();
        }
    });

});

function redrawGroups()
{
    var groups_div = document.getElementById("active_groups_holder");
    groups_div.innerHTML = "";
    for(var i = 0; i < loadedconfig.groups.length; i++)
    {
        var group = loadedconfig.groups[i];
        constructGroupBox(groups_div, group,i);
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
    //    constructGroupBox(groups_div, group,i);
   // }
    //.
}

function openNewGroupEditDialog()
{
    bootbox.confirm("<form id='infos' action=''>\
    Group Name:<input type='text' id='group_name' /><br/>\
    Group Type: <select id='grouptype'>\
            <option value='brightness'>Brightness</option>\
            <option value='ctemp'>Color Temp</option>\
            <option value='red'>Red Level</option>\
              <option value='green'>Green Level</option>\
       </select>\
    </form>", function(result) {
        if(result) {
            //$('#infos').submit();
            var grouptype = $('#grouptype').val();
            var groupname = $('#group_name').val();

            if(groupname.length > 0) {  //todo validate its unique.
                var groups_div = document.getElementById("active_groups_holder");
                var group1 = {};
                group1.name = groupname;
                group1.type = grouptype;
                group1.fixtures = [];
                createGroup(groupname, grouptype,function (retval) {
                    if(retval != undefined && retval.version != undefined)  // as of 1/24/17, added version.
                    {
                        loadedconfig = retval;
                        var grpnum = loadedconfig.groups.length-1;
                        constructGroupBox(groups_div, group1, grpnum);

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


function createnewgroup()
{
    openNewGroupEditDialog();
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


function deleteSelectedGroup()
{
    deleteGroup(selected_group.name, function (retval) {
        if(retval != undefined && retval.version != undefined)  // as of 1/24/17, added version.
        {
            loadedconfig = retval;
            selected_group = undefined;
            redrawGroups();

            filterAvalibleFixtures();
        }
        else
            noty({text: 'Error deleting group: ' + retval, type: 'error'});
    });
}

function filterAvalibleFixtures()
{
    var filteredlist = [];
    // var groupobj = selected_group;

    if(selected_group != undefined)
    {
        var type = selected_group.type;
        // first filter what the group already has in it,
        var fixtures =  loadedconfig.fixtures;
        for(var i = 0; i < fixtures.length; i++) {
            var fix = fixtures[i];
            // smart filter,
            if(selected_group.type == "brightness") // include all types  && (fix.type == "cct" || fix.type == "dim" || fix.type == "rgbw"))
            {
                var include = true;
                // now check if its in the fixture is already in the grup.
                if(selected_group.fixtures.indexOf(fix.uid) > -1) // if it contains it, alreayd,
                {
                    include = false;
                }
                if(include)
                    filteredlist.push(fix);
            }
            else if(selected_group.type == "ctemp" && fix.type == "cct")
            {
                var include = true;
                // now check if its in the fixture is already in the grup.
                if(selected_group.fixtures.indexOf(fix.uid) > -1) // if it contains it, alreayd,
                {
                    include = false;
                }
                if(include)
                    filteredlist.push(fix);
            }
            else if(selected_group.type == "red" && fix.type == "rgbw" ||
                selected_group.type == "green" && fix.type == "rgbw"||
                selected_group.type == "blue" && fix.type == "rgbw")
            {
                var include = true;
                // now check if its in the fixture is already in the grup.
                if(selected_group.fixtures.indexOf(fix.uid) > -1) // if it contains it, alreayd,
                {
                    include = false;
                }
                if(include)
                    filteredlist.push(fix);
            }


        }
        // filter any that are already included in the group.
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
        debug_label.innerHTML  = fix.name;
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
            var uid = fixtureNameToUID(name);
            if (uid != undefined) {
                var updatelayout = selected_group.fixtures.length == 4;  // if going from 4--> 3

                var index = selected_group.fixtures.indexOf(uid);
                if (index > -1) {
                    selected_group.fixtures.splice(index, 1);
                }

                deleteFixtureFromGroup(selected_group.name, uid,function (retval) {
                    if(retval != undefined && retval.version != undefined)  // as of 1/24/17, added version.
                    {
                        loadedconfig = retval;
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



function constructGroupBox(currentdiv, group,groupnum) {
    var fixcol = document.createElement("div");
    fixcol.className = "col-lg-5";
    fixcol.id = "group_holder_"+groupnum;
    if(group.fixtures.length >= 4)
        fixcol.className = "col-lg-10";

    currentdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "box";
    fixcol.appendChild(fixbox);

    var fixboxheader = document.createElement("div");
    fixboxheader.className = "box-header";
    fixbox.appendChild(fixboxheader);

    var header = document.createElement("h2");
    header.innerHTML = group.name;
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

            var uid = fixtureNameToUID(name);
            if (uid != undefined) {

                // 1/28/17, make sure its not already in the array:
                if(selected_group.fixtures.indexOf(uid) != -1)
                    return;


                selected_group.fixtures.push(uid);



                addFixtureToGroup(selected_group.name, uid,function (retval) {
                    if(retval != undefined && retval.version != undefined)  // as of 1/24/17, added version.
                    {
                        loadedconfig = retval;
                    }
                    else if(retval.error != undefined)
                        noty({text: 'Error saving fixture to group: ' + retval.error, type: 'error'});
                });


                if (selected_group.fixtures.length == 4)  // if going from 2-->3
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
    for(var i = 0; i < group.fixtures.length; i++)
    {

        var fixuid = group.fixtures[i];
        var fixobj = getFixtureObjectByUID(fixuid);
        if(fixobj != undefined) {
            var fixdiv = document.createElement("div");
            fixdiv.className = "availiblefixture";
            dropzonediv.appendChild(fixdiv);
            var bulb_iconimg = document.createElement("img");
            bulb_iconimg.src = fixobj.image;
            bulb_iconimg.className = "bulbiconrow";
            fixdiv.appendChild(bulb_iconimg);
            var debug_label = document.createElement("label");
            debug_label.innerHTML = fixobj.name;
            fixdiv.appendChild(debug_label);
        }
    }


    var test = $(dropzonediv);
    enableDisableFixturesInDiv(test,false);
    $(dropzonediv).droppable("option", "disabled", true);
}


function fixtureNameToUID(name)
{
    for(var i = 0 ; i < loadedconfig.fixtures.length; i++)
    {
        var fixobj = loadedconfig.fixtures[i];
        if(name == fixobj.name)
            return fixobj.uid;
    }
    return undefined;
}

function getFixtureObjectByUID(uid)
{
    for(var i = 0 ; i < loadedconfig.fixtures.length; i++)
    {
        var fixobj = loadedconfig.fixtures[i];
        if(uid == fixobj.uid)
            return fixobj;
    }
    return undefined;
}

