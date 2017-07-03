/**
 * Created by nickp on 6/26/2017.
 */





// uses globals:  selectedfixtureobj  for setting

    // uses callback  postSetFixtureHandler,
var pendingFixtureLevelObj = undefined;  // holds pending settings .. to be sent out by timer,
var rgbwsettimer = undefined; //timer obj.
// required css, iro wheel , rgb_right
// rgb_wheel, ,  crud_override. to send over stuff,

function setFixtureLevel(element)
{
    setFixtureLevel2(element,postSetFixtureHandler); // call to CRUD iface..
}


function setRGBWToHW()
{
    if(pendingFixtureLevelObj != undefined)
    {
        setFixtureLevel(pendingFixtureLevelObj);
        pendingFixtureLevelObj = undefined;
    }
}

function startRGBCallHWCallTimer(redpct, greenpct, bluepct)
{
    // stop timer ,,
    if(rgbwsettimer != undefined)
    {
        clearTimeout(rgbwsettimer);
    }

    pendingFixtureLevelObj = {};
    pendingFixtureLevelObj.requesttype = "override";
    pendingFixtureLevelObj.name = selectedfixtureobj.assignedname;

    pendingFixtureLevelObj.red = redpct; //((lastrgbcolor.rgb.r * 100) / 255).toFixed(0);  // convert to pct
    pendingFixtureLevelObj.green = greenpct; //((lastrgbcolor.rgb.g * 100) / 255).toFixed(0);  // convert to pct
    pendingFixtureLevelObj.blue = bluepct; //((lastrgbcolor.rgb.b * 100) / 255).toFixed(0);  // convert to pct

    rgbwsettimer = setTimeout(setRGBWToHW, 600)  //600ms,  reset,
}


function startRGBWCallHWCallTimer(redpct, greenpct, bluepct, whitepct)
{
    // stop timer ,,
    if(rgbwsettimer != undefined)
    {
        clearTimeout(rgbwsettimer);
    }

    pendingFixtureLevelObj = {};
    pendingFixtureLevelObj.requesttype = "override";
    pendingFixtureLevelObj.name = selectedfixtureobj.assignedname;

    pendingFixtureLevelObj.red = redpct; //((lastrgbcolor.rgb.r * 100) / 255).toFixed(0);  // convert to pct
    pendingFixtureLevelObj.green = greenpct; //((lastrgbcolor.rgb.g * 100) / 255).toFixed(0);  // convert to pct
    pendingFixtureLevelObj.blue = bluepct; //((lastrgbcolor.rgb.b * 100) / 255).toFixed(0);  // convert to pct
    pendingFixtureLevelObj.white = whitepct; //lastwhite;

    rgbwsettimer = setTimeout(setRGBWToHW, 600)  //600ms,  reset,
}



function startRGBWWCWCallHWCallTimer(redpct, greenpct, bluepct, warmwhitepct, coldwhitepct)
{
    // stop timer ,,
    if(rgbwsettimer != undefined)
    {
        clearTimeout(rgbwsettimer);
    }

    pendingFixtureLevelObj = {};
    pendingFixtureLevelObj.requesttype = "override";
    pendingFixtureLevelObj.name = selectedfixtureobj.assignedname;

    pendingFixtureLevelObj.red = redpct;
    pendingFixtureLevelObj.green = greenpct;
    pendingFixtureLevelObj.blue = bluepct;
    pendingFixtureLevelObj.warmwhite = warmwhitepct;
    pendingFixtureLevelObj.coldwhite = coldwhitepct;


    rgbwsettimer = setTimeout(setRGBWToHW, 600)  //600ms,  reset,
}






function constructControlRGB(fixsettingdiv, ctrlidx)
{
    var fixrow1 = document.createElement("DIV");
    fixrow1.className = "rgbw_wheel";
    fixrow1.id = 'wheel'+ctrlidx;
    fixsettingdiv.appendChild(fixrow1);

    var controls_right = document.createElement("div");
    controls_right.className = "rgbw_right";
    fixsettingdiv.appendChild(controls_right);

    var $colorpicker1 = $("<div>", {id: "colorWheelDemo", "class": "wheel"});
    $("#wheel"+ctrlidx).append($colorpicker1);
    // get the last known status levels, and set up control
    var cwheelvalues = "rgb(255,255,255)";
    //convert from pct back to rgb 8 bit,
    var red = (selectedfixtureobj.red * 255)/100;
    var green = (selectedfixtureobj.green * 255)/100;
    var blue = (selectedfixtureobj.blue * 255)/100;

    cwheelvalues = "rgb(" + red.toFixed()+ "," + green.toFixed() + "," + blue.toFixed() + ")";

    lastrgbcolor = {};
    lastrgbcolor.rgb = {};
    lastrgbcolor.rgb.r = red;
    lastrgbcolor.rgb.g = green;
    lastrgbcolor.rgb.b = blue;

    var colorWheel = iro.ColorWheel("#colorWheelDemo", {
        width: 300,
        height: 300,
        padding: 4,
        sliderMargin: 24,
        markerRadius: 4,
        color: cwheelvalues,
        CSS: {} // apply colors to any elements
    });

    colorWheel.watch(function(color) {
        lastrgbcolor = color;
        var redpct = ((color.rgb.r * 100) / 255).toFixed(0);
        var greenpct = ((color.rgb.g * 100) / 255).toFixed(0);
        var bluepct = ((color.rgb.b * 100) / 255).toFixed(0);
        startRGBCallHWCallTimer(redpct, greenpct, bluepct);
    });

}




