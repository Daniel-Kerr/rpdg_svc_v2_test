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


$(document).ready(function() {

    $("#fixturetable").on("click", " tr", function(e) {

        // 3/15/17, remove any thing else that is highlighted,
        $('#wetdrycontacttable > tbody  > tr').each(function() {
            $(this).removeClass('active');
        });
        $('#levelinputstable > tbody  > tr').each(function() {
            $(this).removeClass('active');
        });


        if ( $(this).hasClass('active') ) {
            $(this).removeClass('active');
        }
        else {
            //$("#fixturetable").$('tr.active').removeClass('active');
            $(this).addClass('active').siblings().removeClass('active');

            var row = $(this).find('td:first').text();
            // alert('You clicked ' + row);

            for(var i = 0; i < cachedconfig.fixtures.length; i++)
            {
                var fixture = cachedconfig.fixtures[i];
                if(fixture.assignedname == row)
                {
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



                    document.getElementById("fixturetype").value = fixture.type;
                    document.getElementById("fixturename").value = fixture.assignedname;

                    document.getElementById("interface").value = fixture.interfacename;

                    updateAvalibleStartingOutputNumbers();
                    document.getElementById("starting_output").value = fixture.outputid; //[0]; // need to do some work here.


                    for(var j = 0; j < availibleinputs.length; j++)
                    {
                        var cb = availibleinputs[j];
                        var cbval = $(cb).val();
                        if(fixture.boundinputs.includes(cbval))
                            $(cb).prop('checked',true);
                        else
                            $(cb).prop('checked',false);

                    }

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
                    document.getElementById("fixtureparam_12").value = fixture.parameters.manualceiling;
                    document.getElementById("fixtureparam_13").value = fixture.parameters.daylightfloor;
                    document.getElementById("fixtureparam_14").value =  fixture.parameters.manualfloor;
                }
            }


            // $(this).addClass('active');
        }
    } );   //end click handler for fixture table.


    $("#interface").change(function () {
        updateAvalibleStartingOutputNumbers();
    });

    $("#levelinputinterface").change(function () {
        updateLevelInputs_InputSel();
    });

    $("#contactinputinterface").change(function () {
        updateContactInputs_InputSel();
    });

    // start, click handler for contact input
    $("#wetdrycontacttable").on("click", " tr", function(e) {

        // 3/15/17, remove any thing else that is highlighted,
        $('#fixturetable > tbody  > tr').each(function() {
            $(this).removeClass('active');
        });
        $('#levelinputstable > tbody  > tr').each(function() {
            $(this).removeClass('active');
        });


        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
        }
        else {
            $(this).addClass('active').siblings().removeClass('active');

            var row = $(this).find('td:first').text();


            for(var i = 0; i < cachedconfig.contactinputs.length; i++) {
                var ic = cachedconfig.contactinputs[i];
                if (ic.assignedname == row) {

                    document.getElementById("contactname").value = ic.assignedname;

                    SelectRadioButton("contacttype",ic.type);
                    SelectRadioButton("contactsubtype",ic.subtype);

                    $("#contactinputinterface").val(ic.interface);

                    updateContactInputs_InputSel();


                    $("#contact_inputnum").val(ic.inputid).change();

                    // updateInputContactActionDropDowns();
                    updateInputContactActionDropDowns(ic);
                    enableDisableInputActionDropDowns();

                    /*
                     if(ic.active_action != undefined)
                     {
                     var aa = ic.active_action;
                     if(aa.includes("_@@_"))
                     {
                     var parts = aa.split("_@@_");
                     if(parts.length == 2)
                     {
                     $("#active_action_sel").val(parts[0]).change();
                     $("#active_action_target").val(parts[1]).change();
                     }
                     }
                     else if(aa.includes("scene_"))
                     {
                     //var part = aa.substring(6);
                     $("#active_action_sel").val(aa).change();
                     }
                     else
                     {
                     $("#active_action_sel").val(aa).change();
                     }
                     }

                     if(ic.inactive_action != undefined)
                     {
                     var aa = ic.inactive_action;
                     if(aa.includes("_@@_"))
                     {
                     var parts = aa.split("_@@_");
                     if(parts.length == 2)
                     {
                     $("#inactive_action_sel").val(parts[0]).change();
                     $("#inactive_action_target").val(parts[1]).change();
                     }
                     }
                     else if(aa.includes("scene_"))
                     {
                     $("#inactive_action_sel").val(aa).change();
                     }
                     else
                     {
                     $("#inactive_action_sel").val(aa).change();
                     }
                     }
                     */


                }
            }

        }
    });



    // start, click handler for contact input
    $("#levelinputstable").on("click", " tr", function(e) {

        // 3/15/17, remove any thing else that is highlighted,
        $('#fixturetable > tbody  > tr').each(function() {
            $(this).removeClass('active');
        });
        $('#wetdrycontacttable > tbody  > tr').each(function() {
            $(this).removeClass('active');
        });



        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
        }
        else {
            $(this).addClass('active').siblings().removeClass('active');
            var row = $(this).find('td:first').text();

            for(var i = 0; i < cachedconfig.levelinputs.length; i++) {
                var ic = cachedconfig.levelinputs[i];
                if (ic.assignedname == row) {
                    $("#levelinputname").val(ic.assignedname);
                    $("#levelinputtype").val(ic.type);
                    $("#levelinputinterface").val(ic.interface);

                    updateLevelInputs_InputSel();
                    $("#levelinput_inputs").val(ic.inputid);

                    $("#levelinput_drive").val(ic.drivelevel);


                }
            }
        }
    });
});


