/**
 * Created by Nick on 3/16/2017.
 */


// These are the constraints used to validate the form
var constraints = {
    name: {
        length: {
            minimum: 8,
            maximum: 8
        },
        format: {
            pattern: "[a-f0-9]+",
            flags: "i",
            message: "Device ID can only contain hex ( a-f  / 0-9 ) "
        },
        presence: true
    }
}


setInterval(function () {
    getEnoceanRx(function(data) {

        var k = 0;
        k = k + 1;

        var datastring = "";
        for(var i =0; i < data.length; i++)
        {
            datastring += data[i] + "\n";
        }
        var textarea = document.getElementById("enoceanrx");

        textarea.value = datastring;

    })

}, 5000);


function init()
{
    getConfig(processConfig);
   // getInterfaceOutputs(processio);
}


function processConfig(configobj) {
    cachedconfig = configobj;
    updateDeviceMapTable();
    updateInputDeviceMapTable();
}


function updateDeviceMapTable() {

    var enoceanmap = cachedconfig.enocean.outputs;

    var oTable = document.getElementById("outputdevtable");
    oTable.innerHTML = ""; //blank out table,

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3,oCell4, i;

    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "enocean device id";
    //oCell2 = document.createElement("TD");
    //oCell2.innerHTML = "id";
    oCell3 = document.createElement("TD");
    oCell3.innerHTML = "Teach";
    oCell4 = document.createElement("TD");
    oCell4.innerHTML = "Delete";

    oRow.appendChild(oCell1);
  //  oRow.appendChild(oCell2);
    oRow.appendChild(oCell3);
    oRow.appendChild(oCell4);
    oTHead.appendChild(oRow);

    var coldef = document.createElement("col");
    coldef.className = "col-md-2";
    oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);
   // coldef = document.createElement("col");
   // coldef.className = "col-md-1";
   // oTColGrp.appendChild(coldef);
    coldef = document.createElement("col");
    coldef.className = "col-md-1";
    oTColGrp.appendChild(coldef);

    oTable.appendChild(oTHead);
    oTable.appendChild(oTColGrp);
    oTable.appendChild(oTBody);

    // Insert rows and cells into bodies.
    if(enoceanmap != undefined) {
        for (i = 0; i < enoceanmap.length; i++) {
            var oBody = oTBody;
            oRow = document.createElement("TR");
            oBody.appendChild(oRow);

            var col1part = document.createElement("TD");
            col1part.innerHTML = enoceanmap[i].id;

           // var col2part = document.createElement("TD");
           // col2part.innerHTML = enoceanmap[i].systemid;

            var col3part = document.createElement("TD");
            var teachbutton = document.createElement("input");
            teachbutton.value = "TEACH";
            teachbutton.setAttribute("index", i);
            teachbutton.addEventListener("click", teachOutputItem);
            teachbutton.className = "btn btn-xs btn-primary";
            col3part.appendChild(teachbutton);


            var col4part = document.createElement("TD");
            var delbutton = document.createElement("input");
            delbutton.value = "X";
            delbutton.setAttribute("index", i);
            delbutton.addEventListener("click", deleteOutputItem);
            delbutton.className = "btn btn-xs btn-danger";
            col4part.appendChild(delbutton);


            oRow.appendChild(col1part);
           // oRow.appendChild(col2part);
            oRow.appendChild(col3part);
            oRow.appendChild(col4part);
        }
    }

    $("#tableOutput").html(oTable);
    outputdevtablediv.appendChild(oTable);
}

/*
function systemidtaken(id)
{
    for(var i = 0 ; i < cachedconfig.enocean.length; i++)
    {
        var sysid = Number(cachedconfig.enocean[i].systemid);
        if(sysid == id)
            return true;
    }
    return false;
}
*/

function adddevice()
{
     //4/24/217
    var devid = document.getElementById("deviceid").value.trim().toUpperCase();
    var j = validate({name: devid}, constraints);
    if(j != undefined && j.name != undefined && j.name.length > 0)
    {
        $.Notification.notify('error','top left', 'Error', j.name[0]);
        return;
    }

    var element = {}
    element.enoceanid = devid; // document.getElementById("deviceid").value;
   /* for(var i = 4; i < 50; i+=1)
    {
        if(!systemidtaken(i))
        {
            element.systemid = String(i);
            break;
        }

    }*/

    saveConfigObject("enocean",element,function (retval) {
        cachedconfig = retval;
        updateDeviceMapTable();
    });
}


function deleteOutputItem()
{
    var index =  Number(this.getAttribute('index'));
    var element = {}
    element.enoceanid = cachedconfig.enocean.outputs[index].id;

    deleteConfigObject("enocean",element,function (retval) {
        cachedconfig = retval;
        updateDeviceMapTable();
    });

}


var teachprompt = undefined;

function teachOutputItem()
{
    var index =  Number(this.getAttribute('index'));
    var id = cachedconfig.enocean.outputs[index].id;
    var element = {};
    element.enoceanid = id;
    teachenocean(element);

    $("#outputdevtable").find("input,button").attr("disabled", "disabled");

    teachprompt = bootbox.dialog({
        title: 'Teach Sequence Started',
        message: '<p><i class="fa fa-spin fa-spinner"></i> Please Wait for teach sequence to complete ... </p>'
    });
    teachprompt.init(function(){
        setTimeout(function(){
            teachprompt.find('.bootbox-body').html('Teach Completed, please check log for result');
            $("#outputdevtable").find("input,button").attr("disabled", false);
        }, 20000);
    });
}

