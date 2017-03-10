/**
 * Created by Nick on 3/6/2017.
 */

var Group = function()
{
    this.name = "";
    this.type = "";
    this.fixtures = []; // name list,

    Group.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

    Group.prototype.create = function(name, type)
    {
        this.name = name;
        this.type = type;
    }
};

module.exports = Group;

