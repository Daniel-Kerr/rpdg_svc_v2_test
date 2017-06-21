/**
 * Created by Nick on 3/6/2017.
 */

var RGBSetting = function()
{
    this.name = "";
    this.type = "rgb";
    this.red = "100";
    this.green = "100";
    this.blue = "100";

    RGBSetting.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    RGBSetting.prototype.create = function(name, red, green, blue, white)
    {
        this.name = name;
        this.red = red;
        this.green = green;
        this.blue = blue;
    }
};

module.exports = RGBSetting;

