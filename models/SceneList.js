/**
 * Created by Nick on 3/6/2017.
 */

var SceneList = function()
{
    this.name = "";
    this.scenes = []; // name list,

    //status:
    this.activeindex = 0;

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

    this.incrementActiveIndex = function()
    {
        this.activeindex++;
        if(this.activeindex > this.scenes.length-1)
        {
            this.activeindex = 0;
        }

    }

    this.decrementActiveIndex = function()
    {
        this.activeindex--;
        if(this.activeindex < 0)
        {
            if(this.scenes.length > 0)
                this.activeindex = this.scenes.length-1;
            else
                this.activeindex = 0;
        }

    }

    this.getActiveSceneName = function()
    {
        if(this.scenes.length > 0 && this.activeindex < this.scenes.length)
        {
            return this.scenes[this.activeindex];
        }
        return undefined;
    }
};

module.exports = SceneList;

