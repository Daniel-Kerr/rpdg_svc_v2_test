/**
 * Created by Nick on 1/15/2017.
 */

//var express = require('express');
var path = require("path");
var fs = require('fs');
var moment = require('moment');
var os = require( 'os' );
var Ajv = require('ajv');

var file_scenes = 'datastore/scenes.json'; // scenes file
var file_config = 'datastore/config.json';

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

