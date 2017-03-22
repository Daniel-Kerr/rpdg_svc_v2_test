/**
 * Created by Nick on 11/30/2016.
 */

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

    var repeat = 'none';
    for (var i = 0; i < dialogrepeatsel.length; i++) {
        if (dialogrepeatsel[i].checked) {
            repeat = dialogrepeatsel[i].value;
            break;
        }
    }

    var eventtype = 'none';
    for (var i = 0; i < eventtypesel.length; i++) {
        if (eventtypesel[i].checked) {
            eventtype = eventtypesel[i].value;
            break;
        }
    }

    var values = [];
    if(eventtype == 'scene')
    {
        title = $('#scene').val();
    }

    if(eventtype == 'output')
    {
        title = 'output';
        for(var idx = 1; idx < 5; idx++) {
            var outsel= document.getElementsByName('out' + idx);
            for (var i = 0; i < outsel.length; i++) {
                if (outsel[i].checked) {

                    values.push(outsel[i].value);
                    break;
                }
            }
        }
    }

    if(eventtype == 'input')
    {
        title = 'input';
        for(var idx = 1; idx < 5; idx++) {
            var outsel= document.getElementsByName('in' + idx);
            for (var i = 0; i < outsel.length; i++) {
                if (outsel[i].checked) {
                    values.push(outsel[i].value);
                    break;
                }

            }
        }
    }

    if(eventtype == 'dryinput')
    {
        title = 'dryinput';
        for(var idx = 1; idx < 5; idx++) {
            var outsel= document.getElementsByName('dryin' + idx);
            for (var i = 0; i < outsel.length; i++) {
                if (outsel[i].checked) {
                    values.push(outsel[i].value);
                    break;
                }
            }
        }
    }


    if (title != '') {

        var event = {};
        var sdate = startdt.clone();
        var bla = sdate;
        var k = sdate.toISOString();

        event.start = sdate;
        event.title = title;

        if(existingid != undefined)
            event.id = existingid;
        else
            event.id = new Date().getTime();
        event.type = eventtype;
        event.values = values;
        if (repeat == 'daily')
            event.rdaily = true;
        if (repeat == 'weekly')
            event.rweekly = true;
        if (repeat == 'dayofmonth') {
            event.rdayofmonth = document.getElementById('dayofmonth').value;
        }

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
    var title = $('#eventTitle');
    var eventstarttime = $('#eventtime');
    var eventdate = $('#eventdate');
    var eventClass, color;
    //color = "#9E6320";
    //eventClass = "gbcs-allday-event";
    var temp = eventdate.val() + " " + eventstarttime.val();
    var datemerged = new Date(temp);
    var startdt = new moment(datemerged);

    var event = {};
    event.id = selectedevent.id;

    var sdate = startdt.clone();

    event.start = sdate;
    event.title = title.val();

    var repeat = 'none';
    for (var i = 0; i < dialogrepeatsel.length; i++) {
        if (dialogrepeatsel[i].checked) {
            repeat = dialogrepeatsel[i].value;
            break;
        }
    }

    // event.id = 'sdlkfjdslkjskj';
    // event.type = eventtype;
    // event.values = values;
    if (repeat == 'daily')
        event.rdaily = true;
    if (repeat == 'weekly')
        event.rweekly = true;
    if (repeat == 'dayofmonth') {
        event.rdayofmonth = document.getElementById('dayofmonth').value;
    }

    deleteScheduleEvent(event, eventDeleteHandler);

   /* var dataset = JSON.stringify(event);
    $.ajax({
        url: "/schedule/delevent",
        type: 'post',
        data: dataset,
        contentType: "application/json; charset=utf-8",
        success: function (result) {
            $myCalendar.fullCalendar('refetchEvents');
            noty({text: 'Event(s) Deleted', type: 'success'});
        },
        error: function (xhr, ajaxOptions, thrownError) {
            noty({text: 'Error deleting new event ', type: 'error'});
        }
    });*/
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


      //  for (var i = 0 ; i < namelist.length; i += 1) {

      //  }

}


var cachedconfig;

function initscenesel()
{

    getConfig(processSceneNameList);
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