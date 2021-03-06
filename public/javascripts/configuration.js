/**
 * Created by Nick on 11/29/2016.
 */
const ATTR_PARAM = 'param';

var loadedgroupnames = [];
var loadedscenenames = [];
var global_paramoptions;
var cachedinterfaceio ;
var availibleinputs = [];
var hostip = "";
var cachedconfig = "";
var rpdg_highvoltage = false;
var selected_edit_fixture = undefined;
var fixturetable = undefined;
var selectedfixtureindex = -1;
var selectedcontactinputindex = -1;
var selectedlevelinputindex = -1;

var fixtureimgcount = 0;
var scriptnames = undefined;

var wetdrycontacttable = undefined;
var levelinputstable = undefined;

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
    },
    minctemp: {
        numericality: {
            onlyInteger: true,
            greaterThanOrEqualTo:1800,
            lessThanOrEqualTo:6500
        }
    },
    maxctemp: {
        numericality: {
            onlyInteger: true,
            greaterThanOrEqualTo:1800,
            lessThanOrEqualTo:6500
        }
    }
}






$(document).ready(function() {


    $('#portlet1').collapse({'toggle': false});   //bug 322 9/5/17
    $('#portlet_gs').collapse({'toggle': false});
    $('#portlet_netinfo').collapse({'toggle': false});
    $('#portlet2').collapse({'toggle': false});
    $('#portlet3').collapse({'toggle': false});



    $("#fixturetable").on("click", " tbody > tr", function(e) {

        selectedlevelinputindex = -1;
        selectedcontactinputindex = -1;
        // 3/15/17, remove any thing else that is highlighted,
        $('#wetdrycontacttable > tbody  > tr').each(function() {
            $(this).removeClass('bg-primary');
        });
        $('#levelinputstable > tbody  > tr').each(function() {
            $(this).removeClass('bg-primary');
        });


        if ( $(this).hasClass('bg-primary') ) {
            $(this).removeClass('bg-primary');

            // 7/5/17 set sel item to null,
            selectedfixtureindex = -1;
            selected_edit_fixture = undefined;
            document.getElementById("fixturetype").value = "on_off";
            document.getElementById("fixturename").value = "";
            document.getElementById("starting_output").value = "1";
            document.getElementById("interface").value = "rpdg-pwm";
        }
        else {

            // fixturetable.$('tr.active').removeClass('active');
            // $(this).addClass('active');

            //$(this).addClass('active').siblings().removeClass('active');
            $(this).addClass('bg-primary').siblings().removeClass('bg-primary');



            var row = $(this).find('td:first').text();
            // alert('You clicked ' + row);

            for(var i = 0; i < cachedconfig.fixtures.length; i++)
            {
                var fixture = cachedconfig.fixtures[i];
                if(fixture.assignedname == row)
                {

                    selectedfixtureindex = i;
                    selected_edit_fixture = fixture;


                    document.getElementById("fixturetype").value = fixture.type;
                    document.getElementById("fixturename").value = fixture.assignedname;

                    document.getElementById("interface").value = fixture.interfacename;

                    updateAvalibleStartingOutputNumbers(false);
                    document.getElementById("starting_output").value = fixture.outputid; //[0]; // need to do some work here.
                    if(fixture.type == "cct")
                    {
                        showCCTOptions(true);

                        // document.getElementById("candledim").disabled = false;
                        document.getElementById("candledim").checked = fixture.candledim;

                        document.getElementById("minctemp").value = fixture.min;
                        document.getElementById("maxctemp").value = fixture.max;

                    }
                    else {
                        showCCTOptions(false);
                        // document.getElementById("candledim").checked = false;
                        // document.getElementById("candledim").disabled = true;
                    }

                    if(fixture.interfacename == "rpdg-pwm")
                        show12VoltOption(true);
                    else
                        show12VoltOption(false);


                    if((fixture.type == "rgbw" || fixture.type == "cct" || fixture.type == "rgb" || fixture.type == "rgbwwcw") && !rpdg_highvoltage )
                    {
                        showCommonAnodeOption(true);
                        document.getElementById("commonanode").checked = fixture.commonanode;
                    }
                    else
                        showCommonAnodeOption(false);


                    for(var j = 0; j < availibleinputs.length; j++)
                    {
                        var cb = availibleinputs[j];
                        var cbval = $(cb).val();
                        if(fixture.boundinputs.includes(cbval))
                            $(cb).prop('checked',true);
                        else
                            $(cb).prop('checked',false);

                    }

                    var tvd = (fixture.twelvevolt != undefined)? fixture.twelvevolt: false;
                    document.getElementById("twelvevolt").checked = tvd;

                    document.getElementById("fixtureparam_0").value = fixture.parameters.dimoptions;
                    document.getElementById("fixtureparam_1").value =fixture.parameters.dimrate;
                    document.getElementById("fixtureparam_2").value = fixture.parameters.brightenrate
                    document.getElementById("fixtureparam_3").value =fixture.parameters.resptoocc;
                    document.getElementById("fixtureparam_4").value =fixture.parameters.resptovac;
                    document.getElementById("fixtureparam_5").value = fixture.parameters.resptodl50;
                    document.getElementById("fixtureparam_6").value = fixture.parameters.resptodl40;
                    document.getElementById("fixtureparam_7").value =fixture.parameters.resptodl30;
                    document.getElementById("fixtureparam_8").value = fixture.parameters.resptodl20;
                    document.getElementById("fixtureparam_9").value = fixture.parameters.resptodl10;
                    document.getElementById("fixtureparam_10").value = fixture.parameters.resptodl0;
                    document.getElementById("fixtureparam_11").value = fixture.parameters.daylightceiling;
                    document.getElementById("fixtureparam_12").value = fixture.parameters.daylightfloor;

                    document.getElementById("fixtureparam_13").value = fixture.parameters.manualceiling;
                    document.getElementById("fixtureparam_14").value =  fixture.parameters.manualfloor;
                }
            }


            // $(this).addClass('active');
        }
    } );   //end click handler for fixture table.


    $("#interface").change(function () {
        updateAvalibleStartingOutputNumbers(true);
    });

    $("#levelinputinterface").change(function () {
        updateLevelInputs_InputSel();
    });

    $("#contactinputinterface").change(function () {
        updateContactInputs_InputSel();
    });

    // start, click handler for contact input
    $("#wetdrycontacttable").on("click", " tbody > tr", function(e) {

        selectedlevelinputindex = -1;
        selectedcontactinputindex = -1;
        selectedfixtureindex = -1;
        // 3/15/17, remove any thing else that is highlighted,
        $('#fixturetable > tbody  > tr').each(function() {
            $(this).removeClass('bg-primary');
        });
        $('#levelinputstable > tbody  > tr').each(function() {
            $(this).removeClass('bg-primary');
        });


        if ($(this).hasClass('bg-primary')) {
            $(this).removeClass('bg-primary');
        }
        else {
            //$(this).addClass('active').siblings().removeClass('active');
            $(this).addClass('bg-primary').siblings().removeClass('bg-primary');



            var row = $(this).find('td:first').text();


            for(var i = 0; i < cachedconfig.contactinputs.length; i++) {
                var ic = cachedconfig.contactinputs[i];
                if (ic.assignedname == row) {

                    selectedcontactinputindex = i;
                    document.getElementById("contactname").value = ic.assignedname;

                    SelectRadioButton("contacttype",ic.type);
                    SelectRadioButton("contactsubtype",ic.subtype);

                    $("#contactinputinterface").val(ic.interface);

                    updateContactInputs_InputSel();

                    $("#contact_inputnum").val(ic.inputid).change();
                    // updateInputContactActionDropDowns();
                    updateInputContactActionDropDowns(ic);
                    enableDisableInputActionDropDowns();
                }
            }
        }
    });



    // start, click handler for contact input
    $("#levelinputstable").on("click", " tbody > tr", function(e) {

        selectedlevelinputindex = -1;
        selectedcontactinputindex = -1;
        selectedfixtureindex = -1;
        // 3/15/17, remove any thing else that is highlighted,
        $('#fixturetable > tbody  > tr').each(function() {
            $(this).removeClass('bg-primary');
        });
        $('#wetdrycontacttable > tbody  > tr').each(function() {
            $(this).removeClass('bg-primary');
        });



        if ($(this).hasClass('bg-primary')) {
            $(this).removeClass('bg-primary');
        }
        else {
            $(this).addClass('bg-primary').siblings().removeClass('bg-primary');
            var row = $(this).find('td:first').text();

            for(var i = 0; i < cachedconfig.levelinputs.length; i++) {
                var ic = cachedconfig.levelinputs[i];
                if (ic.assignedname == row) {


                    selectedlevelinputindex = i;

                    $("#levelinputname").val(ic.assignedname);
                    $("#levelinputtype").val(ic.type);
                    $("#levelinputinterface").val(ic.interface);

                    updateLevelInputs_InputSel();
                    $("#levelinput_inputs").val(ic.inputid);

                    $("#levelinput_drive").val(ic.drivelevel);

                    $("#groupassignment").val(ic.group);


                    onLevelInputTypeChanged();


                }
            }
        }
    });



});


