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
var html = function(id) { return document.getElementById(id); }; //just a helper
var dp = undefined;
var user_pref_format = 12;
var view_mode = "month";

var initenablebtn = true;

$( function() {
    $( "#eventdate" ).datepicker();
} );

$(document).ready(function() {
    getConfig(processConfig)
});

$(function() {
    $('#schedenable').change(function() {
        if(!initenablebtn) {
            var enabled = $(this).prop('checked');
            var element = {};
            element.enable = enabled;
            setScheduleMode(element, function () {

            });
        }
    })
})


function processConfig(configobj) {
    cachedconfig = configobj;


    var enabled = cachedconfig.generalsettings.schedulemode;
    $('#schedenable').prop('checked', enabled).change();
    initenablebtn = false;


    var date_format = "%H:%i";
    if(user_pref_format == 12)
        date_format = "%h:%i %A";

    scheduler.config.hour_date=date_format;


    scheduler.init('scheduler_here', new Date(),"month");
    scheduler.setLoadMode("month");
    scheduler.load("schedule/getschedule2", "json", function () {

    });
    dp = new dataProcessor("schedule/getschedule2");
    dp.init(scheduler);

    scheduler.locale.labels.timeline_tab ="Timeline";
    scheduler.createTimelineView({
        name:"timeline",
        x_unit:"minute",//measuring unit of the X-Axis.
        x_date:date_format, //date format of the X-Axis
        x_step:30,      //X-Axis step in 'x_unit's
        x_size:24,      //X-Axis length specified as the total number of 'x_step's
        x_start:0,     //X-Axis offset in 'x_unit's
        x_length:24,    //number of 'x_step's that will be scrolled at a time
        y_unit:         //sections of the view (titles of Y-Axis)
            [{key:"Scene", label:"Scene"},
                {key:"Input", label:"Input"}],
        y_property:"resource_id", //mapped data property
        render:"bar"             //view mode
    });



    scheduler.templates.timeline_cell_class = function(evs, date, section){
        if(date.getHours() >= 12){
            return "color-cell";
        }
        return "";
    };

    scheduler.showLightbox = function(id) {
        var ev = scheduler.getEvent(id);
        scheduler.startLightbox(id, html("my_form"));
        html("eventaction").focus();
        html("eventaction").value = "scene";
        html("eventtimebasesel").value = "absolute";
        html("eventrepeat").value = "none";
        var formatteddatestr = moment(ev.start_date).format('h:mm a');
        $('#eventtime').timepicker('setTime', formatteddatestr);
        if (ev != undefined) {
            if(ev.text != "New event") {
                html("eventtimebasesel").disabled = true;
                html("eventrepeat").disabled =true;

                html("eventaction").value = ev.action;
                onEventCatagoryChange();

                // remove prefix. and set ..
                var parts = ev.text.split(':');
                if(parts.length == 2) {

                    html("eventname").value = parts[1].trim(); //ev.text;
                }

                html("eventtimebasesel").value = ev.timebase;


                if(ev.timebase != "absolute")
                {
                    html("eventtimehour").value = ev.relhour;
                    html("eventtimemin").value = ev.relmin;
                }

                html("eventrepeat").value = ev.repeat;
            }
            else
            {
                html("eventtimebasesel").disabled = false;
                html("eventrepeat").disabled =false;
                onEventCatagoryChange();
                html("eventname").index = 0;
            }
        }
        onTimeBaseChange();
    };


    scheduler.attachEvent("onBeforeDrag", function (id, mode, e){
        //any custom logic here
        var ev = scheduler.getEvent(id);
        if(ev == undefined)
            return true;

        if(ev.timebase != "absolute")
        {
            return false;
        }
        return true;
    })

    scheduler.attachEvent("onEventChanged", function(id,ev){
        if(ev.repeat != "none") {
            scheduler.clearAll();
            scheduler.load("schedule/getschedule2", "json", function () {

            });
        }
    });

    scheduler.attachEvent("onBeforeEventDisplay", function(id,view){
        //any custom logic here

        return true;

    });
    scheduler.attachEvent("onEventLoading", function(ev){
        //any custom logic here
        //  if(view_mode == "month")
        //{
        //  var ev = scheduler.getEvent(id);
        //   var endd = ev.start_date;
        //   endd.setMinutes(endd.getMinutes()+1);
        //  ev.end_date = endd;
        // }
        return true;
    });

    scheduler.attachEvent("onViewChange", function (new_mode , new_date){
        //any custom logic here
        var k = 0;
        k =  k  + 1;
    });

    scheduler.attachEvent("onBeforeEventChanged", function(ev, e, is_new, original){
        if(!is_new)  //prevent resizing, (end date change),  prevent resource_id change, scene --> input..
        {
            if(ev.resource_id != original.resource_id) //prevent resource id changeing.
            {
                return false;
            }

            if(ev.start_date.getTime() === original.start_date.getTime() &&  ev.end_date.getTime() !== original.end_date.getTime())
            {
                return false
            }

            if(ev.end_date.getTime() === original.end_date.getTime() &&  ev.start_date.getTime() !==  original.start_date.getTime())
            {
                return false
            }

        }


        //any custom logic here
        return true;
    });

    // initdayofmonthsel();
    // dialogrepeatsel = document.getElementsByName('repeat');
    // eventtypesel = document.getElementsByName('eventtype');

    $('#eventtime').timepicker();

    // init the sel boxes for rel time
    initRelTimeSelects();
    onTimeBaseChange();

    onEventCatagoryChange();
}


