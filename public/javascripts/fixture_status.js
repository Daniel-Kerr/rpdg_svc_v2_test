/**
 * Created by nickp on 6/26/2017.
 */





function removeElement(id) {
    var elem = document.getElementById(id);
    if(elem != undefined)
        return elem.parentNode.removeChild(elem);
}

function constructFixtureStatusBoxes(parentdiv, fixtureobjlist)
{
    var currentrow_div = document.getElementById(parentdiv);
    currentrow_div.innerHTML = "";
    for (var i = 0; i < fixtureobjlist.length; i++) {
        constructFixtureStatusBox(currentrow_div, fixtureobjlist[i],i);
    }
}


function constructFixtureStatusBox(currentdiv, fixture, index) {
    removeElement("fix"+index);
    var fixcol = document.createElement("div");
    fixcol.className = "col-sm-4";
    currentdiv.appendChild(fixcol);

    var fixbox = document.createElement("div");
    fixbox.className = "card-box";
    fixbox.id = "fix"+index;

    fixcol.appendChild(fixbox);

    updateFixtureStatusBox(fixture,index);
}

function updateFixtureStatusBox(fixture, index)
{
    var cardboxdiv = document.getElementById("fix"+index);
    if(cardboxdiv != undefined)
    {

        cardboxdiv.innerHTML = "";
        var header = document.createElement("h4");
        header.className = "text-dark  header-title m-t-0 m-b-10";
        header.innerHTML = fixture.assignedname;
        cardboxdiv.appendChild(header);

        var fixcontent = document.createElement("div");
        fixcontent.className = "contentholder";
        cardboxdiv.appendChild(fixcontent);

        var statleft = document.createElement("div");
        statleft.className = "status_left";
        fixcontent.appendChild(statleft);

        var statright = document.createElement("div");
        statright.className = "status_right";
        fixcontent.appendChild(statright);

        var image_hold = document.createElement("div");
        image_hold.className = "imagehold";
        statleft.appendChild(image_hold);

        var power_hold = document.createElement("div");
        power_hold.className = "powerhold";
        statleft.appendChild(power_hold);

        var lbval = document.createElement("label");
        var powerlevel = "";
        if(fixture.interfacename == "rpdg-pwm") //  && boardtype == "LV") // && board is type lv. )
        {
            powerlevel = fixture.powerwatts + " Watts";
        }
        lbval.innerHTML = powerlevel; // fixture.powerwatts + " Watts";
        lbval.className = "powerlabel";
        power_hold.appendChild(lbval);


        var daylight_hold = document.createElement("div");
        daylight_hold.className = "daylighthold";
        statleft.appendChild(daylight_hold);


        if(fixture.daylightlimited) {
            var image = document.createElement("img");
            image.src = "images/sun_1.gif";
            image.style.marginTop = "5px";
            image.width = "40";
            image.height = "40";
            daylight_hold.appendChild(image);
        }

        var image = document.createElement("img");
        image.src = fixture.image; //"fixtureimg/1.jpg";
        image.width = "100";
        image.height = "100";
        image_hold.appendChild(image);

        if(fixture.type == "on_off" || fixture.type == "dim") {
            var trim = Number(fixture.level).toFixed(0);
            constructDimmableIndicators(statright, trim);
        }
        else if(fixture.type == "cct") {

            var trim = Number(fixture.brightness).toFixed(0);
            constructColorTempIndicators(statright, trim, fixture.colortemp, fixture.min, fixture.max);
        }
        else if(fixture.type == "rgb") {

            var trimr = Number(fixture.red).toFixed(0);
            var trimg = Number(fixture.green).toFixed(0);
            var trimb = Number(fixture.blue).toFixed(0);
            constructRGBndicators(statright, trimr, trimg, trimb);
        }
        else if(fixture.type == "rgbw") {

            var trimr = Number(fixture.red).toFixed(0);
            var trimg = Number(fixture.green).toFixed(0);
            var trimb = Number(fixture.blue).toFixed(0);
            var trimw = Number(fixture.white).toFixed(0);
            constructRGBWndicators(statright, trimr, trimg, trimb, trimw);
        }
        else if(fixture.type == "rgbwwcw") {

            var trimr = Number(fixture.red).toFixed(0);
            var trimg = Number(fixture.green).toFixed(0);
            var trimb = Number(fixture.blue).toFixed(0);
            var trimww = Number(fixture.warmwhite).toFixed(0);
            var trimcw = Number(fixture.coldwhite).toFixed(0);
            constructRGBWWCWndicators(statright, trimr, trimg, trimb, trimww, trimcw);
        }

    }
}


