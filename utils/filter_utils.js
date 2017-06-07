/**
 * Created by Nick on 12/19/2016.
 */

var path = require('path');
var pad = require('pad');
var TAG = pad(path.basename(__filename),15);

function FCLookupTable (Zero2TenInputVolts) {

    if(Zero2TenInputVolts == undefined)
        return undefined;

    // takes in 0-10V and returns a FC reading
    // This is a calibration table populated by factory or in field.
    // At known FC readings (external instrument) the 0-10V is captured and then the two datapoints (voltage,FC) added to this array
    //console.log ("Zero2TenInput was ", Zero2TenInputVolts);
    // table needs to be in ascending (0-10V levels);  FC readings will be descending.
    // FC readings need be mapped to 0,10,20,30,40,50
    var Zero2TenLevels =    [
        [0.0,50],
        [1.5,50],
        [2.3,50],
        [3.1,40],
        [4.9,40],
        [5.7,30],
        [6.1,20],
        [7.2,20],
        [8.5,10],
        [9.3,10]
    ];

    //  These are 10 points of calibration.  Factory defaults above but can be field calibrated
    var FCreading = 10;		// default is "darkest"
    for (var dimIndex = 0; dimIndex < Zero2TenLevels.length; dimIndex++) {
        if (Zero2TenInputVolts >= Zero2TenLevels[dimIndex][0]) {
            FCreading = Zero2TenLevels[dimIndex][1];        // This will continually get reassigned until input level > the 0-10 level in array

        }
    }

    return FCreading;
}

var currentstate = 'Occupied'; // moved here 2/28/17,

/* This function will take the various types of requestors and pass back the adjusted dim level incorporating daylight settings, occ/vac settings, manually set floors and ceilings etc.  This function ASSUMES:
 - That ONLY an intensity lwvwl is passed to it.  No `color temp slider is passed
 - any errors then output level = UserLevelRequested
 - ZoneRequested is used as an offset into the config array for that setting;
 - CurrentDaylightLimits is an array with the limit set by the Daylight sensor.
 - Daylight level is read each time a request is made so no state need be saved.  This function will look at the current 0-10 level; map to a FC reading and then Look at the action defined in the configArray on how to respond

 // There is a periodic timer that will periodically ask to set the light level to its last user requested value to force a reassesment
 // Anytime anyone makes a call to this function daylight levels will always be re-evaluated
 // a return of -1 indicates "ignore"; used when that the requestor is accessing a zone that is supposed to ignore ingnore.  Examples are
 occupancy message from sensor when in "vacancy mode" or wallstation request when it is masked, or daylight request to a zone not in daylight
 It is very important that daylight requests are ignored when a room has gone vacant.  Vacancy settings supercede daylight polling.

 */


