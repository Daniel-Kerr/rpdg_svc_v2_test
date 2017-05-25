/**
 * Created by Nick on 1/15/2017.
 */

//var express = require('express');
var path = require("path");
var fs = require('fs');
var moment = require('moment');
var os = require( 'os' );
var Ajv = require('ajv');

var file_scenes = '../datastore/scenes.json'; // scenes file
var file_config = '../datastore/config.json';


function createBlankFile(filepath)
{
    var target = path.resolve(filepath);
    var blank = [];
    var output = JSON.stringify(blank, null, 4);
    fs.writeFileSync(target, output);
}

module.exports = {

    intToByteArray: function ( n ) {

        var result = [ ];
        var mask = 255;
        var lsb = n & mask;
        var msb = (n >> 8) & mask;

        if(n < 255)
            msb = 0;

        result.push(msb);
        result.push(lsb);
        //console.log("int convert " + n  + "  to bytes: " + result[0] + "   " + result[1]);
        return result;
    },
    commandLineArgPresent: function(arg)
    {
        if(process.argv.length > 0)
        {
            for(var i = 0; i < process.argv.length; i++)
            {
                var argval = process.argv[i];
                if(argval.includes(arg))
                {
                    return true;
                }
            }
        }
        return false;
    },
    appendInputObjectLogFile: function(objectname, datanew)
    {
        try {
            var objectpath = '../datastore/object_logs/input/'+ objectname + '.json';
            var target = path.resolve(objectpath);
            var output = JSON.stringify(datanew)+'\n';
            fs.appendFileSync(target, output, 'utf-8');
        }catch (ex1)
        {
            global.applogger.info(TAG, " error writing file " + ex1, "");
        }
    },
    appendOutputObjectLogFile: function(objectname, datanew)
    {
        try {
            var objectpath = '../datastore/object_logs/output/'+ objectname + '.json';
            var target = path.resolve(objectpath);
            var output = JSON.stringify(datanew)+'\n';
            fs.appendFileSync(target, output, 'utf-8');
        }catch (ex1)
        {
            global.applogger.info(TAG, " error writing file " + ex1, "");
        }
    },

    testReadObjectLogFile: function(objectname)
    {
        try {
            var objectpath = '../datastore/object_logs/'+ objectname + '.json';
            var target = path.resolve(objectpath);
            if (fs.existsSync(target)) {

                var lineReader = require('readline').createInterface({
                    input: require('fs').createReadStream(target)
                });

                lineReader.on('line', function (line) {
                    console.log('Line from file:', line);
                    var testobj = JSON.parse(line);
                });
            }
        }catch (ex1)
        {
            global.applogger.info(TAG, " error reading file " + ex1, "");
        }
    },

    getSceneNamesFromObjList: function(list)
    {
        var names = [];
        names.push("----");
        if(list != undefined)
        {
            for(var i = 0; i < list.length; i++)
            {
                var scenename = list[i].name;
                names.push(scenename);
            }
        }

        return names;
    },
    getSceneNameListFromFile: function()
    {
        var names = [];
        names.push("----");
        var scenelist = this.getSceneListFromScenesFile();
        if(scenelist != undefined)
        {
            for(var i = 0; i < scenelist.length; i++)
            {
                var scenename = scenelist[i].name;
                names.push(scenename);
            }
        }

        return names;
    },
    writeSceneFileWithList: function(scenelist)
    {
        if(global.test_mode)
        {
            global.test_scenelist = scenelist;
        }
        else {
            var target = path.resolve(file_scenes);
            var output = JSON.stringify(scenelist, null, 4);
            fs.writeFile(target, output, function (err) {
                if (err) {
                    console.log(err);
                }
                else
                    console.log("The file was saved!");
            });
        }
    },
    getSceneListFromScenesFile: function() {
        if (global.test_mode) {
            return global.test_scenelist;
        }
        else {

            var target = path.resolve(file_scenes);
            var listupdated = false;
            try {
                var stats = fs.statSync(target);
                if (stats.isFile()) {
                    var contents = fs.readFileSync(target, 'utf8');
                    if (contents.length > 0) {
                        var mastercenelist = JSON.parse(contents);
                        return mastercenelist;
                    }
                }
            }
            catch (err) {
            }
        }
        return;
    },
    getVersionFromFile: function() {
        var target = path.resolve("version.txt");
        try {
            var stats = fs.statSync(target);
            if (stats.isFile()) {
                var contents = fs.readFileSync(target, 'utf8');
                if (contents.length > 0) {
                    // var mastercenelist = JSON.parse(contents);
                    return contents;
                }
            }
        }
        catch (err) {
        }
        return "???";
    },
    getSceneObjDataByName: function(scenename)
    {
        var slist = this.getSceneListFromScenesFile();
        for(var i = 0; i < slist.length; i++)
        {
            var chkname = slist[i].name;
            if(chkname == scenename)
            {
                return slist[i];
            }
        }
        return '';
    },
    writeConfigToFile: function()
    {
        var target = path.resolve(file_config);

        /* if(data.version == undefined)
         data.version = 0;
         else
         {
         if(data.version < global.currentconfig.version)
         return undefined;
         data.version++;
         }*/
        var output = JSON.stringify(global.currentconfig, null, 4);
        fs.writeFile(target, output, function (err) {
            if (err) {
                console.log(err);
            }
            else
                console.log("The file was saved!");
        });

        //return data;
    },

    writeConfigToFile2: function(cfg)
    {
        var target = path.resolve(file_config);

        var output = JSON.stringify(cfg, null, 4);
        fs.writeFile(target, output, function (err) {
            if (err) {
                console.log(err);
            }
            else
                console.log("The file was saved!");
        });

        //return data;
    },

    getConfigFromFile: function() {
        var target = path.resolve(file_config);
        try {
            var stats = fs.statSync(target);
            if (stats.isFile()) {
                var contents = fs.readFileSync(target, 'utf8');
                if (contents.length > 0) {
                    var mastercenelist = JSON.parse(contents);
                    return mastercenelist;
                }
            }
        }
        catch (err) {
        }
        return;

    },
    getGroupObjByName: function(groupname) {
        for(var i = 0; i < global.currentconfig.groups.length; i++)
        {
            var group = global.currentconfig.groups[i];
            if(group.name == groupname)
            {
                return group
            }
        }
        return undefined;
    },
    getFixtureObjByUID: function(uid) {

        global.log.info("data_utils.js ", "getFixtureObjByUID :",  "searching for fixture: " + uid);
        for(var i = 0; i < global.currentconfig.fixtures.length; i++)
        {

            var fix = global.currentconfig.fixtures[i];
            global.log.info("data_utils.js ", "getFixtureObjByUID :",  "found: " + fix.uid);

            if(fix.uid == uid)
            {

                return fix
            }
        }
        return undefined;
    },
    generateErrorMessage: function(message) {
        var msgobj = {};
        msgobj.error = message;
        return msgobj;
    },
    generateFauxDataSeries: function()  {

       // global.log.info("data_utils.js ", " &&&&&&&&&&&&&&&&&&& GEN DATA *****************************",  "");
        //test code to generate a pho data file.
        var dt = moment('04-15-2017', 'MM-DD-YYYY');
        var dim1level = 0;
        var occ_sensorlevel = 0;
        var daylightlevel = 0;

        var rampdim = true;
        var index_mark = 1000;
        for(var i = 0 ; i < 20000; i++) {
       // while(true) {

            var dim1 = {};
            dim1.date = dt.toISOString();
            dim1.level = dim1level;
            module.exports.appendOutputObjectLogFile("dim1", dim1);

            var occ_sensor = {};
            occ_sensor.date = dt.toISOString();
            occ_sensor.value = occ_sensorlevel;
            module.exports.appendInputObjectLogFile("occ_sensor",occ_sensor);

            var daylight = {};
            daylight.date = dt.toISOString();
            daylight.value = daylightlevel;
            module.exports.appendInputObjectLogFile("daylight",daylight);


            // OCC
            if ((i > 200 && i < 207)  ||  (i > 335 && i < 337) || (i > 550 && i < 552) || (i > 750 && i < 756)  || (i > 900 && i < 903)
                || (i > 1002 && i < 1005)  || (i > 1007 && i < 1009) || (i > 1240 && i < 1243)
                || (i > 2000 && i < 2010)  || (i > 3200 && i < 3206) || (i > 4300 && i < 4310) ) {

                occ_sensorlevel = 100;
            }
            else
            {
                occ_sensorlevel = 0;
            }

            // saw tooth.


            if(dim1level < 100 && i < index_mark)
                dim1level+= 1;
            else if(dim1level == 100 && i < index_mark)
            {
                index_mark = i;
            }
            else if(i > index_mark + 200 && dim1level > 0)
            {
                dim1level-= 1;
            }
            else if (dim1level == 0)
                index_mark = 30000; //reset



            // DAYLIGHT, ... dim2 *******************
            var rampup = false;
            if ((i > 200 && i < 280)  || (i > 750 && i < 900) || (i > 1345 && i < 1673) ||
                (i > 3400 && i < 3500)  || (i > 4100 && i < 4300)) {
                rampup = true;
            }

            if (rampup)
            {
                if(daylightlevel < 100)
                    daylightlevel += 1;
            }
            else if(daylightlevel > 0)
            {
                daylightlevel -=1;
            }

            dt = dt.add(10, "minutes");


            if(dt.isAfter(new moment())) {

                break;
            }
        }

    },
    validateConfigData: function (data) {


        var schema = {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "object",
            "properties": {
                "version": {
                    "type": "integer"
                },
                "fixtures": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "assignment": {
                                "type": "array",
                                "items": {
                                    "type": "integer"
                                }
                            },
                            "name": {
                                "type": "string"
                            },
                            "uid": {
                                "type": "string"
                            },
                            "type": {
                                "type": "string"
                            },
                            "globalgroups": {
                                "type": "integer"
                            },
                            "localgroups": {
                                "type": "string"
                            },
                            "status": {
                                "type": "integer"
                            },
                            "image": {
                                "type": "string"
                            },
                            "zero2teninputs": {
                                "type": "array",
                                "items": {}
                            },
                            "contactinputs": {
                                "type": "array",
                                "items": {}
                            },
                            "candledim": {
                                "type": "boolean"
                            },
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "dimoptions": {
                                        "type": "string"
                                    },
                                    "dimrate": {
                                        "type": "string"
                                    },
                                    "brightenrate": {
                                        "type": "string"
                                    },
                                    "resptoocc": {
                                        "type": "string"
                                    },
                                    "resptovac": {
                                        "type": "string"
                                    },
                                    "resptodl50": {
                                        "type": "string"
                                    },
                                    "resptodl40": {
                                        "type": "string"
                                    },
                                    "resptodl30": {
                                        "type": "string"
                                    },
                                    "resptodl20": {
                                        "type": "string"
                                    },
                                    "resptodl10": {
                                        "type": "string"
                                    },
                                    "resptodl0": {
                                        "type": "string"
                                    },
                                    "daylightceiling": {
                                        "type": "string"
                                    },
                                    "manualceiling": {
                                        "type": "string"
                                    },
                                    "daylightfloor": {
                                        "type": "string"
                                    },
                                    "manualfloor": {
                                        "type": "string"
                                    }
                                },
                                "required": [
                                    "dimoptions",
                                    "dimrate",
                                    "brightenrate",
                                    "resptoocc",
                                    "resptovac",
                                    "resptodl50",
                                    "resptodl40",
                                    "resptodl30",
                                    "resptodl20",
                                    "resptodl10",
                                    "resptodl0",
                                    "daylightceiling",
                                    "manualceiling",
                                    "daylightfloor",
                                    "manualfloor"
                                ]
                            }
                        },
                        "required": [
                            "assignment",
                            "name",
                            "uid",
                            "type",
                            "globalgroups",
                            "localgroups",
                            "status",
                            "image",
                            "zero2teninputs",
                            "contactinputs",
                            "candledim",
                            "parameters"
                        ]
                    }
                },
                "inputcfg": {
                    "type": "object",
                    "properties": {
                        "zero2ten": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "contact": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {
                                        "type": "string"
                                    },
                                    "type": {
                                        "type": "string"
                                    },
                                    "subtype": {
                                        "type": "string"
                                    },
                                    "inputnum": {
                                        "type": "string"
                                    },
                                    "active_action": {
                                        "type": "string"
                                    },
                                    "inactive_action": {
                                        "type": "string"
                                    }
                                },
                                "required": [
                                    "name",
                                    "type",
                                    "subtype",
                                    "inputnum",
                                    "active_action",
                                    "inactive_action"
                                ]
                            }
                        }
                    },
                    "required": [
                        "zero2ten",
                        "contact"
                    ]
                },
                "outputcfg": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "groups": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string"
                            },
                            "type": {
                                "type": "string"
                            },
                            "fixtures": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            }
                        },
                        "required": [
                            "name",
                            "type",
                            "fixtures"
                        ]
                    }
                }
            },
            "required": [
                "version",
                "fixtures",
                "inputcfg",
                "outputcfg",
                "groups"
            ]
        }



        var schema_test_mode = {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "object",
            "properties": {
                "version": {
                    "type": "integer"
                },
                "fixtures": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "assignment": {
                                "type": "array",
                                "items": {
                                    "type": "integer"
                                }
                            },
                            "name": {
                                "type": "string"
                            },
                            "uid": {
                                "type": "string"
                            },
                            "type": {
                                "type": "string"
                            },
                            "globalgroups": {
                                "type": "integer"
                            },
                            "localgroups": {
                                "type": "string"
                            },
                            "status": {
                                "type": "integer"
                            },
                            "image": {
                                "type": "string"
                            },
                            "zero2teninputs": {
                                "type": "array",
                                "items": {}
                            },
                            "contactinputs": {
                                "type": "array",
                                "items": {}
                            },
                            "candledim": {
                                "type": "boolean"
                            },
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "dimoptions": {
                                        "type": "string"
                                    },
                                    "dimrate": {
                                        "type": "string"
                                    },
                                    "brightenrate": {
                                        "type": "string"
                                    },
                                    "resptoocc": {
                                        "type": "string"
                                    },
                                    "resptovac": {
                                        "type": "string"
                                    },
                                    "resptodl50": {
                                        "type": "string"
                                    },
                                    "resptodl40": {
                                        "type": "string"
                                    },
                                    "resptodl30": {
                                        "type": "string"
                                    },
                                    "resptodl20": {
                                        "type": "string"
                                    },
                                    "resptodl10": {
                                        "type": "string"
                                    },
                                    "resptodl0": {
                                        "type": "string"
                                    },
                                    "daylightceiling": {
                                        "type": "string"
                                    },
                                    "manualceiling": {
                                        "type": "string"
                                    },
                                    "daylightfloor": {
                                        "type": "string"
                                    },
                                    "manualfloor": {
                                        "type": "string"
                                    }
                                },
                                "required": [
                                    "dimoptions",
                                    "dimrate",
                                    "brightenrate",
                                    "resptoocc",
                                    "resptovac",
                                    "resptodl50",
                                    "resptodl40",
                                    "resptodl30",
                                    "resptodl20",
                                    "resptodl10",
                                    "resptodl0",
                                    "daylightceiling",
                                    "manualceiling",
                                    "daylightfloor",
                                    "manualfloor"
                                ]
                            }
                        },
                        "required": [
                            "assignment",
                            "name",
                            "uid",
                            "type",
                            "globalgroups",
                            "localgroups",
                            "status",
                            "image",
                            "zero2teninputs",
                            "contactinputs",
                            "candledim",
                            "parameters"
                        ]
                    }
                },
                "inputcfg": {
                    "type": "object",
                    "properties": {
                        "zero2ten": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "contact": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {
                                        "type": "string"
                                    },
                                    "type": {
                                        "type": "string"
                                    },
                                    "subtype": {
                                        "type": "string"
                                    },
                                    "inputnum": {
                                        "type": "string"
                                    },
                                    "active_action": {
                                        "type": "string"
                                    },
                                    "inactive_action": {
                                        "type": "string"
                                    }
                                },
                                "required": [
                                    "name",
                                    "type",
                                    "subtype",
                                    "inputnum",
                                    "active_action",
                                    "inactive_action"
                                ]
                            }
                        }
                    },
                    "required": [
                        "zero2ten",
                        "contact"
                    ]
                },
                "outputcfg": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "groups": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string"
                            },
                            "type": {
                                "type": "string"
                            },
                            "fixtures": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            }
                        },
                        "required": [
                            "name",
                            "type",
                            "fixtures"
                        ]
                    }
                }
            },
            "required": [
                "fixtures",
                "inputcfg",
                "outputcfg",
                "groups"
            ]
        }




        var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
        var validate = {};
        if(global.test_mode)
            validate = ajv.compile(schema_test_mode);
        else
            validate = ajv.compile(schema);

        var valid = validate(data);
        if (!valid) {
            // console.log("error validating config: ")
            //console.log(validate.errors);
            return validate.errors;
        }
        return undefined;
    }

};