function SelectRadioButton(name, value) {
    $("input[name='"+name+"'][value='"+value+"']").prop('checked', true);
    return false; // Returning false would not submit the form

}

var inithsbutton = true;
function init()
{
    getConfig(processConfig);
    updateInputContactActionDropDowns();
    enableDisableInputActionDropDowns();
    on_aa_part1_change();
    on_inactive_part1_change();
    on_aa_part2_change();
    on_ina_part2_change();


    constructPWMOutputToggleTable();
    constructPLCOutputToggleTable();

    showCCTOptions(false);
    showCommonAnodeOption(false);
    show12VoltOption(false);

}


function cachehostipaddr(retval)
{
    hostip = retval;
}

function processConfig(configobj)
{
    cachedconfig = configobj;  // just so we can copy over groups on save.

    document.title = cachedconfig.generalsettings.nodename;

    getFixtureParameterOptions(cacheFixtureParamOptions);

    constructContactInputsTable();

    constructLevelInputsTable();


    // place holder,
    for(var i = 0 ; i < cachedconfig.groups.length; i++ )
    {
        loadedgroupnames.push(cachedconfig.groups[i].name);
    }

    // place holder,
    for(var i = 0 ; i < cachedconfig.scenes.length; i++ )
    {
        loadedscenenames.push(cachedconfig.scenes[i].name);
    }





    getInterfaceOutputs(function (retval) {

        cachedinterfaceio = retval;
        updateAvalibleStartingOutputNumbers(true);

        updateLevelInputs_InputSel();
        updateContactInputs_InputSel();
    });


    // site info:
    document.getElementById("sitezip").value = cachedconfig.sitezip;
    document.getElementById("sitelatt").value = cachedconfig.sitelatt;
    document.getElementById("sitelong").value = cachedconfig.sitelong;



    populateDropDown("groupassignment", getGroupNames());

    constructFixtureTable();



    getScriptNames(function (data) {
        scriptnames = data;


        populateDropDown("active_action_sel_part5",scriptnames);
        populateDropDown("inactive_action_sel_part5",scriptnames);

    });


    //getRPDGBoardInfo(function(data) {
    //    rpdg_highvoltage = data.ishighvoltage;
    //var k = data;
    //
    //});

    getVersion(function(ver) {

        if(ver != undefined && ver.boardtype != undefined)
            rpdg_highvoltage = (ver.boardtype == "HV");
    })

    onLevelInputTypeChanged(); //init the active drive gui layout...


    // 6/8/17,
    $('#daylightpoll').val(cachedconfig.daylightpollsec);



    getMiscInfo(function(miscinfo) {

        fixtureimgcount = miscinfo.fiximgcount;

        initImagePickerModal();
        $("#iconpick").imagepicker();

    })


  //  $("#boardvoltage").val(cachedconfig.boardvoltage);

    // 6/19/17,
    var enabled = cachedconfig.generalsettings.hotspotenable;
     if(enabled)
         $('#btwifienable').bootstrapToggle('on');
     else
         $('#btwifienable').bootstrapToggle('off');


    $('#nodename').val(cachedconfig.generalsettings.nodename);
    $('#boardvoltage').val(cachedconfig.generalsettings.boardvoltage);

    $('#nodeip').val(cachedconfig.generalsettings.nodeip);
    $('#routerip').val(cachedconfig.generalsettings.routerip);


    inithsbutton = false;



   updateNetworkTable();
}




function transformFixtureToDataSet()
{
    var datasetobj = {};
    var datasetarray = [];
    for(var i = 0;i < cachedconfig.fixtures.length; i++)
    {
        var fixobj = cachedconfig.fixtures[i];
        datasetarray.push(fixobj);
    }
    datasetobj = datasetarray;
    return datasetobj;
}



function constructFixtureTable()
{
    var dataset = transformFixtureToDataSet();
    fixturetable = $('#fixturetable').DataTable( {
        "aaData": dataset,
        /*  "dom": '<"top"i>rt<"bottom"flp><"clear">',  */
        "pageLength": 5,
        select: true,
        "bLengthChange": false,
        "bInfo": false,
        "aoColumns": [
            { "mData": 'assignedname'},
            { "mData": 'type'},
            { "mData": 'interfacename'},
            { "mData": 'outputid', "bSortable": false},
            { "mData": 'image', "bSortable": false,
                "mRender": function (data, type, row) {
                    var imgstring = '<img src='+data + ' width=30 height=30 onclick=' + '"setfixtureimage()"' +' />';
                    return imgstring;
                }
            }
        ]
    } );
}

/*
function buildassignment(start, type)
{
    var ass = [];
    if(type == "cct")
    {
        ass.push(start);
        var next = start + 1;
        ass.push(next);
        return ass;
    }
    if(type == "rgbw")
    {
        ass.push(start);
        ass.push(start+1);
        ass.push(start+2);
        ass.push(start+3);
        return ass;
    }

    ass.push(start);
    return ass;
}
*/

function saveNewFixture(image) {

    var selstart =  $("#starting_output").val(); //startout.options[startout.selectedIndex].value;
    var seltype = $("#fixturetype").val();  //type.options[type.selectedIndex].value;

    var fixname = document.getElementById("fixturename").value.trim();
    var j = validate({name: fixname}, constraints);
    if(j != undefined && j.name != undefined && j.name.length > 0)
    {
        $.Notification.notify('error','top left', 'Fixture Save Error', j.name[0]);
        return;
    }

    var outputlist = [];
    var interface = $("#interface").val();
    if(interface == "rpdg-pwm")
        outputlist = cachedinterfaceio.rpdg.pwmoutputs.slice(0);
    if(interface == "rpdg-plc")
        outputlist = cachedinterfaceio.rpdg.plcoutputs.slice(0);
    if(interface == "enocean")
        outputlist = cachedinterfaceio.enocean.outputs.slice(0);

    var newitem = (selected_edit_fixture == undefined)? true:false;


    //6/9/17, dup name check, if new item,  or output id /
  //  if(selectedfixtureindex == -1 || ) {
        for (j = 0; j < cachedconfig.fixtures.length; j++) {
            var name = cachedconfig.fixtures[j].assignedname;
            if (name == fixname && selectedfixtureindex != j) {
                $.Notification.notify('error', 'top left', 'Fixture Save Error', "Duplicate Name");
                return;
            }
        }
   // }


    if(interface == "rpdg-pwm" || interface == "rpdg-plc" || interface == "enocean") {
        var outputcheck = outputAvalibleCheck(outputlist, selstart, seltype, fixname, interface, newitem);
        if (!outputcheck) {
            $.Notification.notify('error','top left', 'Fixture Save Error', "Output number conflict, or output limit issue, please check type and output number");
            return;
        }
    }

    if(seltype == "cct")
    {
        var j = validate({minctemp: Number(document.getElementById("minctemp").value)}, constraints);
        if(j != undefined && j.minctemp != undefined && j.minctemp.length > 0)
        {
            $.Notification.notify('error','top left', 'Fixture Save Error', j.minctemp[0]);
            return;
        }

        var j = validate({maxctemp: Number(document.getElementById("maxctemp").value)}, constraints);
        if(j != undefined && j.maxctemp != undefined && j.maxctemp.length > 0)
        {
            $.Notification.notify('error','top left', 'Fixture Save Error', j.maxctemp[0]);
            return;
        }


        if((Number(document.getElementById("minctemp").value) > document.getElementById("maxctemp").value))
        {
            $.Notification.notify('error','top left', 'Fixture Save Error', "Minimum Color temp must be < Maximum");
            return;
        }
    }

    var fixture = {};
    fixture.assignedname = document.getElementById("fixturename").value;
    fixture.type = seltype;
    fixture.interfacename = $("#interface").val();
    fixture.outputid = selstart;
    fixture.image = "/fixtureimg/1.jpg";

    if(image != undefined)
    {
        fixture.image = "/fixtureimg/" + image;
    }

    fixture.status = 0;
    if (seltype == "cct") {
        fixture.candledim = document.getElementById("candledim").checked;
        fixture.min = document.getElementById("minctemp").value;
        fixture.max =  document.getElementById("maxctemp").value;
        fixture.commonanode = document.getElementById("commonanode").checked;
    }
    else if(seltype == "rgbw" || seltype == "rgb" || seltype == "rgbwwcw") {
        fixture.commonanode = document.getElementById("commonanode").checked;
    }

    var boundinputs =[];
    for(var i = 0; i < availibleinputs.length; i++)
    {
        var cb = availibleinputs[i];
        if($(cb).is(':checked'))
        {
            boundinputs.push(cb.val());
        }
    }

    fixture.twelvevolt = document.getElementById("twelvevolt").checked;
    fixture.boundinputs = boundinputs;
    var params = {};  // will contain current settings,
    params.dimoptions = document.getElementById("fixtureparam_0").value;
    params.dimrate = document.getElementById("fixtureparam_1").value;
    params.brightenrate = document.getElementById("fixtureparam_2").value;
    params.resptoocc = document.getElementById("fixtureparam_3").value;
    params.resptovac = document.getElementById("fixtureparam_4").value;
    params.resptodl50 = document.getElementById("fixtureparam_5").value;
    params.resptodl40 = document.getElementById("fixtureparam_6").value;
    params.resptodl30 = document.getElementById("fixtureparam_7").value;
    params.resptodl20 = document.getElementById("fixtureparam_8").value;
    params.resptodl10 = document.getElementById("fixtureparam_9").value;
    params.resptodl0 = document.getElementById("fixtureparam_10").value;
    params.daylightceiling = document.getElementById("fixtureparam_11").value;
    params.daylightfloor = document.getElementById("fixtureparam_12").value;
    params.manualceiling = document.getElementById("fixtureparam_13").value;
    params.manualfloor = document.getElementById("fixtureparam_14").value;

    fixture.parameters = params;

    if(selectedfixtureindex > -1)
    {
        editConfigObject("edit", "fixture", fixture, selectedfixtureindex, function (retval) {
            document.getElementById("fixturename").value = "";  //blank it out.
            cachedconfig = retval;
            fixturetable.destroy();
            constructFixtureTable();
            updateAvalibleStartingOutputNumbers(true);
            selectedlevelinputindex = -1;
            selectedcontactinputindex = -1;
            selectedfixtureindex = -1;
        });
    }
    else {

        editConfigObject("create", "fixture", fixture, undefined, function (retval) {
            document.getElementById("fixturename").value = "";  //blank it out.
            cachedconfig = retval;
            fixturetable.destroy();
            constructFixtureTable();
            updateAvalibleStartingOutputNumbers(true);
            selectedlevelinputindex = -1;
            selectedcontactinputindex = -1;
            selectedfixtureindex = -1;
        });
    }

}


