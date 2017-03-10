/**
 * Created by Nick on 3/6/2017.
 */

var FixtureParameters = function()
{
    this.dimoptions = 0;
    this.dimrate=0;
    this.brightenrate=0;
    this.resptooc=-1;
    this.resptovac=-1;
    this.resptodl50=-1;
    this.resptodl40=-1;
    this.resptodl30=-1;
    this.resptodl20=-1;
    this.resptodl10=-1;
    this.resptodl0=-1;
    this.daylightceiling = -1;
    this.manualceiling=-1;
    this.daylightfloor=-1;
    this.manualfloor=-1;


    FixtureParameters.prototype.fromJson = function(obj)
    {
        for (var prop in obj) {
            this[prop] = obj[prop];
        }
    }

};

module.exports = FixtureParameters;