var delayedrefresh = undefined;
function delayedRefreshSchedule()
{
    delayedrefresh = setInterval(function () {
        scheduler.clearAll();
        scheduler.load("schedule/getschedule2", "json", function () {
        });
        clearInterval(delayedrefresh);
        delayedrefresh = undefined;
    }, 1000);
}



function show (elements, specifiedDisplay) {
    elements = elements.length ? elements : [elements];
    for (var index = 0; index < elements.length; index++) {
        elements[index].style.display = specifiedDisplay || 'block';
    }
}



function save_form() {
    var ev = scheduler.getEvent(scheduler.getState().lightbox_id);


    // check if its a new or edit,
    if(ev.text == "New event")
    {
        ev.repeat = html("eventrepeat").value;
        ev.timebase = html("eventtimebasesel").value;
    }
    else
    {

    }

    ev.action = html("eventaction").value;

    var prefix = ev.action + ": "
    // if(ev.action == "scene")
    //    prefix = 'scene: ';
    //if(ev.action == "ignore")
    //    prefix = 'ignore: ';

    ev.text = prefix + html("eventname").value;


    if(ev.action == "scene")
        ev.resource_id = "Scene"
    else
        ev.resource_id = "Input";

    // time storage is always as 24 hr clock,
    if(ev.timebase == "absolute")
    {
        var tempstart = new Date(ev.start_date);
        var abstime = html("eventtime").value;

        var parts = abstime.split(":");
        if(parts.length == 2)
        {
            var hour = Number(parts[0]);
            var min = Number(parts[1].substr(0,3));
            if(abstime.includes("AM") && hour >= 12)
                hour -= 12;
            else if(abstime.includes("PM") && hour < 12)  // add 12 if hour < 12,
                hour += 12;

            tempstart.setHours(hour);
            tempstart.setMinutes(min);
            ev.start_date = tempstart;
        }
    }
    if(ev.timebase == "before_ss" || ev.timebase == "after_ss" || ev.timebase == "before_sr" || ev.timebase == "after_sr")
    {
        var hour = html("eventtimehour").value;
        var min = html("eventtimemin").value;
        ev.relhour = hour;
        ev.relmin = min;

    }


    var end = new Date(ev.start_date);
    end.setHours(end.getHours()+2);
    ev.end_date = end;

    // overlap thing, 4/13/17
    var hrs = ev.start_date.getHours();
    if((ev.start_date.getHours() == 22 && ev.start_date.getMinutes() > 0)|| ev.start_date.getHours() == 23) // if > 10:00 PM
    {
        //var modend = new Date(ev.start_date);
        //get time between midnight and start, calc and set to window -1,
        var end = new Date(ev.start_date);
        end.setHours(23);
        end.setMinutes(59);
        ev.end_date = end;
    }

    scheduler.endLightbox(true, html("my_form"));

    if(ev.repeat != "none" || ev.timebase == "before_ss" || ev.timebase == "after_ss" || ev.timebase == "before_sr" || ev.timebase == "after_sr") {

        delayedRefreshSchedule();
       // scheduler.clearAll();
       // scheduler.load("schedule/getschedule2", "json", function () {
       // });
    }
    else {
        // only covers absolute no repeast ,  becuase we dont reload.
        // set color
        if(ev.timebase == "absolute" && ev.repeat == "none")
        {
            ev.color = '#7cff8e';
            ev.textColor = '#111111';
        }
    }
}
function close_form() {
    scheduler.endLightbox(false, html("my_form"));
}

function delete_event() {
    var event_id = scheduler.getState().lightbox_id;
    scheduler.endLightbox(false, html("my_form"));
    // get the event, if daily, mark all with same base id as dirty. (deleted),
    var ev = scheduler.getEvent(event_id);
    scheduler.deleteEvent(event_id);
    if(ev.repeat != "none") {
        scheduler.clearAll();
        scheduler.load("schedule/getschedule2", "json", function () {

        });
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

function onEventCatagoryChange()
{
    var action = $('#eventaction').val();
    if(action == "scene")
    {
        populateDropDown("eventname",getSceneNames());
    }
    else
    {
        populateDropDown("eventname",getInputNames());
    }
}

function getSceneNames()
{
    var names = [];

    names.push("ALL_OFF");
    names.push("ALL_10");
    names.push("ALL_50");
    names.push("ALL_ON");

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



function show_minical(){
    if (scheduler.isCalendarVisible()){
        scheduler.destroyCalendar();
    } else {
        scheduler.renderCalendar({
            position:"dhx_minical_icon",
            date:scheduler._date,
            navigation:true,
            handler:function(date,calendar){
                scheduler.setCurrentView(date);
                scheduler.destroyCalendar()
            }
        });
    }
}


