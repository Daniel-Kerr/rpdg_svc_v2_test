/**
 * Created by Nick on 1/15/2017.
 */

var loadedconfig = "";
var selecteditem;
var defaultcolor = "rgba(100,100,100,100)";
var selected_group;


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

$(document).ready(function() {

    getConfig(processConfig);
});


function processConfig(configobj)
{
    loadedconfig = configobj;  // cache config.
    redrawGroups();
}


/*
 $(function () {
 // click handler for boxes.. just under test.
 $('.group_dropzone').on('click', function(){
 var x = $(this).css('backgroundColor');

 var selecteditemthistime = $(this);
 // if selected item is not ud , and it does not equal the current.
 // then disable the current,
 if(selecteditem != undefined && selecteditem.get(0) != selecteditemthistime.get(0))
 {
 //disable action buttons on all ,
 for(var k = 0; k <  loadedconfig.groups.length; k++)
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

 var enableelement = '#actionbuttons_'+selectedindex;
 $(enableelement).children().removeClass('disabled');
 $(enableelement).children().addClass('active');

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

 var enableelement = '#actionbuttons_'+selectedindex;
 $(enableelement).children().removeClass('disabled');
 $(enableelement).children().addClass('active');

 selected_group = loadedconfig.groups[Number(selectedindex)];
 filterAvalibleFixtures();
 }
 });

 });

 */

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
    //    constructSceneBox(groups_div, group,i);
    // }
    //.
}

