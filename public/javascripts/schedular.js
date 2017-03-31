/**
 * Created by Nick on 11/30/2016.
 */


var toggles;
var sliders;
var leavecheckboxes;
var dialogrepeatsel;
var eventtypesel;
var dateselector;
var timeselector;
// for del dev,
var selectedevent;
var selectedeventdiv;

var cachedconfig;


$( function() {
    $( "#eventdate" ).datepicker();
} );

$(document).ready(function() {

    $myCalendar = $('#myCalendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek, agendaDay'
        },
        theme: true,
        selectable: true,
        ignoreTimezone: false,
        selectHelper: true,
        height: 800,
        eventColor: '#9ec3ff',
        events: '/schedule/getschedule',
        select: function(start, end, allDay) {

            var t = moment(end._d);
            var eventstarttime = moment(start._d);

            var blax = eventstarttime.utc().format('HH:mm');

            var bla2 = t.format('MM/DD/YYYY');

            $( "#eventdate").datepicker( "setDate", bla2 );


            $('#eventtime').timepicker('setTime', blax);


            selectedevent = undefined;
            document.getElementById("btdelete").disabled = true;

            document.getElementById("eventmgtitle").style.color = 'black';
            document.getElementById("eventmgtitle").innerHTML = "Event Managment";
            // $('#calEventDialog').dialog('open');
            $(selectedeventdiv).css('background-color','#9ec3ff');
            selectedeventdiv = undefined;
        },
        eventRender: function(event, element) {

            var i = 0;
            i = i + 1;
            // if(event.rweekly != undefined)
            //     console.log("found a weekly repeat"); // Writes "1"
        },

        eventClick: function (calEvent, jsEvent, view) {

            document.getElementById("eventmgtitle").style.color = 'red';
            document.getElementById("eventmgtitle").innerHTML = "Event Managment (EDITING)";
          //  resetEventTypeOptions();

            if( selectedeventdiv != undefined)
            {
                $(selectedeventdiv).css('background-color','#9ec3ff');
                selectedeventdiv = undefined;
            }
            selectedeventdiv = this;
            //  $(this).css('background-color','red');
            $(selectedeventdiv).css('background-color','red');
            document.getElementById("btdelete").disabled = false;
            selectedevent = calEvent;
            var seldata = calEvent.start._i;

            var t = moment(seldata);
            var bla2 = t.format('MM/DD/YYYY');

            $( "#eventdate").datepicker( "setDate", bla2);
            $('#eventtime').timepicker('setTime', seldata.substring(10));



            var repeatradios = document.getElementsByName("repeat");
            for(var i = 0; i < repeatradios.length; i++)
            {
                if(calEvent.rweekly && repeatradios[i].value == 'weekly')
                {
                    repeatradios[i].checked = true;
                    break;
                }
            }

            var eventtype = document.getElementsByName("eventtype");
            for(var i = 0; i < eventtype.length; i++)
            {
                if(calEvent.type == 'scene' && eventtype[i].value == 'scene')
                {
                    eventtype[i].checked = true;

                    $('#div_scene_config').show();
                    $('#div_output_config').hide();
                    $('#div_input_config').hide();
                    $('#div_dryinput_config').hide();
                    // now set the scene.
                    document.getElementById('scene').value = calEvent.title;
                    break;
                }

                if(calEvent.type == 'output' && eventtype[i].value == 'output')
                {
                    eventtype[i].checked = true;
                    $('#div_scene_config').hide();
                    $('#div_output_config').show();
                    $('#div_input_config').hide();
                    $('#div_dryinput_config').hide();
                    for(var idx = 1; idx < 5; idx++) {  //for each selection,
                        var insel= document.getElementsByName('out' + idx);  //get the two options
                        var values = calEvent.values;
                        var selvalue = values[idx-1];
                        if (selvalue == 'nochange')
                            insel[0].checked =true;
                        else if(selvalue == 'on')
                            insel[1].checked =true;
                        else
                            insel[2].checked = true;
                    }
                    break;
                }

                if(calEvent.type == 'input' && eventtype[i].value == 'input')
                {
                    eventtype[i].checked = true;
                    $('#div_scene_config').hide();
                    $('#div_output_config').hide();
                    $('#div_input_config').show();
                    $('#div_dryinput_config').hide();
                    for(var idx = 1; idx < 5; idx++) {  //for each selection,
                        var insel= document.getElementsByName('in' + idx);  //get the two options
                        var values = calEvent.values;
                        var selvalue = values[idx-1];
                        if (selvalue == 'ignore') {
                            insel[0].checked =true;
                        }
                        else
                            insel[1].checked =true;
                    }
                    break;
                }
                if(calEvent.type == 'dryinput' && eventtype[i].value == 'dryinput')
                {
                    eventtype[i].checked = true;
                    $('#div_scene_config').hide();
                    $('#div_output_config').hide();
                    $('#div_input_config').hide();
                    $('#div_dryinput_config').show();
                    for(var idx = 1; idx < 5; idx++) {  //for each selection,
                        var insel= document.getElementsByName('dryin' + idx);  //get the two options
                        var values = calEvent.values;
                        var selvalue = values[idx-1];
                        if (selvalue == 'ignore') {
                            insel[0].checked =true;
                        }
                        else
                            insel[1].checked =true;
                    }
                    break;
                }
            }

        }
    });


    getConfig(processConfig);
    initdayofmonthsel();
    dialogrepeatsel = document.getElementsByName('repeat');

    eventtypesel = document.getElementsByName('eventtype');


    $('#eventtime').timepicker();

   /* $('.toggleButton').click(function(){

        var target = $('#' + $(this).attr('data-target'));
        $('.toggleDiv').not(target).hide();
        target.show();
    });

    $('#div_scene_config').show();
    $('#div_output_config').hide();
    $('#div_input_config').hide();
    $('#div_dryinput_config').hide();
*/

    // init the sel boxes for rel time
    initRelTimeSelects();
   onTimeBaseChange();

});


