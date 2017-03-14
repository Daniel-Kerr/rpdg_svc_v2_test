/**
 * Created by Nick on 3/6/2017.
 */

var RGBWSetting = function()
{
    this.name = "";
    this.type = "rgbw";
    this.red = "";
    this.green = "";
    this.blue = "";
    this.white = "";

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