function openNewGroupEditDialog()
{
    var box = bootbox.confirm("<form id='infos' action=''>\
    Group Name:<input type='text' id='group_name' /><br/>\
    Group Type: <select id='grouptype'>\
            <option value='brightness'>Brightness</option>\
            <option value='ctemp'>Color Temp</option>\
            <option value='red'>Red Level</option>\
            <option value='green'>Green Level</option>\
       </select>\
       Global: <input type='checkbox'  id='global' </input>\
    </form>", function(result) {
        if(result) {
            var grouptype = $('#grouptype').val();
            var groupname = $('#group_name').val();
            var global = $('#global').is(':checked');
            if(groupname.length > 0) {  //todo validate its unique.
                var groups_div = document.getElementById("active_groups_holder");
                var group1 = {};
                group1.name = groupname;
                group1.type = grouptype;
                group1.isglobal = global;

                var j = validate({name: groupname}, constraints);
                if(j != undefined && j.name != undefined && j.name.length > 0)
                {
                    $.Notification.notify('error','top left', 'Error',  j.name[0]);
                    //  noty({text: j.name[0], type: 'error', timeout:1000});
                    return false;
                }


                saveConfigObject("group", group1,function (retval) {
                    if(retval != undefined)  // as of 1/24/17, added version.
                    {
                        loadedconfig = retval;
                        var grpnum = loadedconfig.groups.length-1;
                        constructGroupBox(groups_div, group1, grpnum);
                    }
                    else
                        $.Notification.notify('error','top left', 'Error',  'Error creating group ');
                    // noty({text: 'Error creating group ', type: 'error'});
                });
            }
            else
                $.Notification.notify('error','top left', 'Error',  'Incomplete Name, please try again ');
            //noty({text: 'Incomplete Name, please try again ', type: 'error'});
        }
    });

    box.on('shown.bs.modal',function(){
        $("#group_name").focus();
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

/*
 function deleteSelectedGroup()
 {
 // 4/26/17.  validate no assignement in level or contact inputs.
 for(var i = 0; i < loadedconfig.levelinputs.length; i++)
 {
 if(loadedconfig.levelinputs[i].group == selected_group.name)
 {
 noty({text: 'Please reassign level input: ' + loadedconfig.levelinputs[i].assignedname + " to a different group", type: 'error'});
 return;
 }
 }


 for(var i = 0; i < loadedconfig.contactinputs.length; i++)
 {
 if(loadedconfig.contactinputs[i].active_action.includes(selected_group.name) || loadedconfig.contactinputs[i].inactive_action.includes(selected_group.name))
 {
 noty({text: 'Please reassign contact input: ' + loadedconfig.contactinputs[i].assignedname + " to a different group", type: 'error'});
 return;
 }
 }





 deleteConfigObject("group",selected_group,function (retval) {
 //deleteConfigObject(selected_scene.name, function (retval) {
 if(retval != undefined)  // as of 1/24/17, added version.
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
 */

function filterAvalibleFixtures()
{
    var filteredlist = [];
    // var groupobj = selected_scene;

    if(selected_group != undefined)
    {
        var type = selected_group.type;
        // first filter what the group already has in it,
        var fixtures =  loadedconfig.fixtures;
        for(var i = 0; i < fixtures.length; i++) {
            var fix = fixtures[i];


            // if(selected_group.fixtures.indexOf(fix.assignedname) > -1) // if it contains it, alreayd,
            // {
            //     include = false;
            // }
            //  if(include)
            //      filteredlist.push(fix);
            // smart filter,
            if(selected_group.type == "brightness") // include all types  && (fix.type == "cct" || fix.type == "dim" || fix.type == "rgbw"))
            {
                var include = true;
                // now check if its in the fixture is already in the grup.
                if(selected_group.fixtures.indexOf(fix.assignedname) > -1) // if it contains it, alreayd,
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
                if(selected_group.fixtures.indexOf(fix.assignedname) > -1) // if it contains it, alreayd,
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
                if(selected_group.fixtures.indexOf(fix.assignedname) > -1) // if it contains it, alreayd,
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
                var updatelayout = selected_group.fixtures.length == 4;  // if going from 4--> 3

                var index = selected_group.fixtures.indexOf(name);
                if (index > -1) {
                    selected_group.fixtures.splice(index, 1);
                }
                var element = {};
                element.groupname = selected_group.name;
                element.fixturename = name;

                deleteFixtureFromGroup(element,function (retval) {
                    if(retval != undefined && retval.version != undefined)  // as of 1/24/17, added version.
                    {
                        loadedconfig = retval;
                    }
                    else if(retval.error != undefined)
                        $.Notification.notify('error','top left', 'Error',  'Error saving config ' + retval.error);
                    //noty({text: 'Error saving config ' + retval.error, type: 'error'});
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

    if(group.fixtures != undefined && group.fixtures.length >= 4)
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

    var btndelete = document.createElement("input");
    btndelete.className = "btn btn-xs btn-danger";
    btndelete.type = "button";
    btndelete.value = "Delete";
    btndelete.disabled = true;
    //  btndelete.setAttribute('group', group.name);
    btndelete.onclick = function () {

        for(var i = 0; i < loadedconfig.levelinputs.length; i++)
        {
            if(loadedconfig.levelinputs[i].group == selected_group.name)
            {
                $.Notification.notify('error','top left', 'Error',  'Please reassign level input: ' + loadedconfig.levelinputs[i].assignedname + " to a different group");
                //  noty({text: 'Please reassign level input: ' + loadedconfig.levelinputs[i].assignedname + " to a different group", type: 'error'});
                return;
            }
        }

        for(var i = 0; i < loadedconfig.contactinputs.length; i++)
        {
            if(loadedconfig.contactinputs[i].active_action.includes(selected_group.name) || loadedconfig.contactinputs[i].inactive_action.includes(selected_group.name))
            {
                $.Notification.notify('error','top left', 'Error',  'Please reassign contact input: ' + loadedconfig.contactinputs[i].assignedname + " to a different group");
                //  noty({text: 'Please reassign contact input: ' + loadedconfig.contactinputs[i].assignedname + " to a different group", type: 'error'});
                return;
            }
        }

        bootbox.confirm({
            message : "Please Confirm Delete of Group",
            size: 'small',
            callback: function(result){
                if(result) {
                    deleteConfigObject("group",selected_group,function (retval) {
                        if(retval != undefined)  // as of 1/24/17, added version.
                        {
                            loadedconfig = retval;
                            selected_group = undefined;
                            redrawGroups();

                            filterAvalibleFixtures();
                        }
                        else
                            $.Notification.notify('error','top left', 'Error', 'Error deleting group: ' + retval);
                        //  noty({text: 'Error deleting group: ' + retval, type: 'error'});
                    });
                }
            }});
    };
    buttonholder.appendChild(btndelete);




    var header = document.createElement("h2");
  //  header.className="grouptitle";

   /* header.addEventListener('click', function() {
        var box = bootbox.confirm("<form id='infos' action=''>\
              New Group Name:<input type='text' id='group_name' /><br/>\
        </form>", function(result) {
            if(result) {
                var groupname = $('#group_name').val();
                if(groupname.length > 0) {  //todo validate its unique.
                    //  var groups_div = document.getElementById("active_groups_holder");
                    var group1 = {};
                    group1.name = groupname;
                    /*
                     var j = validate({name: groupname}, constraints);
                     if(j != undefined && j.name != undefined && j.name.length > 0)
                     {
                     $.Notification.notify('error','top left', 'Error',  j.name[0]);

                     return false;
                     }
                     saveConfigObject("group", group1,function (retval) {
                     if(retval != undefined)  // as of 1/24/17, added version.
                     {
                     loadedconfig = retval;
                     var grpnum = loadedconfig.groups.length-1;
                     constructGroupBox(groups_div, group1, grpnum);
                     }
                     else
                     $.Notification.notify('error','top left', 'Error',  'Error creating group ');

                     });

                }
                else
                    $.Notification.notify('error','top left', 'Error',  'Incomplete Name, please try again ');
            }
        });

        box.on('shown.bs.modal',function(){
            $("#group_name").focus();
        });

    }, false);  */

    header.innerHTML = group.name;
    fixboxheader.appendChild(header);

    var fixcontent = document.createElement("div");
    fixcontent.className = "box-content";
    fixbox.appendChild(fixcontent);

    var dropzonediv = document.createElement("div");
    dropzonediv.className = "group_dropzone";
    dropzonediv.id = "group_"+groupnum;
    dropzonediv.setAttribute("index",groupnum);
    // dropzonediv.innerHTML = "test";
    fixcontent.appendChild(dropzonediv);


    $('.group_dropzone').on('click', function(){
        var x = $(this).css('backgroundColor');

        var selecteditemthistime = $(this);
        // if selected item is not ud , and it does not equal the current.
        // then disable the current,
        if(selecteditem != undefined && selecteditem.get(0) != selecteditemthistime.get(0))
        {
            //disable action buttons on all ,
            for(var k = 0; k <  loadedconfig.groups.length; k++)
            {
                var disableele = '#actionbuttons_'+k;

                $(disableele).children().prop('disabled', true);
                //$(disableele).children().addClass('disabled');
                // $(disableele).children().removeClass('active');
            }



            selecteditem.css("border-color", defaultcolor);
            selecteditem.droppable("option", "disabled", true);
            enableDisableFixturesInDiv(selecteditem, false);

            $(this).css("border-color", "blue");
            selecteditem = selecteditemthistime; //$(this);
            enableDisableFixturesInDiv(selecteditem, true);
            $(this).droppable("option", "disabled", false);

            var selectedindex = selecteditem.attr('index');

            var enableelement = '#actionbuttons_'+selectedindex;

            $(enableelement).children().prop('disabled', false);
            // $(enableelement).children().removeClass('disabled');
            // $(enableelement).children().addClass('active');

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

            var enableelement = '#actionbuttons_'+selectedindex;

            $(enableelement).children().prop('disabled', false);
            // $(enableelement).children().removeClass('disabled');
            //  $(enableelement).children().addClass('active');

            selected_group = loadedconfig.groups[Number(selectedindex)];
            filterAvalibleFixtures();
        }
    });



    $('.group_dropzone').droppable({
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
                // if(selected_group.fixtures != undefined || selected_group.fixtures.indexOf(name) != -1)
                //     return;

                selected_group.fixtures.push(name);

                var element = {};
                element.groupname = selected_group.name;
                element.fixturename = name;

                addFixtureToGroup(element,function (retval) {
                    if(retval != undefined && retval.version != undefined)  // as of 1/24/17, added version.
                    {
                        loadedconfig = retval;
                    }
                    else if(retval.error != undefined)
                        $.Notification.notify('error','top left', 'Error', 'Error saving fixture to group: ' + retval.error);
                    // noty({text: 'Error saving fixture to group: ' + retval.error, type: 'error'});
                });

                if (selected_group.fixtures != undefined && selected_group.fixtures.length == 4)  // if going from 2-->3
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
    if(group.fixtures != undefined) {
        for (var i = 0; i < group.fixtures.length; i++) {
            var fixname = group.fixtures[i];
            var fixobj = getFixtureByName(fixname);
            if (fixobj != undefined) {

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
                debug_label.innerHTML = fixobj.assignedname;
                labeldiv.appendChild(debug_label);
            }
        }
    }


    var test = $(dropzonediv);
    enableDisableFixturesInDiv(test,false);
    $(dropzonediv).droppable("option", "disabled", true);
}



function getFixtureByName(name)
{
    for(var i = 0 ; i < loadedconfig.fixtures.length; i++)
    {
        var fixobj = loadedconfig.fixtures[i];
        if(name == fixobj.assignedname)
            return fixobj;
    }
    return undefined;
}