function deleteFixture()
{

    var index =  selectedfixtureindex; //Number(this.getAttribute('index'));
    // bug 201,  set the outputs of this fixture to 0,
    var element = {};
    element.requesttype = "override";
    element.name = cachedconfig.fixtures[index].assignedname;
    if(cachedconfig.fixtures[index].type == "on_off" || cachedconfig.fixtures[index].type == "dim")
        element.level = 0;
    else if(cachedconfig.fixtures[index].type == "cct")
    {
        element.brightness = 0;
        element.colortemp =  2200;
    }
    else if(cachedconfig.fixtures[index].type == "rgb")
    {
        element.red = 0;
        element.green = 0;
        element.blue = 0;
    }
    else if(cachedconfig.fixtures[index].type == "rgbw")
    {
        element.red = 0;
        element.green = 0;
        element.blue = 0;
        element.white = 0;
    }
    else if(cachedconfig.fixtures[index].type == "rgbwwcw")
    {
        element.red = 0;
        element.green = 0;
        element.blue = 0;
        element.warmwhite = 0;
        element.coldwhite = 0;
    }

    setFixtureLevel2(element, function (result) {

        var i = 0;  //cb stub

        editConfigObject("delete", "fixture", undefined, selectedfixtureindex, function (retval) {
            document.getElementById("fixturename").value = "";  //blank it out.
            cachedconfig = retval;
            fixturetable.destroy();
            constructFixtureTable();
            selectedlevelinputindex = -1;
            selectedcontactinputindex = -1;
            selectedfixtureindex = -1;
            updateAvalibleStartingOutputNumbers(true);
        });


    });

}


function saveImageToFixture()
{
    var bla =  $( "#iconpick" ).val();
    var modal = document.getElementById('myModal');
    modal.style.display = "none";
    saveNewFixture(bla+".jpg");
}

function closemodal()
{
    var modal = document.getElementById('myModal');
    modal.style.display = "none";
}


function setfixtureimage()
{
    if(selected_edit_fixture != undefined) {
        //  var bla =  $( "#iconpick" ).val();
        var base = selected_edit_fixture.image.lastIndexOf("/") + 1;
        var end = selected_edit_fixture.image.indexOf(".");
        var value = selected_edit_fixture.image.substring(base, end);

        $("#iconpick").val(value).change();
    }
    var modal = document.getElementById('myModal');
    modal.style.display = "block";
}

function cacheFixtureParamOptions(params)
{
    global_paramoptions = params;
    // buildParamOptionsTable();

    constructDimmingOptionsBox();
    constructOccVacOptionsBox();
    constructDaylightOptionsBox();
}


function constructDimmingOptionsBox()
{
    var holder = document.getElementById("dimmopts");

    var oTable = document.createElement("TABLE");
    var oTBody = document.createElement("TBODY");
    oTable.className = "table table-bordered";
    for (var paramnum = 0; paramnum < 3; paramnum++)
    {
        var oRow = document.createElement("TR");  // build row element
        oTBody.appendChild(oRow);

        var parameter = global_paramoptions.parameters[paramnum];
        var paramoptions = parameter.options;

        var oCell1 = document.createElement("TD");
        oCell1.innerHTML = parameter.name;
        oRow.appendChild(oCell1);

        var tempcell = document.createElement("TD");
        var globalselector = document.createElement("select");
        globalselector.id = "fixtureparam_" + paramnum;
        globalselector.name = "fixtureparam_" + paramnum;
        globalselector.className = "btn btn-large btn-primary";

        globalselector.setAttribute(ATTR_PARAM,paramnum);
        tempcell.appendChild(globalselector);
        oRow.appendChild(tempcell);
        setDropDownDataArray(globalselector,paramoptions);
    }


    // manual ceiling / floor,  last 2 params
    var index = global_paramoptions.parameters.length-2;
    var oRow = document.createElement("TR");  // build row element
    oTBody.appendChild(oRow);

    var parameter = global_paramoptions.parameters[index];
    var paramoptions = parameter.options;

    var oCell1 = document.createElement("TD");
    oCell1.innerHTML = parameter.name;
    oRow.appendChild(oCell1);

    var tempcell = document.createElement("TD");
    var globalselector = document.createElement("select");
    globalselector.id = "fixtureparam_" + index;
    globalselector.name = "fixtureparam_" + index;
    globalselector.className = "btn btn-large btn-primary";

    globalselector.setAttribute(ATTR_PARAM,index);
    tempcell.appendChild(globalselector);
    oRow.appendChild(tempcell);
    setDropDownDataArray(globalselector,paramoptions);



    index = global_paramoptions.parameters.length-1;
    var oRow = document.createElement("TR");  // build row element
    oTBody.appendChild(oRow);

    var parameter = global_paramoptions.parameters[index];
    var paramoptions = parameter.options;

    var oCell1 = document.createElement("TD");
    oCell1.innerHTML = parameter.name;
    oRow.appendChild(oCell1);

    var tempcell = document.createElement("TD");
    var globalselector = document.createElement("select");
    globalselector.id = "fixtureparam_" + index;
    globalselector.name = "fixtureparam_" + index;
    globalselector.className = "btn btn-large btn-primary";

    globalselector.setAttribute(ATTR_PARAM,index);
    tempcell.appendChild(globalselector);
    oRow.appendChild(tempcell);
    setDropDownDataArray(globalselector,paramoptions);




    oTable.appendChild(oTBody);
    holder.appendChild(oTable);

}