function SelectRadioButton(name, value) {
    $("input[name='"+name+"'][value='"+value+"']").prop('checked', true);
    return false; // Returning false would not submit the form

}
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
}



function cachehostipaddr(retval)
{
    hostip = retval;
}


//var loadedlevelinputs;
function processConfig(configobj)
{
    cachedconfig = configobj;  // just so we can copy over groups on save.


    getFixtureParameterOptions(cacheFixtureParamOptions);
    // loadParamOptions();
    // loadedfixtures = configobj.fixtures;
    updateFixturesTable();

    populateBoundInputOptions();

    //  loadedinputcontacts = configobj.contactinputs;

    updateWetDryContactTable();

    // loadedlevelinputs = configobj.levelinputs;
    updateLevelInputsTable();


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


    //  initgroupsel();


    getInterfaceOutputs(function (retval) {

        cachedinterfaceio = retval;
        updateAvalibleStartingOutputNumbers();

        updateLevelInputs_InputSel();
        updateContactInputs_InputSel();
    });


    // site info:
    document.getElementById("sitezip").value = cachedconfig.sitezip;
    document.getElementById("sitelatt").value = cachedconfig.sitelatt;
    document.getElementById("sitelong").value = cachedconfig.sitelong;
}






function updateFixturesTable() {

    var fixtures = cachedconfig.fixtures;
    var oTable = document.getElementById("fixturetable");
    oTable.innerHTML = ""; //blank out table,

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3, oCell4,
        oCell5,oCell6,oCell7,oCell8, i,j;

    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Name";
    //oCell.colSpan = 2;
    oCell2 = document.createElement("TD");
    oCell2.innerHTML = "Type";
    oCell3 = document.createElement("TD");
    oCell3.innerHTML = "Interface";
    oCell4 = document.createElement("TD");
    oCell4.innerHTML = "Outputs Utilized";
    oCell5 = document.createElement("TD");
    oCell5.innerHTML = "Bound Inputs";
    //  oCell5 = document.createElement("TD");
    //  oCell5.innerHTML = "Contact Inputs";
    oCell6 = document.createElement("TD");
    oCell6.innerHTML = "Candle Dim";
    // oCell7 = document.createElement("TD");
    // oCell7.innerHTML = "Local Groups";
    oCell7 = document.createElement("TD");
    oCell7.innerHTML = "Delete";

    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oRow.appendChild(oCell3);
    oRow.appendChild(oCell4);
    oRow.appendChild(oCell5);
    oRow.appendChild(oCell6);
    oRow.appendChild(oCell7);
    //  oRow.appendChild(oCell8);
    // oRow.appendChild(oCell9);

    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-2";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    //   coldef = document.createElement("col");
    //   coldef.className = "col-md-1";
    //  oTColGrp.appendChild(coldef);
    //   coldef = document.createElement("col");
    // coldef.className = "col-md-1";
    //  oTColGrp.appendChild(coldef);

    oTable.appendChild(oTHead);
    oTable.appendChild(oTColGrp);
    oTable.appendChild(oTBody);

    // Insert rows and cells into bodies.
    for (i=0; i< fixtures.length; i++)   {
        var oBody = oTBody;
        oRow = document.createElement("TR");
        oBody.appendChild(oRow);

        // for (j=0; j<5; j++)     {
        // column1 = Zone Label
        var col1part = document.createElement("TD");
        col1part.innerHTML = fixtures[i].assignedname;

        var col2part = document.createElement("TD");
        col2part.innerHTML = fixtures[i].type;

        var col3part = document.createElement("TD");
        col3part.innerHTML = fixtures[i].interfacename;

        var col4part = document.createElement("TD");
        col4part.innerHTML = fixtures[i].outputid;

        var col5part = document.createElement("TD");
        col5part.innerHTML = fixtures[i].boundinputs;

        //var col5part = document.createElement("TD");
        // col5part.innerHTML = fixtures[i].contactinputs;

        var col6part = document.createElement("TD");
        col6part.innerHTML = fixtures[i].candledim;


        var col7part = document.createElement("TD");
        var delbutton = document.createElement("input");
        delbutton.value="X";
        delbutton.setAttribute("index",i);
        delbutton.addEventListener("click", deleteFixture);
        delbutton.className = "btn btn-xs btn-danger";
        col7part.appendChild(delbutton);

        //oRow.appendChild(col0part);
        oRow.appendChild(col1part);
        oRow.appendChild(col2part);
        oRow.appendChild(col3part);
        oRow.appendChild(col4part);
        oRow.appendChild(col5part);
        oRow.appendChild(col6part);
        oRow.appendChild(col7part);
        //}   // end row create ..*************************
    }

    $("#tableOutput").html(oTable);

    fixturetablediv.appendChild(oTable);
}



