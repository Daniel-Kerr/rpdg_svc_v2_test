/**
 * Created by Nick on 3/6/2017.
 */

var OnOffSetting = function()
{
    this.name = "";
    this.type = "on_off";
    this.level = "";

    OnOffSetting.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    OnOffSetting.prototype.create = function(name, level)
    {
        this.name = name;
        this.level = level;
    }
};

module.exports = OnOffSetting;

