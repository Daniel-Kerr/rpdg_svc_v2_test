/**
 * Created by Nick on 3/6/2017.
 */

var DimSetting = function()
{
    this.name = "";
    this.type = "dim";
    this.level = "100";
    DimSetting.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    DimSetting.prototype.create = function(name,level)
    {
        this.name = name;
        this.level = level;
    }
};

module.exports = DimSetting;