function constructOccVacOptionsBox()
{
    var holder = document.getElementById("occvacopts");

    var oTable = document.createElement("TABLE");
    var oTBody = document.createElement("TBODY");
    oTable.className = "table table-bordered";
    for (var paramnum = 3; paramnum < 5; paramnum++)
    {
        var oRow = document.createElement("TR");  // build row element
        oTBody.appendChild(oRow);

        var parameter = global_paramoptions.parameters[paramnum];
        var paramoptions = parameter.options;

        var oCell1 = document.createElement("TD");
        oCell1.innerHTML = parameter.name;
        oRow.appendChild(oCell1);

        var tempcell = document.createElement("TD");
        var globalselector = document.createElement("select");
        globalselector.id = "fixtureparam_" + paramnum;
        globalselector.name = "fixtureparam_" + paramnum;
        globalselector.className = "btn btn-large btn-primary";

        globalselector.setAttribute(ATTR_PARAM,paramnum);
        tempcell.appendChild(globalselector);
        oRow.appendChild(tempcell);
        setDropDownDataArray(globalselector,paramoptions);
    }

    oTable.appendChild(oTBody);
    holder.appendChild(oTable);

}



function constructDaylightOptionsBox()
{
    var holder = document.getElementById("daylightopts");
    var oTable = document.createElement("TABLE");
    var oTBody = document.createElement("TBODY");
    oTable.className = "table table-bordered";
    for (var paramnum = 5; paramnum < global_paramoptions.parameters.length-2; paramnum++)
    {
        var oRow = document.createElement("TR");  // build row element
        oTBody.appendChild(oRow);

        var parameter = global_paramoptions.parameters[paramnum];
        var paramoptions = parameter.options;

        var oCell1 = document.createElement("TD");
        oCell1.innerHTML = parameter.name;
        oRow.appendChild(oCell1);

        var tempcell = document.createElement("TD");
        var globalselector = document.createElement("select");
        globalselector.id = "fixtureparam_" + paramnum;
        globalselector.name = "fixtureparam_" + paramnum;
        globalselector.className = "btn btn-large btn-primary";

        globalselector.setAttribute(ATTR_PARAM,paramnum);
        tempcell.appendChild(globalselector);
        oRow.appendChild(tempcell);
        setDropDownDataArray(globalselector,paramoptions);


        paramnum++;
        if(paramnum < global_paramoptions.parameters.length) {

            var parameter3 = global_paramoptions.parameters[paramnum];
            var paramoptions3 = parameter3.options;

            var oCell1 = document.createElement("TD");
            oCell1.innerHTML = parameter3.name;
            oRow.appendChild(oCell1);

            var tempcell = document.createElement("TD");
            var globalselector = document.createElement("select");
            globalselector.id = "fixtureparam_" + paramnum;
            globalselector.name ="fixtureparam_" + paramnum;
            globalselector.className = "btn btn-large btn-primary";

            // globalselector.addEventListener("change", onZoneOptionChanged);
            globalselector.setAttribute(ATTR_PARAM, paramnum);
            tempcell.appendChild(globalselector);
            oRow.appendChild(tempcell);
            setDropDownDataArray(globalselector, paramoptions3);
        }
    }
    oTable.appendChild(oTBody);
    holder.appendChild(oTable);
}

function setDropDownDataArray(dropdown, elementarray)
{
    // clear all itesm ,
    while (dropdown.options.length > 0) {
        dropdown.remove(0);
    }

    for (var optidx = 0 ; optidx < elementarray.length; optidx ++) {
        var opt = document.createElement('option');
        opt.setAttribute('value', elementarray[optidx].value);
        opt.appendChild(document.createTextNode(elementarray[optidx].name));
        dropdown.appendChild(opt);
    }
}


function enableDisableInputActionDropDowns()
{
    var type = $('input[name=contacttype]:checked', '#wdcform').val();
    if(type == "momentary") {
        $("#inactive_action_sel_part1").val("action_none").change();
        $('#inactive_action_sel_part1').prop('disabled', true);

        on_inactive_part1_change();
    }
    else
        $('#inactive_action_sel_part1').prop('disabled', false);

}



function cacheAndProcessSceneNames(namelist)
{
    loadedscenenames = namelist;
    loadedscenenames.splice(0,1); //remove the "----" item.
}


function updateAvalibleStartingOutputNumbers(filter)
{
    var type = document.getElementById("fixturetype");
    var seltype = type.options[type.selectedIndex].value;
    if(seltype == "cct") {
        showCCTOptions(true);   //document.getElementById("candledim").disabled = false;

        document.getElementById("minctemp").value = "2000";
        document.getElementById("maxctemp").value = "6500";

    }
    else {
        showCCTOptions(false);
        // document.getElementById("candledim").checked = false;
        //  document.getElementById("candledim").disabled = true;
    }

    if((seltype == "rgbw" || seltype == "cct" || seltype == "rgb" || seltype == "rgbwwcw") && !rpdg_highvoltage) {
        showCommonAnodeOption(true);
        document.getElementById("commonanode").value = false;
    }
    else {
        showCommonAnodeOption(false);
    }

    var sel = document.getElementById('starting_output');
    // clear all itesm ,
    while (sel.options.length > 0) {
        sel.remove(0);
    }

    var iface = $('#interface').val();
    show12VoltOption(false);
    if(iface == "rpdg-pwm")
    {
        show12VoltOption(true);
        for (var i = 0 ; i < cachedinterfaceio.rpdg.pwmoutputs.length; i += 1) {
            var opt = document.createElement('option');
            opt.setAttribute('value', cachedinterfaceio.rpdg.pwmoutputs[i]);
            opt.appendChild(document.createTextNode(cachedinterfaceio.rpdg.pwmoutputs[i]));
            sel.appendChild(opt);
        }
        $("#fixturetype").prop("disabled",false);
    }
    else if(iface == "rpdg-plc")
    {
        for (var i = 0 ; i < cachedinterfaceio.rpdg.plcoutputs.length; i += 1) {
            var opt = document.createElement('option');
            opt.setAttribute('value', cachedinterfaceio.rpdg.plcoutputs[i]);
            opt.appendChild(document.createTextNode(cachedinterfaceio.rpdg.plcoutputs[i]));
            sel.appendChild(opt);
        }


        // make sure to set the type to on/off,
        $("#fixturetype").val("on_off");
        $("#fixturetype").prop("disabled",true);

    }
    else
    {
        var ids = getAvailibleEnoceanOutputIDArray(false);
        populateDropDown("starting_output", ids);

        /*  for (var i = 0 ; i < cachedinterfaceio.enocean.outputs.length; i += 1) {
         var opt = document.createElement('option');
         opt.setAttribute('value', cachedinterfaceio.enocean.outputs[i]);
         opt.appendChild(document.createTextNode(cachedinterfaceio.enocean.outputs[i]));
         sel.appendChild(opt);
         }
         */
        $("#fixturetype").prop("disabled",false);
    }
}



function getAvailibleEnoceanOutputIDArray(filter)
{
    var ids = [];
    for (var i = 0 ; i < cachedinterfaceio.enocean.outputs.length; i += 1) {

        var include = true;
        var outid = cachedinterfaceio.enocean.outputs[i];
        if(filter) {
            for (j = 0; j < cachedconfig.fixtures.length; j++) {
                var fixoutputid = cachedconfig.fixtures[j].outputid;
                if (fixoutputid == outid) {
                    include = false;
                    break;  // used, so skip it,
                }
            }
        }

        if(include)
            ids.push(outid);
    }
    return ids;
}

// ********************************************************************************************************************
// **********************************************CONTACT INPUTS *******************************************************
// ********************************************************************************************************************


//6/21/17
function transformContactInputsToDataSet()
{
    var datasetobj = {};
    var datasetarray = [];
    for(var i = 0;i < cachedconfig.contactinputs.length; i++)
    {
        var fixobj = cachedconfig.contactinputs[i];
        datasetarray.push(fixobj);
    }
    datasetobj = datasetarray;
    return datasetobj;


    // maybe
   // wetdrycontactlist[i].inactive_action.replace(/_@@_/g,"/");
}



function constructContactInputsTable()
{
    var dataset = transformContactInputsToDataSet();
    wetdrycontacttable = $('#wetdrycontacttable').DataTable( {
        "aaData": dataset,
        /*  "dom": '<"top"i>rt<"bottom"flp><"clear">',  */
        "pageLength": 5,
        select: true,
        "bLengthChange": false,
        "bInfo": false,
        "aoColumns": [
            { "mData": 'assignedname'},
            { "mData": 'interface'},
            { "mData": 'inputid'},
            { "mData": 'type', "bSortable": false},
            { "mData": 'active_action', "bSortable": false },
            { "mData": 'inactive_action', "bSortable": false }
        ]
    } );
}
 // end new table bug 292