function startLearning()
{
    learnenocean(function (retval) {
        cachedconfig = retval;
        updateDeviceMapTable();
    });
}



//var cahcediomap;
//function processio(data)
//{
//    cahcediomap = data;
  //  updateInputDeviceMapTable()
//}


function updateInputDeviceMapTable() {

    var iomap = cachedconfig.enocean.inputs; //cahcediomap.enocean;

    var oTable = document.getElementById("inputdevtable");
    oTable.innerHTML = ""; //blank out table,

    var oTHead = document.createElement("THEAD");
    var oTColGrp = document.createElement("colgroup");
    var oTBody = document.createElement("TBODY");
    var oTFoot = document.createElement("TFOOT");
    var oRow, oCell1, oCell2, oCell3,oCell4, i;

    oRow = document.createElement("TR");
    oCell1 = document.createElement("TD");
    oCell1.innerHTML = "enocean device id";
    oCell2 = document.createElement("TD");
    oCell2.innerHTML = "type";
    oCell3 = document.createElement("TD");
    oCell3.innerHTML = "Delete";
    oRow.appendChild(oCell1);
    oRow.appendChild(oCell2);
    oRow.appendChild(oCell3);
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

    oTable.appendChild(oTHead);
    oTable.appendChild(oTColGrp);
    oTable.appendChild(oTBody);

    // Insert rows and cells into bodies.
    if(iomap != undefined) {
        for (i = 0; i < cachedconfig.enocean.inputs.length; i++) {

            var oBody = oTBody;

            var dev = cachedconfig.enocean.inputs[i];
            if (dev.eep == "F6-02-02") {
                if (dev.isdouble) {

                    oRow = document.createElement("TR");
                    oBody.appendChild(oRow);
                    var col1part = document.createElement("TD");
                    col1part.innerHTML = cachedconfig.enocean.inputs[i].id + "(A)";
                    var col2part = document.createElement("TD");
                    col2part.innerHTML = "double " + dev.type;


                    var col3part = document.createElement("TD");
                    var delbutton = document.createElement("input");
                    delbutton.value = "X";
                    delbutton.setAttribute("index", i);
                    delbutton.addEventListener("click", deleteInputItem);
                    delbutton.className = "btn btn-xs btn-danger";
                    col3part.appendChild(delbutton);

                    oRow.appendChild(col1part);
                    oRow.appendChild(col2part);
                    oRow.appendChild(col3part);


                    oRow = document.createElement("TR");
                    oBody.appendChild(oRow);
                    var col1part = document.createElement("TD");
                    col1part.innerHTML = cachedconfig.enocean.inputs[i].id + "(B)";
                    var col2part = document.createElement("TD");
                    col2part.innerHTML = "double " + dev.type;

                    var col3part = document.createElement("TD");
                    var delbutton = document.createElement("input");
                    delbutton.value = "X";
                    delbutton.setAttribute("index", i);
                    delbutton.addEventListener("click", deleteInputItem);
                    delbutton.className = "btn btn-xs btn-danger";
                    col3part.appendChild(delbutton);

                    oRow.appendChild(col1part);
                    oRow.appendChild(col2part);
                    oRow.appendChild(col3part);
                }
                else {

                    oRow = document.createElement("TR");
                    oBody.appendChild(oRow);
                    var col1part = document.createElement("TD");
                    col1part.innerHTML = cachedconfig.enocean.inputs[i].id + "(A)";
                    var col2part = document.createElement("TD");
                    col2part.innerHTML = dev.type;

                    var col3part = document.createElement("TD");
                    var delbutton = document.createElement("input");
                    delbutton.value = "X";
                    delbutton.setAttribute("index", i);
                    delbutton.addEventListener("click", deleteInputItem);
                    delbutton.className = "btn btn-xs btn-danger";
                    col3part.appendChild(delbutton);

                    oRow.appendChild(col1part);
                    oRow.appendChild(col2part);
                    oRow.appendChild(col3part);
                }

            }
            else {

                //oRow = document.createElement("TR");
                //oBody.appendChild(oRow);
                //var col1part = document.createElement("TD");
                //var col2part = document.createElement("TD");
                //var col3part = document.createElement("TD");
                //col2part.innerHTML = dev.type; //"Contact Input";
               // oRow.appendChild(col1part);
               // oRow.appendChild(col2part);
               // oRow.appendChild(col3part);



                oRow = document.createElement("TR");
                oBody.appendChild(oRow);
                var col1part = document.createElement("TD");
                col1part.innerHTML = cachedconfig.enocean.inputs[i].id;
                var col2part = document.createElement("TD");
                col2part.innerHTML = dev.type;
                var col3part = document.createElement("TD");
                var delbutton = document.createElement("input");
                delbutton.value = "X";
                delbutton.setAttribute("index", i);
                delbutton.addEventListener("click", deleteInputItem);
                delbutton.className = "btn btn-xs btn-danger";
                col3part.appendChild(delbutton);

                oRow.appendChild(col1part);
                oRow.appendChild(col2part);
                oRow.appendChild(col3part);
            }

        }
    }

    $("#tableOutput").html(oTable);
    inputdevtablediv.appendChild(oTable);
}


function deleteInputItem()
{
    var index =  Number(this.getAttribute('index'));
    var element = {}
    element.enoceanid = cachedconfig.enocean.inputs[index].id;

    deleteConfigObject("enocean",element,function (retval) {
        cachedconfig = retval;
        //updateDeviceMapTable();
        updateInputDeviceMapTable();
    });

}