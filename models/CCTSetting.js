/**
 * Created by Nick on 3/6/2017.
 */

var CCTSetting = function()
{
    this.name = "";
    this.type = "cct";
    this.colortemp = "3500";
    this.brightness = "100";

    CCTSetting.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    CCTSetting.prototype.create = function(name, colortemp, brightness)
    {
        this.name = name;
        this.colortemp = colortemp;
        this.brightness = brightness;
    }
};

module.exports = CCTSetting;