function saveNewContactInputObj() {

    var objname = document.getElementById("contactname").value.trim();
    var j = validate({name: objname}, constraints);
    if(j != undefined && j.name != undefined && j.name.length > 0)
    {
        $.Notification.notify('error','top left', 'Contact Save Error',j.name[0]);
        return;
    }

    //6/9/17, dup name check, new item only
    //if(selectedcontactinputindex == -1) {
        for (j = 0; j < cachedconfig.contactinputs.length; j++) {
            var name = cachedconfig.contactinputs[j].assignedname;
            if (name == objname && selectedcontactinputindex != j) {
                $.Notification.notify('error', 'top left', 'Contact Save Error', "Duplicate Name");
                return;
            }
        }
   // }




    var contactinput = {};
    contactinput.assignedname = document.getElementById("contactname").value;
    contactinput.interface = $("#contactinputinterface").val();

    var inputnum = document.getElementById("contact_inputnum");
    var selinputnum = inputnum.options[inputnum.selectedIndex].value;
    contactinput.inputid = selinputnum;



    var myRadio = $('input[name=contacttype]');
    var type = myRadio.filter(':checked').val();
    contactinput.type = type;

    var active_action = "";

    var aa_p1 = $('#active_action_sel_part1').val();
    var aa_p2 = $('#active_action_sel_part2').val();
    var aa_p3 = $('#active_action_sel_part3').val();
    var aa_p4 = $('#active_action_sel_part4').val();
    // if(aa_p2 != "Vacancy")
    //   aa_p4 = "0";

    switch(aa_p1)
    {
        case "action_none":
            active_action = "action_none";
            break;
        case "action_message":
            if(aa_p2 != "Vacancy")
                aa_p4 = "0";
            active_action += "msg_@@_"+ aa_p2 + "_@@_"+aa_p3 + "_@@_"+aa_p4;
            break;
        case "action_scene":
            active_action += "scene_@@_"+ aa_p2;
            break;
        case "action_scene_list":
            active_action += "scenelist_@@_"+ aa_p2 + "_@@_"+ aa_p3 + "_@@_"+aa_p4;
            break;

        case "action_script":
            active_action += "script_@@_"+ aa_p2;
            break;

        default:
            break;
    }

    contactinput.active_action = active_action;

    if(type == "maintained")
    {
        var inactive_action = "";
        var ina_p1 = $('#inactive_action_sel_part1').val();
        var ina_p2 = $('#inactive_action_sel_part2').val();
        var ina_p3 = $('#inactive_action_sel_part3').val();
        var ina_p4 = $('#inactive_action_sel_part4').val();
        // if(ina_p2 != "Vacancy")
        //     ina_p4 = "0";

        switch(ina_p1)
        {
            case "action_none":
                inactive_action = "action_none";
                break;

            case "action_message":
                if(ina_p2 != "Vacancy")
                    ina_p4 = "0";

                inactive_action += "msg_@@_"+ ina_p2 + "_@@_"+ina_p3 + "_@@_"+ina_p4;
                break;
            case "action_scene":
                inactive_action += "scene_@@_"+ ina_p2;
                break;
            case "action_scene_list":
                inactive_action += "scenelist_@@_"+ ina_p2 + "_@@_"+ina_p3 + "_@@_"+ina_p4;
                break;
            case "action_script":
                inactive_action += "script_@@_"+ ina_p2;
                break;
            default:
                break;
        }

        contactinput.inactive_action = inactive_action;
    }
    else
        contactinput.inactive_action = "action_none";


    if(selectedcontactinputindex > -1)
    {
        editConfigObject("edit", "contactinput", contactinput, selectedcontactinputindex, function (retval) {
            document.getElementById("contactname").value = "";
            cachedconfig = retval;

            wetdrycontacttable.destroy();
            constructContactInputsTable();
            selectedlevelinputindex = -1;
            selectedcontactinputindex = -1;
            selectedfixtureindex = -1;
        });
    }
    else {

        editConfigObject("create", "contactinput", contactinput, undefined, function (retval) {
            document.getElementById("contactname").value = "";
            cachedconfig = retval;

            wetdrycontacttable.destroy();
            constructContactInputsTable();
            selectedlevelinputindex = -1;
            selectedcontactinputindex = -1;
            selectedfixtureindex = -1;
        });
    }

}

function deleteInputContactItem()
{
    if(selectedcontactinputindex > -1) {
        editConfigObject("delete", "contactinput", undefined, selectedcontactinputindex, function (retval) {
            document.getElementById("contactname").value = "";  //blank it out.
            cachedconfig = retval;
            wetdrycontacttable.destroy();
            constructContactInputsTable();

            selectedlevelinputindex = -1;
            selectedcontactinputindex = -1;
            selectedfixtureindex = -1;
        });
    }
}


function updateContactInputs_InputSel()
{
    // clear all itesm ,
    var sel = document.getElementById('contact_inputnum');
    while (sel.options.length > 0) {
        sel.remove(0);
    }

    var iface = $('#contactinputinterface').val();
    if(iface == "rpdg")
    {
        for (var i = 0 ; i < cachedinterfaceio.rpdg.contactinputs.length; i += 1) {
            var opt = document.createElement('option');
            opt.setAttribute('value', cachedinterfaceio.rpdg.contactinputs[i]);
            opt.appendChild(document.createTextNode(cachedinterfaceio.rpdg.contactinputs[i]));
            sel.appendChild(opt);
        }
    }
    else
    {
        for (var i = 0 ; i < cachedinterfaceio.enocean.contactinputs.length; i += 1) {
            var opt = document.createElement('option');
            opt.setAttribute('value', cachedinterfaceio.enocean.contactinputs[i]);
            opt.appendChild(document.createTextNode(cachedinterfaceio.enocean.contactinputs[i]));
            sel.appendChild(opt);
        }
    }

}


// LEVEL INPUTS ***************************************************************************************
// *****************************************************************************************************



//6/21/17
function transformLevelInputsToDataSet()
{
    var datasetobj = {};
    var datasetarray = [];
    for(var i = 0;i < cachedconfig.levelinputs.length; i++)
    {
        var fixobj = cachedconfig.levelinputs[i];
        datasetarray.push(fixobj);
    }
    datasetobj = datasetarray;
    return datasetobj;
}



function constructLevelInputsTable()
{
    var dataset = transformLevelInputsToDataSet();
    levelinputstable = $('#levelinputstable').DataTable( {
        "aaData": dataset,
        /*  "dom": '<"top"i>rt<"bottom"flp><"clear">',  */
        "pageLength": 5,
        select: true,
        "bLengthChange": false,
        "bInfo": false,
        "aoColumns": [
            { "mData": 'assignedname'},
            { "mData": 'interface'},
            { "mData": 'inputid'},
            { "mData": 'type', "bSortable": false},
            { "mData": 'drivelevel', "bSortable": false },
            { "mData": 'group', "bSortable": false }
        ]
    } );
}






function updateLevelInputs_InputSel()
{
    // clear all itesm ,
    var sel = document.getElementById('levelinput_inputs');
    while (sel.options.length > 0) {
        sel.remove(0);
    }

    var iface = $('#levelinputinterface').val();
    if(iface == "rpdg")
    {
        for (var i = 0 ; i < cachedinterfaceio.rpdg.levelinputs.length; i += 1) {
            var opt = document.createElement('option');
            opt.setAttribute('value', cachedinterfaceio.rpdg.levelinputs[i]);
            opt.appendChild(document.createTextNode(cachedinterfaceio.rpdg.levelinputs[i]));
            sel.appendChild(opt);
        }
    }
    else
    {
        for (var i = 0 ; i < cachedinterfaceio.enocean.levelinputs.length; i += 1) {
            var opt = document.createElement('option');
            opt.setAttribute('value', cachedinterfaceio.enocean.levelinputs[i]);
            opt.appendChild(document.createTextNode(cachedinterfaceio.enocean.levelinputs[i]));
            sel.appendChild(opt);
        }
    }

}