function processConfig(configobj) {
    cachedconfig = configobj;


}


function show (elements, specifiedDisplay) {
    elements = elements.length ? elements : [elements];
    for (var index = 0; index < elements.length; index++) {
        elements[index].style.display = specifiedDisplay || 'block';
    }
}


function resetEventTypeOptions()
{
    document.getElementById('scene').value = '----';
    for(var idx = 1; idx < 5; idx++) {  //for each selection,
        var insel= document.getElementsByName('out' + idx);  //get the two options

        insel[0].checked =true;
    }

    for(var idx = 1; idx < 5; idx++) {  //for each selection,
        var insel= document.getElementsByName('in' + idx);  //get the two options

        insel[0].checked =true;
    }

    for(var idx = 1; idx < 5; idx++) {  //for each selection,
        var insel= document.getElementsByName('dryin' + idx);  //get the two options

        insel[0].checked =true;
    }
}

function setTableEnable(table, disable)
{
    var inputs=document.getElementById(table).getElementsByTagName('input');
    for(var i=0; i<inputs.length; ++i)
        inputs[i].disabled=disable;
}

function saveEventonHost(existingid)
{
    var eventstarttime = $('#eventtime');
    var eventdate = $('#eventdate');
    var eventClass, color;
    var temp = eventdate.val() + " " + eventstarttime.val();
    var datemerged = new Date(temp);
    var startdt = new moment(datemerged);

    var repeat = $('#eventrepeat').val();

   // var eventtype = 'none';
   // for (var i = 0; i < eventtypesel.length; i++) {
   //     if (eventtypesel[i].checked) {
    //        eventtype = eventtypesel[i].value;
    //        break;
    //    }
   // }

    var values = [];
    var title = "???"
   // if(eventtype == 'scene')
    //{
    var action = $('#eventaction').val();
    switch(action)
    {
        case "scene":
            title = "scene: "+$('#eventopt1').val();
            eventtype = "scene";
            break;
        case "ignore_input_start":
            title = "start_ignore: "+ $('#eventopt1').val();
            eventtype = "start_ignore";
            break;
        case "ignore_input_stop":
            title = "stop_ignore: "+$('#eventopt1').val();
            eventtype = "stop_ignore";
            break;

        default:
            break;
    }

    if (title != '') {

        var event = {};
        var sdate = startdt.clone();
        var bla = sdate;
        var k = sdate.toISOString();

        event.start = sdate;
        event.title = title;
        event.timebase = $('#eventtimebasesel').val();;

        if(existingid != undefined)
            event.id = existingid;
        else
            event.id = new Date().getTime();


        event.type = eventtype;

        event.repeat = repeat;
       // event.values = values;
       // if (repeat == 'daily')
       //     event.rdaily = true;
       // if (repeat == 'weekly')
       //     event.rweekly = true;
        // to do.
       // if (repeat == 'dayofmonth') {
       //     event.rdayofmonth = document.getElementById('dayofmonth').value;
       // }

        var newevent = (existingid == undefined);
        addScheduleEvent(event, newevent,  eventAddHandler);

        /*
         var dataset = JSON.stringify(event);
         $.ajax({
         url: "/schedule/addevent",
         type: 'post',
         data: dataset,
         contentType: "application/json; charset=utf-8",
         success: function (result) {
         $myCalendar.fullCalendar('refetchEvents');
         if(existingid == undefined)
         noty({text: 'Event(s) Added', type: 'success'});
         else
         noty({text: 'Event(s) Updated', type: 'success'});
         },
         error: function (xhr, ajaxOptions, thrownError) {
         noty({text: 'Error adding new event ', type: 'error'});
         }
         });
         */
    }
    $myCalendar.fullCalendar('unselect');
}