function populateBoundInputOptions() {

    availibleinputs = [];
    $('#boundinputs').empty();

    for(var i =0; i < cachedconfig.levelinputs.length; i++) {
        var name = cachedconfig.levelinputs[i].assignedname;
        var container = $('#boundinputs');
        var id = i + 1;
        var cb = $('<input />', {type: 'checkbox', id: 'bi' + id, value: name}).appendTo(container);
        $('<label />', {'for': 'bi' + id, text: name}).appendTo(container);
        $('<span />', {style:'display:inline-block', width: '30px'}).appendTo(container);

        availibleinputs.push(cb);
    }

    for(var i =0; i < cachedconfig.contactinputs.length; i++) {
        var name = cachedconfig.contactinputs[i].assignedname;
        var container = $('#boundinputs');
        var id = i + 1;
        var cb = $('<input />', {type: 'checkbox', id: 'bi' + id, value: name}).appendTo(container);
        $('<label />', {'for': 'bi' + id, text: name}).appendTo(container);
        $('<span />', {style:'display:inline-block', width: '30px'}).appendTo(container);
        availibleinputs.push(cb);
    }
}



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


function saveNewFixture() {

    var fixture = {};
    var startout = document.getElementById("starting_output");
    var type = document.getElementById("fixturetype");

    var selstart = startout.options[startout.selectedIndex].value;
    var seltype = type.options[type.selectedIndex].value;
    //  var assignment = buildassignment(Number(selstart), seltype);
    //  fixture.assignment = assignment;

    // convert assignemtn array to numbers with _ between them,
    // var custom = assignment.join("_");
    fixture.assignedname = document.getElementById("fixturename").value;
    // var uidbase = hostip.split(".").join("_");
    // fixture.uid = uidbase + "_" + custom;
    fixture.type = seltype;
    fixture.interfacename = $("#interface").val();
    //  fixture.globalgroups = 0;
    //  fixture.localgroups = "";
    fixture.outputid = selstart;

    fixture.status = 0;
    if (seltype == "on_off")
        fixture.image = "/images/bulb_off.jpg";
    else if (seltype == "dim")
        fixture.image = "/images/light_eg1.jpg";
    else if (seltype == "cct") {

        fixture.image = "/images/ceiling_spotlight.jpg";
        fixture.candledim = document.getElementById("candledim").checked;



        fixture.min = document.getElementById("minctemp").value;
        fixture.max =  document.getElementById("maxctemp").value;

    }
    else if(seltype == "rgbw")
        fixture.image = "/images/rgbw_fixture.jpg";

    var boundinputs =[];
    for(var i = 0; i < availibleinputs.length; i++)
    {
        var cb = availibleinputs[i];
        if($(cb).is(':checked'))
        {
            var k = 0;
            k = k + 1;
            boundinputs.push(cb.val());
        }

    }


    fixture.boundinputs = boundinputs;
    //  fixture.candledim = document.getElementById("candledim").checked;

    var params = {};  // will contain current settings,
    params.dimoptions = document.getElementById("fixtureparam_0").value;
    params.dimrate = document.getElementById("fixtureparam_1").value;;
    params.brightenrate = document.getElementById("fixtureparam_2").value;;
    params.resptoocc = document.getElementById("fixtureparam_3").value;
    params.resptovac = document.getElementById("fixtureparam_4").value;
    params.resptodl50 = document.getElementById("fixtureparam_5").value;;
    params.resptodl40 = document.getElementById("fixtureparam_6").value;;
    params.resptodl30 = document.getElementById("fixtureparam_7").value;;
    params.resptodl20 = document.getElementById("fixtureparam_8").value;;
    params.resptodl10 = document.getElementById("fixtureparam_9").value;;
    params.resptodl0 = document.getElementById("fixtureparam_10").value;;
    params.daylightceiling = document.getElementById("fixtureparam_11").value;;
    params.manualceiling = document.getElementById("fixtureparam_12").value;;
    params.daylightfloor = document.getElementById("fixtureparam_13").value;;
    params.manualfloor = document.getElementById("fixtureparam_14").value;;

    fixture.parameters = params;

    saveConfigObject("fixture",fixture,function (retval) {
        cachedconfig = retval;
        updateFixturesTable();
    });
}