function saveNewLevelInput() {

    var objname = document.getElementById("levelinputname").value.trim();
    var j = validate({name: objname}, constraints);
    if(j != undefined && j.name != undefined && j.name.length > 0)
    {
        $.Notification.notify('error','top left', 'Level Input Save Error',j.name[0]);
        return;
    }

    //6/9/17, dup name check, new item only
   // if(selectedlevelinputindex == -1) {
        for (j = 0; j < cachedconfig.levelinputs.length; j++) {
            var name = cachedconfig.levelinputs[j].assignedname;
            if (name == objname && selectedlevelinputindex != j) {
                $.Notification.notify('error', 'top left', 'Level Input Save Error', "Duplicate Name");
                return;
            }
        }
  //  }




    var levelinput = {};
    levelinput.assignedname = document.getElementById("levelinputname").value;
    levelinput.inputid = $("#levelinput_inputs").val();;
    levelinput.type = $("#levelinputtype").val();
    levelinput.interface = $("#levelinputinterface").val();
    if(levelinput.type == "dimmer")
        levelinput.drivelevel = "0";
    else
        levelinput.drivelevel = $("#levelinput_drive").val();

    levelinput.group = $("#groupassignment").val();


    if(selectedlevelinputindex > -1)
    {
        editConfigObject("edit", "levelinput", levelinput, selectedlevelinputindex, function (retval) {
            document.getElementById("levelinputname").value = "";  //blank it out.
            cachedconfig = retval;
            levelinputstable.destroy();
            constructLevelInputsTable();

            selectedlevelinputindex = -1;
            selectedcontactinputindex = -1;
            selectedfixtureindex = -1;
        });
    }
    else {

        editConfigObject("create", "levelinput", levelinput, undefined, function (retval) {
            document.getElementById("levelinputname").value = "";
            cachedconfig = retval;
            levelinputstable.destroy();
            constructLevelInputsTable();

            selectedlevelinputindex = -1;
            selectedcontactinputindex = -1;
            selectedfixtureindex = -1;
        });
    }



}


function deleteLevelInput()
{
    if(selectedlevelinputindex > -1) {
        editConfigObject("delete", "levelinput", undefined, selectedlevelinputindex, function (retval) {
            document.getElementById("levelinputname").value = "";  //blank it out.
            cachedconfig = retval;
            levelinputstable.destroy();
            constructLevelInputsTable();

            selectedlevelinputindex = -1;
            selectedcontactinputindex = -1;
            selectedfixtureindex = -1;
        });
    }
}






function constructPWMOutputToggleTable() {

    var oTable = document.getElementById("pwmoutputtoggletable");
    oTable.innerHTML = ""; //blank out table,

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3, oCell4,
        oCell5,oCell6,oCell7,oCell8, i,j;

    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Output";
    oCell2 = document.createElement("TD");
    oCell2.innerHTML = "Enable Blink";
    oCell3 = document.createElement("TD");
    oCell3.innerHTML = "Output State";

    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oRow.appendChild(oCell3);

    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);

    oTable.appendChild(oTHead);
    oTable.appendChild(oTColGrp);
    oTable.appendChild(oTBody);

    // Insert rows and cells into bodies.
    for (i=1; i< 9; i++)   {
        var oBody = oTBody;
        oRow = document.createElement("TR");
        oBody.appendChild(oRow);
        var col1part = document.createElement("TD");
        col1part.innerHTML = i;

        var col2part = document.createElement("TD");
        var enable = document.createElement("input");
        enable.type = "checkbox";
        enable.id = "pwm_toggle_enable"+i;
        col2part.appendChild(enable);

        var col3part = document.createElement("TD");
        var statelabel = document.createElement("label");
        statelabel.id = "pwm_toggle_state"+i;
        statelabel.innerHTML = "----";
        col3part.appendChild(statelabel);
        oRow.appendChild(col1part);
        oRow.appendChild(col2part);
        oRow.appendChild(col3part);
    }

    $("#tableOutput").html(oTable);

    pwmoutputtoggletablediv.appendChild(oTable);
}




function constructPLCOutputToggleTable() {

    var oTable = document.getElementById("plcoutputtoggletable");
    oTable.innerHTML = ""; //blank out table,

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3, oCell4,
        oCell5,oCell6,oCell7,oCell8, i,j;

    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Output";
    oCell2 = document.createElement("TD");
    oCell2.innerHTML = "Enable Blink";
    oCell3 = document.createElement("TD");
    oCell3.innerHTML = "Output State";

    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oRow.appendChild(oCell3);
    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);

    oTable.appendChild(oTHead);
    oTable.appendChild(oTColGrp);
    oTable.appendChild(oTBody);

    // Insert rows and cells into bodies.
    for (i=1; i< 5; i++)   {
        var oBody = oTBody;
        oRow = document.createElement("TR");
        oBody.appendChild(oRow);
        var col1part = document.createElement("TD");
        col1part.innerHTML = i;

        var col2part = document.createElement("TD");
        var enable = document.createElement("input");
        enable.type = "checkbox";
        enable.id = "plc_toggle_enable"+i;
        col2part.appendChild(enable);
        var col3part = document.createElement("TD");
        var statelabel = document.createElement("label");
        statelabel.id = "plc_toggle_state"+i;
        statelabel.innerHTML = "----";
        col3part.appendChild(statelabel);
        oRow.appendChild(col1part);
        oRow.appendChild(col2part);
        oRow.appendChild(col3part);
    }

    $("#tableOutput").html(oTable);

    plcoutputtoggletablediv.appendChild(oTable);
}


var pwm_output_state_map = [0,0,0,0,0,0,0,0];
var plc_output_state_map = [0,0,0,0];

// *  timer for output toggle test ,
setInterval(function () {

    var outputs = {};
    var pwm = [];
    var sendmessage = false;
    for(var i = 1; i < 9; i++)
    {
        var checkbox = document.getElementById("pwm_toggle_enable"+i);
        var labelval = "----";
        if(checkbox.checked)
        {
            sendmessage = true;
            var element = {};
            element.number = i;
            var state = pwm_output_state_map[i-1];
            if(state == 0)
            {
                pwm_output_state_map[i-1] = 1;
                element.level = 75;
                labelval = "ON"
            }
            else {
                pwm_output_state_map[i - 1] = 0;
                element.level = 0;
                labelval= "OFF"
            }
            pwm.push(element);
        }
        var statectrl = document.getElementById("pwm_toggle_state"+i);
        statectrl.innerHTML = labelval;
    }

    var plc = [];
    for(var i = 1; i < 5; i++)
    {
        var checkbox = document.getElementById("plc_toggle_enable"+i);
        var labelval = "----";
        if(checkbox.checked)
        {
            sendmessage = true;
            var element = {};
            element.number = i;
            var state = plc_output_state_map[i-1];
            if(state == 0)
            {
                plc_output_state_map[i-1] = 1;
                element.level = 75;
                labelval = "ON"
            }
            else {
                plc_output_state_map[i - 1] = 0;
                element.level = 0;
                labelval= "OFF"
            }
            plc.push(element);
        }
        var statectrl = document.getElementById("plc_toggle_state"+i);
        statectrl.innerHTML = labelval;
    }

    outputs.pwm = pwm;
    outputs.plc = plc
    if(sendmessage) {
        setRPDGOutputs(outputs, function (retval) {
            if (retval != undefined && retval.version != undefined)  // as of 1/24/17, added version.
            {
                // loadedconfig = retval;// for now ignore returned confg
            }
            else if (retval.error != undefined)
                $.Notification.notify('error','top left', 'Config Save Error',retval.error);
            // noty({text: 'Error saving config ' + retval.error, type: 'error', timeout:750});
        });
    }

}, 1000);



function updateInputContactActionDropDowns(inputcontactobj) {

    if(inputcontactobj == undefined)
        return;

    if(inputcontactobj.active_action != undefined) {
        var aa = inputcontactobj.active_action;
        if (aa.includes("_@@_")) {
            var parts = aa.split("_@@_");

            switch (parts[0]) {

                case "msg":
                    $('#active_action_sel_part1').val("action_message");
                    on_aa_part1_change();

                    if(parts.length == 4) {
                        $('#active_action_sel_part2').val(parts[1]);
                        $('#active_action_sel_part3').val(parts[2]);
                        $('#active_action_sel_part4').val(parts[3]);
                    }
                    on_aa_part2_change();
                    break;

                case "scene":

                    $('#active_action_sel_part1').val("action_scene");
                    on_aa_part1_change();

                    if(parts.length == 2) {
                        $('#active_action_sel_part2').val(parts[1]);
                    }
                    on_aa_part2_change();
                    break;

                case "scenelist":

                    $('#active_action_sel_part1').val("action_scene_list");
                    on_aa_part1_change();

                    if(parts.length == 4) {
                        $('#active_action_sel_part2').val(parts[1]);
                        $('#active_action_sel_part3').val(parts[2]);
                        $('#active_action_sel_part4').val(parts[3]);
                    }
                    on_aa_part2_change();



                    break;

                case "script":

                    $('#active_action_sel_part1').val("action_script");
                    on_aa_part1_change();

                    if(parts.length == 2) {
                        $('#active_action_sel_part2').val(parts[1]);
                    }
                    on_aa_part2_change();
                    break;

                default:
                    break;

            }

        }
        else
        {
            $('#active_action_sel_part1').val("action_none");
            $('#active_action_sel_part2').val("N/A");
            on_aa_part1_change();
           // on_inactive_part1_change();
           // on_aa_part2_change();
          //  on_ina_part2_change();
        }
    }

    if(inputcontactobj.inactive_action != undefined) {
        var aa = inputcontactobj.inactive_action;
        if (aa.includes("_@@_")) {
            var parts = aa.split("_@@_");

            switch (parts[0]) {

                case "msg":
                    $('#inactive_action_sel_part1').val("action_message");
                    on_inactive_part1_change();

                    if(parts.length == 4) {
                        $('#inactive_action_sel_part2').val(parts[1]);
                        $('#inactive_action_sel_part3').val(parts[2]);
                        $('#inactive_action_sel_part4').val(parts[3]);
                    }
                    on_ina_part2_change();
                    break;

                case "scene":

                    $('#inactive_action_sel_part1').val("action_scene");
                    on_inactive_part1_change();

                    if(parts.length == 2) {
                        $('#inactive_action_sel_part2').val(parts[1]);
                    }
                    on_ina_part2_change();
                    break;

                case "scenelist":

                    $('#inactive_action_sel_part1').val("action_scene_list");
                    on_inactive_part1_change();

                    if(parts.length == 4) {
                        $('#inactive_action_sel_part2').val(parts[1]);
                        $('#inactive_action_sel_part3').val(parts[2]);
                        $('#inactive_action_sel_part4').val(parts[3]);
                    }
                    on_ina_part2_change();
                    break;

                case "script":

                    $('#inactive_action_sel_part1').val("action_script");
                    on_inactive_part1_change();

                    if(parts.length == 2) {
                        $('#inactive_action_sel_part2').val(parts[1]);
                    }
                    on_ina_part2_change();
                    break;
                default:
                    break;

            }

        }
        else
        {
            $('#inactive_action_sel_part1').val("action_none");
            $('#inactive_action_sel_part2').val("N/A");
            on_inactive_part1_change();
        }
    }


}


