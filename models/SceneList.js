/**
 * Created by Nick on 3/6/2017.
 */

var SceneList = function()
{
    this.name = "";
    this.scenes = []; // name list,

    SceneList.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    SceneList.prototype.create = function(name)
    {
        this.name = name;
    }
};

module.exports = SceneList;

