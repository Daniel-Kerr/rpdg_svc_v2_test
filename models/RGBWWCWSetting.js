/**
 * Created by Nick on 3/6/2017.
 */

var RGBWWCWSetting = function()
{
    this.name = "";
    this.type = "rgbwwcw";
    this.red = "100";
    this.green = "100";
    this.blue = "100";
    this.warmwhite = "100";

    RGBWWCWSetting.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    RGBWWCWSetting.prototype.create = function(name, red, green, blue, warmwhite, coldwhite)
    {
        this.name = name;
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.warmwhite = warmwhite;
        this.coldwhite = coldwhite;
    }
};

module.exports = RGBWWCWSetting;