function getGroupNameList()
{
    var names = [];
    for(var i = 0; i < cachedconfig.groups.length; i++)
    {
        names.push(cachedconfig.groups[i].name);
    }
    return names;
}



function getSceneNameList2()
{
    var names = [];

    names.push("ALL_OFF");
    names.push("ALL_15");
    names.push("ALL_30");
    names.push("ALL_50");
    names.push("ALL_70");
    names.push("ALL_ON");

    for(var i = 0; i < cachedconfig.scenes.length; i++)
    {
        names.push(cachedconfig.scenes[i].name);
    }
    return names;
}


function getSceneListsNames()
{
    var names = [];
    for(var i = 0; i < cachedconfig.scenelists.length; i++)
    {
        names.push(cachedconfig.scenelists[i].name);
    }
    return names;
}


function getGroupNames()
{
    var names = [];
    for(var i = 0; i < cachedconfig.groups.length; i++)
    {
        names.push(cachedconfig.groups[i].name);
    }
    return names;
}


function on_aa_part1_change()
{
    var aa_p1 = $('#active_action_sel_part1').val();

    switch(aa_p1)
    {
        case "action_none":
            $('#aa_part2').hide();
            $('#aa_part3').hide();
            $('#aa_part4').hide();
            break;

        case "action_message":
            $('#active_action_label_part_2').text("Message");
            populateDropDown("active_action_sel_part2", ["Occupancy","Vacancy"]);

            $('#active_action_label_part_3').text("Group");
            populateDropDown("active_action_sel_part3", getGroupNameList());


            $('#active_action_label_part_4').text("Delay(min)");
            populateDropDown("active_action_sel_part4", ["0","1","5","10","15","20","30","60"]);

            $('#aa_part2').show();
            $('#aa_part3').show();
            $('#aa_part4').show();
            break;
        case "action_scene":
            $('#active_action_label_part_2').text("Scene");
            populateDropDown("active_action_sel_part2", getSceneNameList2());

            $('#aa_part2').show();
            $('#aa_part3').hide();
            $('#aa_part4').hide();

            break;
        case "action_scene_list":
            $('#active_action_label_part_2').text("Scene List");
            populateDropDown("active_action_sel_part2", getSceneListsNames());

            $('#active_action_label_part_3').text("Direction");
            populateDropDown("active_action_sel_part3", ["up","down"]);


            $('#active_action_label_part_4').text("Rollover");
            populateDropDown("active_action_sel_part4", ["yes","no"]);

            $('#aa_part2').show();
            $('#aa_part3').show();
            $('#aa_part4').show();
            break;

        case "action_script":
            $('#active_action_label_part_2').text("Script");
            populateDropDown("active_action_sel_part2", scriptnames);
            $('#aa_part2').show();
            $('#aa_part3').hide();
            $('#aa_part4').hide();
            break;
        default:
            break;
    }


    on_aa_part2_change();

}



function on_inactive_part1_change()
{
    var aa_p1 = $('#inactive_action_sel_part1').val();

    switch(aa_p1)
    {
        case "action_none":
            $('#ina_part2').hide();
            $('#ina_part3').hide();
            break;

        case "action_message":
            $('#inactive_action_label_part_2').text("Message");
            populateDropDown("inactive_action_sel_part2", ["Occupancy","Vacancy"]);

            $('#inactive_action_label_part_3').text("Group");
            populateDropDown("inactive_action_sel_part3", getGroupNameList());

            $('#inactive_action_label_part_4').text("Delay(min)");
            populateDropDown("inactive_action_sel_part4", ["0","1","5","10","15","20","30","60"]);

            $('#ina_part2').show();
            $('#ina_part3').show();
            $('#ina_part4').show();
            break;
        case "action_scene":
            $('#inactive_action_label_part_2').text("Scene");
            populateDropDown("inactive_action_sel_part2", getSceneNameList2());


            $('#ina_part2').show();
            $('#ina_part3').hide();

            break;
        case "action_scene_list":
            $('#inactive_action_label_part_2').text("Scene List");
            populateDropDown("inactive_action_sel_part2", getSceneListsNames());

            $('#inactive_action_label_part_3').text("Direction");
            populateDropDown("inactive_action_sel_part3", ["up","down"]);

            $('#inactive_action_label_part_4').text("Rollover");
            populateDropDown("inactive_action_sel_part4", ["yes","no"]);


            $('#ina_part2').show();
            $('#ina_part3').show();
            $('#ina_part4').show();

            break;

        case "action_script":

            $('#inactive_action_label_part_2').text("Script");
            populateDropDown("inactive_action_sel_part2", scriptnames);
            $('#ina_part2').show();
            $('#ina_part3').hide();
            $('#ina_part4').hide();

            break;
        default:
            break;
    }

    on_ina_part2_change();
}





function on_aa_part2_change()
{
    var aa_p1 = $('#active_action_sel_part1').val();
    var aa_p2 = $('#active_action_sel_part2').val();

    if(aa_p2 == "Vacancy" || aa_p1 == "action_scene_list") {
        $('#aa_part4').show();
    }
    else {
        $('#aa_part4').hide();
    }
}


function on_ina_part2_change()
{
    var aa_p2 = $('#inactive_action_sel_part2').val();
    var aa_p1 = $('#inactive_action_sel_part1').val();

    if(aa_p2 == "Vacancy" || aa_p1 == "action_scene_list") {
        $('#ina_part4').show();
    }
    else {
        $('#ina_part4').hide();
    }
}


function initImagePickerModal()
{
    var sel = document.getElementById("iconpick");

    for (var i = 1; i <= fixtureimgcount; i += 1) {
        var opt = document.createElement('option');
        opt.setAttribute('value', i);
        opt.setAttribute('data-img-src', "fixtureimg/"+i+".jpg");
        opt.appendChild(document.createTextNode(i));
        sel.appendChild(opt);
    }
}