function constructControlRGBW(fixsettingdiv, ctrlidx)
{
    var bsrow = document.createElement("DIV");
    bsrow.className = "row";
    fixsettingdiv.appendChild(bsrow);

    var bswheelhold = document.createElement("DIV");
    bswheelhold.className = "col-lg-6";
    bsrow.appendChild(bswheelhold);

    var bscoolbar = document.createElement("DIV");
    bscoolbar.className = "col-lg-6";
    bsrow.appendChild(bscoolbar);


    var fixrow1 = document.createElement("DIV");
    fixrow1.className = "rgbw_wheel";
    fixrow1.id = 'wheel'+ctrlidx;
    bswheelhold.appendChild(fixrow1);
   // fixsettingdiv.appendChild(fixrow1);

    //var controls_right = document.createElement("div");
    //controls_right.className = "rgbw_right";
   // fixsettingdiv.appendChild(controls_right);

    var $colorpicker1 = $("<div>", {id: "colorWheelDemo", "class": "wheel"});
    $("#wheel"+ctrlidx).append($colorpicker1);
    // get the last known status levels, and set up control
    var cwheelvalues = "rgb(255,255,255)";
    //convert from pct back to rgb 8 bit,
    var red = (selectedfixtureobj.red * 255)/100;
    var green = (selectedfixtureobj.green * 255)/100;
    var blue = (selectedfixtureobj.blue * 255)/100;

    //var white = (selectedfixtureobj.white * 255)/100;

    cwheelvalues = "rgb(" + red.toFixed()+ "," + green.toFixed() + "," + blue.toFixed() + ")";

    lastrgbcolor = {};
    lastrgbcolor.rgb = {};
    lastrgbcolor.rgb.r = red;
    lastrgbcolor.rgb.g = green;
    lastrgbcolor.rgb.b = blue;

    var colorWheel = iro.ColorWheel("#colorWheelDemo", {
        width: 300,
        height: 300,
        padding: 4,
        sliderMargin: 24,
        markerRadius: 4,
        color: cwheelvalues,
        CSS: {} // apply colors to any elements
    });

    colorWheel.watch(function(color) {
        lastrgbcolor = color;
        var redpct = ((color.rgb.r * 100) / 255).toFixed(0);
        var greenpct = ((color.rgb.g * 100) / 255).toFixed(0);
        var bluepct = ((color.rgb.b * 100) / 255).toFixed(0);
        var white = document.getElementById("brightctrl").value;

        startRGBWCallHWCallTimer(redpct, greenpct, bluepct, white);
    });




    // right side,
    var bright_grad = document.createElement("div");
    bright_grad.className = "vert_brightness_grad";
    bscoolbar.appendChild(bright_grad);
    //controls_right.appendChild(bright_grad);

    var guageholder = document.createElement("div");
    guageholder.className = "vert_guage_holder";
    bright_grad.appendChild(guageholder);

    var bright_guage = document.createElement("input");
    bright_guage.type = "range";
    bright_guage.setAttribute("data-orientation","vertical");
    bright_guage.id = "brightctrl";
    bright_guage.value = selectedfixtureobj.white;
    guageholder.appendChild(bright_guage);

    $('input[type="range"]').rangeslider({
        polyfill : false,
        rangeClass: 'custom_slider_range',
        fillClass: 'custom_slider_fill',
        verticalClass: 'custom_rangeslider_vertical',

        onInit : function() {
            //  this.output = $( '<div class="range-output" />' ).insertAfter( this.$range ).html( this.$element.val() );
        },
        onSlideEnd : function( position, value ) {
            if(this.$element[0].id == "brightctrl")
            {
                var redpct = ((lastrgbcolor.rgb.r * 100) / 255).toFixed(0);
                var greenpct = ((lastrgbcolor.rgb.g * 100) / 255).toFixed(0);
                var bluepct = ((lastrgbcolor.rgb.b * 100) / 255).toFixed(0);

                startRGBWCallHWCallTimer(redpct, greenpct, bluepct, this.value);

            }
        }
    });

}