function constructDimmableIndicators(parentdiv, brightpct)
{
    constructBasicLevelIndicator(parentdiv,100,190,brightpct,"level_bar", brightpct+"%");
}

function constructColorTempIndicators(parentdiv, brightpct, colortemplevel, ctempmin, ctempmax)
{
    constructBasicLevelIndicator(parentdiv,50,190,brightpct,"level_bar", brightpct+"%");
    // calc ctemp as pct
    var min = Number(ctempmin);
    var max = Number(ctempmax);
    var range = max-min;
    var barval2 = ((Number(colortemplevel) - min)/range) * 100;
    constructBasicLevelIndicator(parentdiv,50,190,barval2,"color_temp_bar", colortemplevel+"K");
}



function constructRGBndicators(parentdiv, red, green, blue)
{
    constructBasicLevelIndicator(parentdiv,20,190,red,"red_bar", red);
    constructBasicLevelIndicator(parentdiv,20,190,green,"green_bar", green);
    constructBasicLevelIndicator(parentdiv,20,190,blue,"blue_bar", blue);
}

function constructRGBWndicators(parentdiv, red, green, blue, white)
{
    constructBasicLevelIndicator(parentdiv,20,190,red,"red_bar", red);
    constructBasicLevelIndicator(parentdiv,20,190,green,"green_bar", green);
    constructBasicLevelIndicator(parentdiv,20,190,blue,"blue_bar", blue);
    constructBasicLevelIndicator(parentdiv,20,190,white,"white_bar", white);
}

function constructRGBWWCWndicators(parentdiv, red, green, blue, warmwhite, coldwhite)
{
    constructBasicLevelIndicator(parentdiv,20,190,red,"red_bar", red);
    constructBasicLevelIndicator(parentdiv,20,190,green,"green_bar", green);
    constructBasicLevelIndicator(parentdiv,20,190,blue,"blue_bar", blue);
    constructBasicLevelIndicator(parentdiv,20,190,warmwhite,"warmwhite_bar", warmwhite);
    constructBasicLevelIndicator(parentdiv,20,190,coldwhite,"coldwhite_bar", coldwhite);
}


function constructBasicLevelIndicator(parentdiv, width, height, pct, barclass, labelval )
{
    // main wrapper is 200px,
    // level holder is 190 px high,
    var holder = document.createElement("div");
    holder.className = "level_holder";
    holder.style.width =  width+"px";
    holder.style.height =  height+"px";
    parentdiv.appendChild(holder);

    var bar = document.createElement("div");
    bar.className = barclass;
    var bar_height = height-20;
    bar.style.height =  bar_height+"px";  //
    holder.appendChild(bar);

    var label = document.createElement("div");
    label.className = "level_label";
    label.style.width = width+"px";
    holder.appendChild(label);

    var lbval = document.createElement("label");
    lbval.innerHTML = labelval;
    label.appendChild(lbval);

    var mark = document.createElement("div");

    var mark_class = "level_mark";
    if(barclass == "red_bar" || barclass =="green_bar" || barclass == "blue_bar" || barclass == "warmwhite_bar" || barclass == "coldwhite_bar")
       mark_class = "level_mark_white";


    mark.className = mark_class; //"level_mark";
    var bla = bar_height - ((pct * bar_height)/ 100);
    mark.style.marginTop =  bla + "px"; //"90px";  //set level mark,, calc. based on 150 tall,
    mark.style.width =  width+"px";
    bar.appendChild(mark);


}