function populateDropDown(dropdown, optionslist)
{
    var sel = document.getElementById(dropdown);

    if(sel == undefined)
        return;

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


function showCommonAnodeOption(show)
{
    if(show)
        $('#fixopts1_8').show();
    else
        $('#fixopts1_8').hide();
}


function onLevelInputTypeChanged()
{

    var ltype = $('#levelinputtype').val();
    if(ltype == "daylight")
    {
        showActiveDriveLevel(true);
    }
    else
        showActiveDriveLevel(false);
}


function showActiveDriveLevel(show)
{
    if(show)
        $('#active_drive').show();
    else
        $('#active_drive').hide();
}


function show12VoltOption(show)
{
    if(show)
        $('#fixopts1_9').show();
    else
        $('#fixopts1_9').hide();
}


function showCCTOptions(show)
{
    if(show) {
        $('#fixopts1_5').show();
        $('#fixopts1_6').show();
        $('#fixopts1_7').show();

    }
    else {
        $('#fixopts1_5').hide();
        $('#fixopts1_6').hide();
        $('#fixopts1_7').hide();
    }
}


function saveSiteInfo()
{
    var element = {};
    element.zip = document.getElementById("sitezip").value;
    element.latt = document.getElementById("sitelatt").value;
    element.long = document.getElementById("sitelong").value;

    saveConfigObject("siteinfo",element,function (retval) {
        cachedconfig = retval;

    });
}


function gpsLookup()
{
    var element = {};
    element.zip = document.getElementById("sitezip").value;
    getGPSCordFromZipcode(element, function(data) {

        if(data != undefined && data.location != undefined && data.location.length == 3)
        {
            document.getElementById("sitelatt").value = data.location[1];
            document.getElementById("sitelong").value = data.location[2];
        }
    });
}

function outputAvalibleCheck(inputlist, desiredstartoutput, type, name, interface)
{
    // filter out any already used outputs.   based on this fixtures interface /
    for(var i = 0; i < cachedconfig.fixtures.length; i++)
    {
        var fixobj = cachedconfig.fixtures[i];

        if(fixobj.interfacename == interface) { // } && (fixobj.outputid != desiredstartoutput || newitem)) {

            // skip the fixture that is being edited,  (don't count it),
            if(selectedfixtureindex > -1 && i == selectedfixtureindex)
            {
                continue;
            }

            var outstart = Number(fixobj.outputid);
            if (fixobj.type == "on_off" || fixobj.type == "dim") {
                var idx = inputlist.indexOf(String(outstart));
                if (idx > -1) {
                    inputlist.splice(idx, 1);
                }
            }
            if (fixobj.type == "cct") {
                var idx = inputlist.indexOf(String(outstart));
                if (idx > -1) {
                    inputlist.splice(idx, 1);
                    inputlist.splice(idx, 1);  // do it 2 times,  to remove both channels,
                }
            }
            if (fixobj.type == "rgb") {
                var idx = inputlist.indexOf(String(outstart));
                if (idx > -1) {
                    inputlist.splice(idx, 1);
                    inputlist.splice(idx, 1);  // do it X times,
                    inputlist.splice(idx, 1);
                }
            }
            if (fixobj.type == "rgbw") {
                var idx = inputlist.indexOf(String(outstart));
                if (idx > -1) {
                    inputlist.splice(idx, 1);
                    inputlist.splice(idx, 1);  // do it X times,
                    inputlist.splice(idx, 1);
                    inputlist.splice(idx, 1);
                }
            }
            if (fixobj.type == "rgbwwcw") {
                var idx = inputlist.indexOf(String(outstart));
                if (idx > -1) {
                    inputlist.splice(idx, 1);
                    inputlist.splice(idx, 1);  // do it X times,
                    inputlist.splice(idx, 1);
                    inputlist.splice(idx, 1);
                    inputlist.splice(idx, 1);
                }
            }

        }
    }



    // filter based on edit type,
    if(type == "cct")
    {
        var ctemp = inputlist.indexOf(String(desiredstartoutput));
        if(ctemp < 0)
            return false;


        var bright = inputlist.indexOf(String(Number(desiredstartoutput)+1));
        if(bright < 0)
            return false;

    }
    else if(type == "rgb")
    {
        var red = inputlist.indexOf(String(desiredstartoutput));
        if(red < 0)
            return false;

        var green = inputlist.indexOf(String(Number(desiredstartoutput)+1));
        if(green < 0)
            return false;

        var blue = inputlist.indexOf(String(Number(desiredstartoutput)+2));
        if(blue < 0)
            return false;
    }
    else if(type == "rgbw")
    {
        var red = inputlist.indexOf(String(desiredstartoutput));
        if(red < 0)
            return false;

        var green = inputlist.indexOf(String(Number(desiredstartoutput)+1));
        if(green < 0)
            return false;

        var blue = inputlist.indexOf(String(Number(desiredstartoutput)+2));
        if(blue < 0)
            return false;

        var white = inputlist.indexOf(String(Number(desiredstartoutput)+3));
        if(white < 0)
            return false;
    }
    else if(type == "rgbwwcw")
    {
        var red = inputlist.indexOf(String(desiredstartoutput));
        if(red < 0)
            return false;

        var green = inputlist.indexOf(String(Number(desiredstartoutput)+1));
        if(green < 0)
            return false;

        var blue = inputlist.indexOf(String(Number(desiredstartoutput)+2));
        if(blue < 0)
            return false;

        var warmwhite = inputlist.indexOf(String(Number(desiredstartoutput)+3));
        if(warmwhite < 0)
            return false;

        var coldwhite = inputlist.indexOf(String(Number(desiredstartoutput)+4));
        if(coldwhite < 0)
            return false;
    }
    else {
        var out = inputlist.indexOf(String(desiredstartoutput));
        if(out < 0)
            return false;
    }

    return true;
}



//6/7/17
function SetDaylightPolling()
{
    var selection = $('#daylightpoll').val();
    var element = {};
    element.interval = selection;
    SetDaylightPollingCRUD(element, function(data) {
        // ignore return .
        cachedconfig = data;
    })
}


/*
function SetBoardVoltage()
{
    var selection = $('#boardvoltage').val();
    var element = {};
    element.boardvoltage = selection;
    SetBoardVoltageCRUD(element, function(data) {
        // ignore return .
        cachedconfig = data;
    })
}
*/


function ValidateIPaddress(ipaddress) {
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
        return (true)
    }

   // alert("You have entered an invalid IP address!")
    return (false)
}

function saveGeneralSettings()
{
    var name = $('#nodename').val();
    var hotspotenable = $('#btwifienable').prop('checked');
    var voltage = $('#boardvoltage').val();
    var nodeip = $('#nodeip').val();
    var routerip = $('#routerip').val();

    // validate...

    if(nodeip.length > 0) {
        var ipvalid = ValidateIPaddress(nodeip);
        if (!ipvalid) {
            $.Notification.notify('error', 'top left', 'Node IP Format Error', "Please refresh and submit again");
            return;
        }
    }

    if(routerip.length > 0) {
        var ipvalid = ValidateIPaddress(routerip);
        if (!ipvalid) {
            $.Notification.notify('error', 'top left', 'Router IP Format Error', "Please refresh and submit again");
            return;
        }
    }


    var j = validate({name: name}, constraints);
    if(j != undefined && j.name != undefined && j.name.length > 0)
    {
        $.Notification.notify('error','top left', 'Node Name Save Error', j.name[0]);
        return;
    }

    // dkfjdf

    var element = {};
    element.nodename = name;

    element.boardvoltage = voltage;
    element.hotspotenable = hotspotenable;
    element.nodeip = nodeip;
    element.routerip = routerip;

    SaveGeneralSettingsCRUD(element, function(data) {
        cachedconfig = data;

        var enabled = cachedconfig.generalsettings.hotspotenable;
        if(enabled)
            $('#btwifienable').bootstrapToggle('on');
        else
            $('#btwifienable').bootstrapToggle('off');


        $('#nodename').val(cachedconfig.generalsettings.nodename);
        $('#boardvoltage').val(cachedconfig.generalsettings.boardvoltage);

        $('#nodeip').val(cachedconfig.generalsettings.nodeip);
        $('#routerip').val(cachedconfig.generalsettings.routerip);

        document.title = cachedconfig.generalsettings.nodename;

        $.Notification.notify('success','top left', 'Config Saved', "");
    })
}


function updateNetworkTable()
{
    getNetworkMap(function(map){
        var data = map;
        updateNetworkMapTable(map);
    });
}

function nodeDiscoverCRUD()
{
    nodeDiscover(function () {

    });
}


function updateNetworkMapTable(netmap) {

    var wetdrycontactlist = cachedconfig.contactinputs;
    var oTable = document.getElementById("networkmaptable");
    oTable.innerHTML = "";

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, i;

    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "ip";
    oCell2 = document.createElement("TD");
    oCell2.innerHTML = "Name";

    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-2";
    oTColGrp.appendChild(coldef);

    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);

    oTable.appendChild(oTHead);
    oTable.appendChild(oTColGrp);
    oTable.appendChild(oTBody);

    // Insert rows and cells into bodies.
    if(netmap != undefined) {
        for (i = 0; i < netmap.nodes.length; i++) {
            var oBody = oTBody;
            oRow = document.createElement("TR");
            oBody.appendChild(oRow);
            var col1part = document.createElement("TD");
            col1part.innerHTML = netmap.nodes[i].ip;

            var col2part = document.createElement("TD");
            col2part.innerHTML = netmap.nodes[i].name;

            oRow.appendChild(col1part);
            oRow.appendChild(col2part);
        }
    }
}