function deleteFixture()
{
    var index =  Number(this.getAttribute('index'));
    deleteConfigObject("fixture",cachedconfig.fixtures[index],function (retval) {
        cachedconfig = retval;
        updateFixturesTable();
    });
}




function cacheFixtureParamOptions(params)
{
    global_paramoptions = params;
    buildParamOptionsTable();
}


function buildParamOptionsTable() {
    // Declare global variables and create the header, footer, and caption.
    var oTable = document.createElement("TABLE");
    // var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow;
    var i, j;
    oTable.className = "table table-bordered";
    oTable.appendChild(oTColGrp);
    // now body.
    for (var paramnum = 0; paramnum < global_paramoptions.parameters.length; paramnum++)
    {
        oRow = document.createElement("TR");  // build row element
        oTBody.appendChild(oRow);

        // first param
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

        // globalselector.addEventListener("change", onZoneOptionChanged);
        globalselector.setAttribute(ATTR_PARAM,paramnum);
        tempcell.appendChild(globalselector);
        oRow.appendChild(tempcell);
        setDropDownDataArray(globalselector,paramoptions);

        // second param for this row.
        paramnum++;
        if(paramnum < global_paramoptions.parameters.length) {

            var parameter2 = global_paramoptions.parameters[paramnum];
            var paramoptions2 = parameter2.options;

            var oCell1 = document.createElement("TD");
            oCell1.innerHTML = parameter2.name;
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
            setDropDownDataArray(globalselector, paramoptions2);
        }

        // 3rd item
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
    fixtureparamstable.appendChild(oTable);
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
    var type = $('input[name=contacttype]:checked', '#myForm').val();
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


function updateAvalibleStartingOutputNumbers()
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

    var sel = document.getElementById('starting_output');
    // clear all itesm ,
    while (sel.options.length > 0) {
        sel.remove(0);
    }

    var iface = $('#interface').val();
    if(iface == "rpdg-pwm")
    {
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
        for (var i = 0 ; i < cachedinterfaceio.enocean.outputs.length; i += 1) {
            var opt = document.createElement('option');
            opt.setAttribute('value', cachedinterfaceio.enocean.outputs[i]);
            opt.appendChild(document.createTextNode(cachedinterfaceio.enocean.outputs[i]));
            sel.appendChild(opt);
        }
        $("#fixturetype").prop("disabled",false);
    }
}



// CONTACT INPUTS ************************************************************************************
// ***************************************************************************************************

// wet dry contact table v2

function updateWetDryContactTable() {

    var wetdrycontactlist = cachedconfig.contactinputs;
    var oTable = document.getElementById("wetdrycontacttable");
    oTable.innerHTML = ""; //blank out table,

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3, oCell4,
        oCell5,oCell6,oCell7,oCell8, i,j;

    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Name";
    oCell2 = document.createElement("TD");
    oCell2.innerHTML = "Interface";
    oCell3 = document.createElement("TD");
    oCell3.innerHTML = "Input Number";
    oCell4 = document.createElement("TD");
    oCell4.innerHTML = "Type";
    oCell5 = document.createElement("TD");
    oCell5.innerHTML = "Active Action";
    oCell6 = document.createElement("TD");
    oCell6.innerHTML = "Inactive Action";
    oCell7 = document.createElement("TD");
    oCell7.innerHTML = "Delete";

    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oRow.appendChild(oCell3);
    oRow.appendChild(oCell4);
    oRow.appendChild(oCell5);
    oRow.appendChild(oCell6);
    oRow.appendChild(oCell7);
    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-2";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
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
    if(wetdrycontactlist != undefined) {
        for (i = 0; i < wetdrycontactlist.length; i++) {
            var oBody = oTBody;
            oRow = document.createElement("TR");
            oBody.appendChild(oRow);
            var col1part = document.createElement("TD");
            col1part.innerHTML = wetdrycontactlist[i].assignedname;

            var col2part = document.createElement("TD");
            col2part.innerHTML = wetdrycontactlist[i].interface;

            var col3part = document.createElement("TD");
            col3part.innerHTML = wetdrycontactlist[i].inputid;


            var col4part = document.createElement("TD");
            col4part.innerHTML = wetdrycontactlist[i].type;

            var col5part = document.createElement("TD");
            col5part.innerHTML = wetdrycontactlist[i].active_action;

            var col6part = document.createElement("TD");
            col6part.innerHTML = wetdrycontactlist[i].inactive_action;

            //  var col7part = document.createElement("TD");
            // col7part.innerHTML = wetdrycontactlist[i].inactive_action;


            var col7part = document.createElement("TD");
            var delbutton = document.createElement("input");
            delbutton.value = "X";
            delbutton.setAttribute("index", i);
            delbutton.addEventListener("click", deleteInputContactItem);
            delbutton.className = "btn btn-xs btn-danger";
            col7part.appendChild(delbutton);

            oRow.appendChild(col1part);
            oRow.appendChild(col2part);
            oRow.appendChild(col3part);
            oRow.appendChild(col4part);
            oRow.appendChild(col5part);
            oRow.appendChild(col6part);
            oRow.appendChild(col7part);
        }
    }

    $("#tableOutput").html(oTable);

    wetdrycontactdiv.appendChild(oTable);
}


function saveNewContactInputObj() {

    var contactinput = {};
    contactinput.assignedname = document.getElementById("contactname").value;

    contactinput.interface = $("#contactinputinterface").val();

    var inputnum = document.getElementById("contact_inputnum");
    var selinputnum = inputnum.options[inputnum.selectedIndex].value;
    contactinput.inputid = selinputnum;

    var type = $('input[name=contacttype]:checked', '#myForm').val();
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
            default:
                break;
        }

        contactinput.inactive_action = inactive_action;
    }
    else
        contactinput.inactive_action = "action_none";


    saveConfigObject("contactinput",contactinput ,function(retval) {
        cachedconfig = retval;
        updateWetDryContactTable();
        populateBoundInputOptions();

    });

}