function constructControlRGBWWCW(fixsettingdiv, ctrlidx)
{

    var bsrow = document.createElement("DIV");
    bsrow.className = "row";
    fixsettingdiv.appendChild(bsrow);


    var bswheelhold = document.createElement("DIV");
    bswheelhold.className = "col-lg-8";
    bsrow.appendChild(bswheelhold);

    var bswarmbar = document.createElement("DIV");
    bswarmbar.className = "col-lg-1";
    bsrow.appendChild(bswarmbar);

    var bscoolbar = document.createElement("DIV");
    bscoolbar.className = "col-lg-1";
    bsrow.appendChild(bscoolbar);



    var fixrow1 = document.createElement("DIV");
    fixrow1.className = "rgbw_wheel";
    fixrow1.id = 'wheel'+ctrlidx;
    bswheelhold.appendChild(fixrow1);
   // fixsettingdiv.appendChild(fixrow1);

    //var controls_right = document.createElement("div");
   // controls_right.className = "rgbw_right";
   // fixsettingdiv.appendChild(controls_right);

    var $colorpicker1 = $("<div>", {id: "colorWheelDemo", "class": "wheel"});
    $("#wheel"+ctrlidx).append($colorpicker1);
    // get the last known status levels, and set up control
    var cwheelvalues = "rgb(255,255,255)";
    //convert from pct back to rgb 8 bit,
    var red = (selectedfixtureobj.red * 255)/100;
    var green = (selectedfixtureobj.green * 255)/100;
    var blue = (selectedfixtureobj.blue * 255)/100;

    //var white = (selectedfixtureobj.white * 255)/100;

    cwheelvalues = "rgb(" + red.toFixed()+ "," + green.toFixed() + "," + blue.toFixed() + ")";

    lastrgbcolor = {};
    lastrgbcolor.rgb = {};
    lastrgbcolor.rgb.r = red;
    lastrgbcolor.rgb.g = green;
    lastrgbcolor.rgb.b = blue;

    var colorWheel = iro.ColorWheel("#colorWheelDemo", {
        width: 300,
        height: 300,
        padding: 4,
        sliderMargin: 24,
        markerRadius: 4,
        color: cwheelvalues,
        CSS: {} // apply colors to any elements
    });

    colorWheel.watch(function(color) {
        lastrgbcolor = color;
        var redpct = ((color.rgb.r * 100) / 255).toFixed(0);
        var greenpct = ((color.rgb.g * 100) / 255).toFixed(0);
        var bluepct = ((color.rgb.b * 100) / 255).toFixed(0);
        var warmwhite = document.getElementById("warmwhite").value;
        var coldwhite = document.getElementById("coldwhite").value;

        startRGBWWCWCallHWCallTimer(redpct, greenpct, bluepct, warmwhite, coldwhite);
    });


    // right side, (warm white.
    var bright_grad = document.createElement("div");
    bright_grad.className = "vert_brightness_grad_warm";
    bswarmbar.appendChild(bright_grad);
    //controls_right.appendChild(bright_grad);

    var guageholder = document.createElement("div");
    guageholder.className = "vert_guage_holder";
    bright_grad.appendChild(guageholder);

    var bright_guage = document.createElement("input");
    bright_guage.type = "range";
    bright_guage.setAttribute("data-orientation","vertical");
    bright_guage.id = "warmwhite";
    bright_guage.value = selectedfixtureobj.warmwhite;
    guageholder.appendChild(bright_guage);


    // cold white,
    var cw_div = document.createElement("div");   // gradient div
    cw_div.className = "vert_brightness_grad_cool";
    bscoolbar.appendChild(cw_div);
   // controls_right.appendChild(cw_div);

    var cw_gh = document.createElement("div");    // guage control holder inside of gradient div(transparent)
    cw_gh.className = "vert_guage_holder";
    cw_div.appendChild(cw_gh);

    var cw_guage = document.createElement("input");   // guage inside of holder.
    cw_guage.type = "range";
    cw_guage.setAttribute("data-orientation","vertical");
    cw_guage.id = "coldwhite";
    cw_guage.value = selectedfixtureobj.warmwhite;
    cw_gh.appendChild(cw_guage);


    $('input[type="range"]').rangeslider({
        polyfill : false,
        rangeClass: 'custom_slider_range',
        fillClass: 'custom_slider_fill',
        verticalClass: 'custom_rangeslider_vertical',

        onInit : function() {
            //  this.output = $( '<div class="range-output" />' ).insertAfter( this.$range ).html( this.$element.val() );
        },
        onSlideEnd : function( position, value ) {
            if(this.$element[0].id == "warmwhite")
            {
                var redpct = ((lastrgbcolor.rgb.r * 100) / 255).toFixed(0);
                var greenpct = ((lastrgbcolor.rgb.g * 100) / 255).toFixed(0);
                var bluepct = ((lastrgbcolor.rgb.b * 100) / 255).toFixed(0);

                var warmwhite = document.getElementById("warmwhite").value;
                var coldwhite = document.getElementById("coldwhite").value;
                startRGBWWCWCallHWCallTimer(redpct, greenpct, bluepct, warmwhite, coldwhite);

            }
            if(this.$element[0].id == "coldwhite")
            {
                var redpct = ((lastrgbcolor.rgb.r * 100) / 255).toFixed(0);
                var greenpct = ((lastrgbcolor.rgb.g * 100) / 255).toFixed(0);
                var bluepct = ((lastrgbcolor.rgb.b * 100) / 255).toFixed(0);

                var warmwhite = document.getElementById("warmwhite").value;
                var coldwhite = document.getElementById("coldwhite").value;
                startRGBWWCWCallHWCallTimer(redpct, greenpct, bluepct, warmwhite, coldwhite);

            }
        }
    });

}