function eventAddHandler(newevent, result)
{
    $myCalendar.fullCalendar('refetchEvents');

    if(result == "error")
    {
        noty({text: 'Error adding new event ', type: 'error'});
        return;
    }

    if(newevent)
        noty({text: 'Event(s) Added', type: 'success'});
    else
        noty({text: 'Event(s) Updated', type: 'success'});

}

function saveevent(){

    if(selectedevent != undefined)
    {
        bootbox.confirm("Overwrite event: " + selectedevent.title, function(){
            console.log('This was logged in the callback!');
            saveEventonHost(selectedevent.id);  // here we overwrite,
        });
    }
    else
    {
        saveEventonHost();
    }


}

function deleteevent()
{
  //  var title = $('#eventTitle');
  //  var eventstarttime = $('#eventtime');
   // var eventdate = $('#eventdate');
 //   var eventClass, color;
    //color = "#9E6320";
    //eventClass = "gbcs-allday-event";
   // var temp = eventdate.val() + " " + eventstarttime.val();
   // var datemerged = new Date(temp);
   // var startdt = new moment(datemerged);
    var event = {};
    event.id = selectedevent.id;
   // var sdate = startdt.clone();

   // event.start = sdate;
   // event.title = title.val();
    var repeat = 'none';
    event.repeat = selectedevent.repeat;
    // event.id = 'sdlkfjdslkjskj';
    // event.type = eventtype;
    // event.values = values;
   // if (repeat == 'daily')
    //    event.repeat = true;
   // if (repeat == 'weekly')
   //     event.rweekly = true;
   // if (repeat == 'dayofmonth') {
   //     event.rdayofmonth = document.getElementById('dayofmonth').value;
   // }
    deleteScheduleEvent(event, eventDeleteHandler);

}

function eventDeleteHandler(result)
{
    $myCalendar.fullCalendar('refetchEvents');

    if(result == "error")
    {
        noty({text: 'Error removing event ', type: 'error'});
        return;
    }

    noty({text: 'Event(s) Removed', type: 'success'});

}

function processSceneNameList(config)
{
    cachedconfig = config;
    var sel = document.getElementById('scene');
    for(var i = 0; i < config.scenes.length; i++)
    {
        var name = config.scenes[i].name;

        var opt = document.createElement('option');
        opt.setAttribute('value', name);
        opt.appendChild(document.createTextNode(name));
        sel.appendChild(opt);
    }
}


var cachedconfig;

function initscenesel()
{

   // getConfig(processSceneNameList);
}


function initdayofmonthsel()
{
    var sel = document.getElementById('dayofmonth');
    for (var i = 1 ; i < 31; i++) {
        var opt = document.createElement('option');
        opt.setAttribute('value', i);
        opt.appendChild(document.createTextNode(i));
        sel.appendChild(opt);
    }
}



function initRelTimeSelects()
{
    var sel = document.getElementById('eventtimehour');
    for (var i = 0 ; i < 13; i++) {
        var opt = document.createElement('option');
        opt.setAttribute('value', i);
        opt.appendChild(document.createTextNode(i));
        sel.appendChild(opt);
    }

    var sel = document.getElementById('eventtimemin');
    for (var i = 0 ; i < 60; i++) {
        var opt = document.createElement('option');
        opt.setAttribute('value', i);
        opt.appendChild(document.createTextNode(i));
        sel.appendChild(opt);
    }
}

function onTimeBaseChange()
{
    var timebase = $('#eventtimebasesel').val();

    if(timebase == "absolute")
    {
        $('#abstimepicker').show();
        $('#reltimehour').hide();
        $('#reltimemin').hide();
    }
    else
    {
        $('#abstimepicker').hide();
        $('#reltimehour').show();
        $('#reltimemin').show();
    }

}

function onEventActionChanged()
{
    var action = $('#eventaction').val();
    if(action == "scene")
    {
        populateDropDown("eventopt1",getSceneNames());
    }
    else
    {
        populateDropDown("eventopt1",getInputNames());
    }
}


function getSceneNames()
{
    var names = [];
    for(var i = 0; i < cachedconfig.scenes.length; i++)
    {
        names.push( cachedconfig.scenes[i].name);
    }
    return names;
}


function getInputNames()
{
    var names = [];
    for(var i = 0; i < cachedconfig.contactinputs.length; i++)
    {
        names.push(cachedconfig.contactinputs[i].assignedname);
    }

    for(var i = 0; i < cachedconfig.levelinputs.length; i++)
    {
        names.push(cachedconfig.levelinputs[i].assignedname);
    }
    return names;
}


function populateDropDown(dropdown, optionslist)
{
    var sel = document.getElementById(dropdown);
    while (sel.options.length > 0) {
        sel.remove(0);
    }

    for (var i = 0 ; i < optionslist.length; i += 1) {
        var opt = document.createElement('option');
        opt.setAttribute('value', optionslist[i]);
        opt.appendChild(document.createTextNode(optionslist[i]));
        sel.appendChild(opt);
    }

}