function deleteInputContactItem()
{
    var index =  Number(this.getAttribute('index'));
    deleteConfigObject("contactinput",cachedconfig.contactinputs[index],function (retval) {
        cachedconfig = retval;
        updateWetDryContactTable();
        populateBoundInputOptions();
        updateFixturesTable();

    });

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







function updateLevelInputsTable() {

    var levelinputlist = cachedconfig.levelinputs;

    var oTable = document.getElementById("levelinputstable");
    oTable.innerHTML = ""; //blank out table,

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3, oCell4,
        oCell5,oCell6, i,j;

    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "Name";
    oCell2 = document.createElement("TD");
    oCell2.innerHTML = "Type";
    oCell3 = document.createElement("TD");
    oCell3.innerHTML = "Interface";
    oCell4 = document.createElement("TD");
    oCell4.innerHTML = "input id";
    oCell5 = document.createElement("TD");
    oCell5.innerHTML = "Drive Level";
    oCell6 = document.createElement("TD");
    oCell6.innerHTML = "Delete";

    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oRow.appendChild(oCell3);
    oRow.appendChild(oCell4);
    oRow.appendChild(oCell5);
    oRow.appendChild(oCell6);
    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-2";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
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
    if(levelinputlist != undefined) {
        for (i = 0; i < levelinputlist.length; i++) {
            var oBody = oTBody;
            oRow = document.createElement("TR");
            oBody.appendChild(oRow);

            var col1part = document.createElement("TD");
            col1part.innerHTML = levelinputlist[i].assignedname;

            var col2part = document.createElement("TD");
            col2part.innerHTML = levelinputlist[i].type;

            var col3part = document.createElement("TD");
            col3part.innerHTML = levelinputlist[i].interface;

            var col4part = document.createElement("TD");
            col4part.innerHTML = levelinputlist[i].inputid;

            var col5part = document.createElement("TD");
            col5part.innerHTML = levelinputlist[i].drivelevel;

            var col6part = document.createElement("TD");
            var delbutton = document.createElement("input");
            delbutton.value = "X";
            delbutton.setAttribute("index", i);
            delbutton.addEventListener("click", deleteLevelInput);
            delbutton.className = "btn btn-xs btn-danger";
            col6part.appendChild(delbutton);

            oRow.appendChild(col1part);
            oRow.appendChild(col2part);
            oRow.appendChild(col3part);
            oRow.appendChild(col4part);
            oRow.appendChild(col5part);
            oRow.appendChild(col6part);
        }
    }

    $("#tableOutput").html(oTable);

    levelinputdiv.appendChild(oTable);
}


function saveNewLevelInput() {

    var levelinput = {};
    levelinput.assignedname = document.getElementById("levelinputname").value;
    levelinput.inputid = $("#levelinput_inputs").val();;
    levelinput.type = $("#levelinputtype").val();
    levelinput.interface = $("#levelinputinterface").val();
    levelinput.drivelevel = $("#levelinput_drive").val();
    saveConfigObject("levelinput",levelinput ,function(retval) {
        cachedconfig = retval;
        updateLevelInputsTable();
        populateBoundInputOptions();

    });
}


function deleteLevelInput()
{
    var index =  Number(this.getAttribute('index'));
    deleteConfigObject("levelinput",cachedconfig.levelinputs[index],function (retval) {
        cachedconfig = retval;
        updateLevelInputsTable();
        populateBoundInputOptions();
        updateFixturesTable();

    });
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
                element.level = 100;
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
                element.level = 100;
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
                noty({text: 'Error saving config ' + retval.error, type: 'error'});
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

                default:
                    break;

            }

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

                default:
                    break;

            }

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