module.exports = {

    /***
     *
     */
    LightLevelFilter: function  (RequestType,UserLevelRequestedPCT,fixtureparams, DaylightZerotoTenValueVolts) {

        if (RequestType == undefined)                  { global.applogger.error (TAG, "RequestType is undefined to LightLevelFilter", "");   }
        if (fixtureparams == undefined)                { global.applogger.error(TAG,"fixtureparams is undefined to LightLevelFilter", "");   }
        if (DaylightZerotoTenValueVolts == undefined)  { global.applogger.info(TAG,"DaylightZerotoTenValueVolts is undefined (NO DL SENSOR PRESENT)" ,"");   }

        if(global.loghw.lightfilter)
            global.applogger.info (TAG, "LightLevelFilter", "  The requested level UserLevelRequestedPCT in is: " + UserLevelRequestedPCT);

        var returndataobj = {};
        returndataobj.modifiedlevel = UserLevelRequestedPCT;
        returndataobj.isdaylightlimited = false;

        var maxModifiedLevel, daylightModifiedLevel;	// maxM.. is the "min of maxes", daylight... is what is set by daylight engine
        var ModifiedLevel = UserLevelRequestedPCT;  // start mod level at the requested level from user...

        // if not override,  go through the dl logic,
        //if(RequestType != "override") {

        var currentDaylightLevel = FCLookupTable(DaylightZerotoTenValueVolts);

        if(currentDaylightLevel == undefined)  // if no dl sensor. set ceiling to 100, else calc based on params,, if any,
            CurrentDaylightCeiling = 100;
        else {
            // This needs to connect to the 0-10V level assigned for the daylight sensor.
            // if(global.loghw.lightfilter)
            //   global.log.info("filter_utils.js ", "LightLevelFilter ","Requested Level PCT:  " + UserLevelRequestedPCT + "    Daylight volts: " + DaylightZerotoTenValueVolts + "   Daylight (FC) calculated to: " + currentDaylightLevel );

            switch (currentDaylightLevel) {

                case 50:
                    CurrentDaylightCeiling = fixtureparams.resptodl50;
                    break;
                case 40:
                    CurrentDaylightCeiling = fixtureparams.resptodl40;
                    break;
                case 30:
                    CurrentDaylightCeiling = fixtureparams.resptodl30;
                    break;
                case 20:
                    CurrentDaylightCeiling = fixtureparams.resptodl20;
                    break;
                case 10:
                    CurrentDaylightCeiling = fixtureparams.resptodl10;
                    break;
                case 0:
                    CurrentDaylightCeiling = fixtureparams.resptodl0;
                    break;
                default:
                    CurrentDaylightCeiling = 100; //96.4;

                    if (global.loghw.lightfilter)
                        global.applogger.info(TAG, "LightLevelFilter ", "    The Daylight celling for fixture uid: " + fixtureuid, "was set to " + CurrentDaylightCeiling);

                    break;
            }
        }

        // handle ignore case. ,  from above calc,  user may have setup range to ignroe,  which defualts i back  to 100%
        if (CurrentDaylightCeiling < 0) {
            CurrentDaylightCeiling = 100;
        }

        var daylightceiling_mod, manualceiling_mod;

        // calc daylight ceiling and manual ceiling,...values.
        if (fixtureparams.daylightceiling < 0) {daylightceiling_mod = 100} else {daylightceiling_mod = fixtureparams.daylightceiling};
        if (fixtureparams.manualceiling < 0) {manualceiling_mod = 100} else {manualceiling_mod = fixtureparams.manualceiling};


        var maxModifiedLevel = Math.min (UserLevelRequestedPCT, CurrentDaylightCeiling, daylightceiling_mod, manualceiling_mod);

        if(global.loghw.lightfilter)
            global.applogger.info (TAG, "LIGHTLEVELFILTER" , "   The maxModifiedLevel is " + maxModifiedLevel + "  UserLevelRequestedPCT is " + UserLevelRequestedPCT);


        if (maxModifiedLevel < 0 ){
            global.applogger.error(TAG, "LightLevelFilter ", "ERROR: Config error in trim settings");
        }
        if (maxModifiedLevel == "undefined" ){
            global.applogger.error(TAG, "LightLevelFilter ", "ERROR: maxModifiedLevel is UNDEFINED");
        }

        if (UserLevelRequestedPCT > maxModifiedLevel)
        {
            returndataobj.isdaylightlimited = true;
        }

        var daylightfloor_mod, manualfloor_mod;
        if (fixtureparams.daylightfloor < 0) {daylightfloor_mod = 0} else {daylightfloor_mod = fixtureparams.daylightfloor};
        if (fixtureparams.manualfloor < 0) {manualfloor_mod = 0} else {manualfloor_mod = fixtureparams.manualfloor};

        // calc the max between the whats allowed by dl, fixutre param settings, and what came out of the min calc above
        daylightModifiedLevel = Math.max (maxModifiedLevel, daylightfloor_mod, manualfloor_mod);
        if (daylightModifiedLevel < 0){
            global.applogger.error(TAG, "LightLevelFilter ", "   ERROR: Config error in trim settings" );
        }

        OccupiedLevel = fixtureparams.resptoocc;
        VacancyLevel = fixtureparams.resptovac;
     	// indicates if the current room is Occupied or Vacant.  Currently binary but leaves room for additional states
        switch (RequestType) {
            case 'override':
                ModifiedLevel = UserLevelRequestedPCT;
                currentstate = 'Occupied';
                break;
            case 'wallstation':   // this covers level inputs (0-10V),
                currentstate = 'Occupied';
                ModifiedLevel = daylightModifiedLevel;
                break;
            case 'daylight':
                if (currentstate == 'Occupied')
                {

                    ModifiedLevel = daylightModifiedLevel;
                    global.applogger.info(TAG, "**** state dl - and occupied  ml = ", ModifiedLevel);
                }	// Only adjust daylight if occupied
                else {
                    ModifiedLevel = VacancyLevel;
                }			// ignore if Vacant
                break;
            case 'occupancy':
                ModifiedLevel = OccupiedLevel;

                if(global.loghw.lightfilter)
                    global.applogger.info(TAG, "Recieved an Occupancy Request ", OccupiedLevel);

                currentstate = 'Occupied';
                break;
            case 'vacancy':
                ModifiedLevel = VacancyLevel;
                currentstate = 'Vacant';

                break;
           // case 'schedule':
           //     ModifiedLevel = UserLevelRequestedPCT;
           //     break;
           // case 'wetdrycontact':
           //     ModifiedLevel = UserLevelRequestedPCT;
          //      currentstate = 'Occupied';
          //      break;
           // case 'zero2teninput':
            //    currentstate = 'Occupied';
            //    break;
            default:
                ModifiedLevel = UserLevelRequestedPCT;
                global.applogger.error(TAG, "LightLevelFilter ", "   ERROR: That requst type was not found "+ RequestType );

                break;

        }

        if(global.loghw.lightfilter)
        {
            global.applogger.info(TAG, "LightLevelFilter ","*****************************************************************") ;
            global.applogger.info(TAG, "LightLevelFilter ","Request: " + RequestType + " occ state: " + currentstate   + "    Req PCT:  " + UserLevelRequestedPCT + "  DL(V): " + DaylightZerotoTenValueVolts + "  DL(FC): " + currentDaylightLevel) ;
            global.applogger.info(TAG, "LightLevelFilter ","DL-Mod: " + daylightModifiedLevel + " MaxMod: " + maxModifiedLevel + "  Fix DL ceiling:  " + CurrentDaylightCeiling + "   Modified Level: " + ModifiedLevel);
        }
        returndataobj.modifiedlevel = ModifiedLevel;
        return returndataobj;

    },


    PowerCalibrationLookup: function  (requestedinputlevel,ZoneRequested) {
        /* requestedinput is a 0-100% number that in an ideal world maps to the PWM % level.  However many fixtures are non linear.
         // This table will map a desired level to a power measured output level so that there is a 1:1 correlation between desired level and power consumption (measurable) .  This will be most typically used with 0-10V outputs since the power response is often non linear
         // input range is -1, 0.0 to 100.0 %  -1 means ignore request
         */
        return requestedinputlevel;
    },


    /***
     *
     * @param min
     * @param max
     * @param DesiredColorTemp  -- color temp as in 2000, 3500,..etc
     * @param DesiredIntensityPCT -- pct value 0 -- 100,
     * @param CandleDim -- not sued currently ,  future.
     * @returns {*[]}
     * @constructor
     */
    CalculateCCTAndDimLevels: function  (min, max, DesiredColorTemp,DesiredIntensityPCT,CandleDim) {
        //var DesiredColorTemp;		// DCT is 3000 to 5000 K with any integer inbetween.
        var DesiredIntensityNum = Number(DesiredIntensityPCT*0.01); 		//Desired intensity is 0.0-100.0% 0.01 because desired intensity is passed as percent
        var DimToWarm;	// True/False
        var WarmestCCT = Number(min); //3000;		// this may be 2700 - depends on hardware
        var CoolestCCT = Number(max); //5000;		// This may be 6000 - depends on hardware
        var Multiplier = Number(100/(CoolestCCT-WarmestCCT));	// Divides the spread into 100 segments.
        //var WarmToDimFactor;
        var ModifiedDesiredColorTemp = Number(DesiredColorTemp);
        //var IntensityScale = Number(Math.round(DesiredIntensityPCT/10));


        if (CandleDim) {
            ModifiedDesiredColorTemp = Number( Number(WarmestCCT) + Number(DesiredIntensityNum*(DesiredColorTemp - WarmestCCT)));
        }
        var CoolWhiteLevel = Math.round (DesiredIntensityNum * Multiplier * (ModifiedDesiredColorTemp-WarmestCCT) );
        var WarmWhiteLevel = Math.round (DesiredIntensityNum * Multiplier * (CoolestCCT - ModifiedDesiredColorTemp) );

        if(global.loghw.colortemp) {
            global.applogger.info("filter_utils.js ", "CalculateCCTAndDimLevels ", "INPUT:  min: "+ min + " max: " + max + "  desiredctemp: " + DesiredColorTemp + "  desiredIntensity: " + DesiredIntensityPCT + " cdmin: " + CandleDim);
            global.applogger.info("filter_utils.js ", "CalculateCCTAndDimLevels ", "Cool White Level: "+ CoolWhiteLevel +  "  Warm White Level: " + WarmWhiteLevel);
            // console.log("Cool White Level is: ", CoolWhiteLevel);
            // console.log("Warm White Level is: ", WarmWhiteLevel);
        }
        var WarmCoolLevels = [WarmWhiteLevel,CoolWhiteLevel];
        return WarmCoolLevels;
    }

// end of exports.
};