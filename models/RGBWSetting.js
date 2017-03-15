/**
 * Created by Nick on 3/6/2017.
 */

var RGBWSetting = function()
{
    this.name = "";
    this.type = "rgbw";
    this.red = "100";
    this.green = "100";
    this.blue = "100";
    this.white = "100";

    RGBWSetting.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    RGBWSetting.prototype.create = function(name, red, green, blue, white)
    {
        this.name = name;
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.white = white;
    }
};

module.exports = RGBWSetting;

