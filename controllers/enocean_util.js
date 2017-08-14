/**
 * Created by nickp on 8/11/2017.
 */

var data_utils = require('../utils/data_utils.js');
module.exports = {

    constructRemoteCommand: function(hubid, targetdev, command, options)
    {
        var msg = "";
        switch(command)
        {
            case "unlock":

                msg += "55"; //sync
                var header = "00080807EC"; //includes crc
                var payload = "000107FF00000001" + targetdev   +  hubid;  // fixed payload
                var crcstr = getCRCString(payload);
                msg += header + payload+crcstr;
                console.log("UNLOCK: " + msg);
                break;

            case "reset":
                //     55 00 05 08 07 7D    02 24 07 FF C0   05 06 65 CD   01 9C 41 5B   E6

                msg += "55"; //sync
                var header = "000508077D"; //includes crc
                var payload = "022407FFC0" + targetdev   +  hubid;  // fixed payload
                var crcstr = getCRCString(payload);
                msg += header + payload+crcstr;
                console.log("RESET: " + msg);
                break;

            case "link":
                //  55 00 0E 08 07 91   02 12 07 FF 00 00   01 9C 41 5B   A5 38 08   01   05 06 65 CD    01 9C 41 5B   09
                // msg = "55000E080791021207FF0000019C415BA5380801050665CD019C415B09";
                msg += "55"; //sync
                var header = "000E080791"; //includes crc
                var payload = "021207FF0000" + hubid + "A53808" + "01"+ targetdev + hubid;  // fixed payload
                var crcstr = getCRCString(payload);
                msg += header + payload+crcstr;
                console.log("LINK: " + msg);
                break;

            case "apply":
                // 55  00 05 08 07 7D     02 26 07 FF C0    05 06 65 CD    01 9C 41 5B    5C
                msg += "55"; //sync
                var header = "000508077D"; //includes crc
                var payload = "022607FFC0" + targetdev + hubid;  // fixed payload
                var crcstr = getCRCString(payload);
                msg += header + payload+crcstr;
                console.log("APPLY: " + msg);
                break;

            case"level":

                var speed = "01";
                if(options != undefined) {
                    var level = options;

                    msg += "55"; //sync
                    var header = "000a0701eb"; //includes crc

                    if(level < 10)
                    {
                        // var payload    = "a50200000e" + targetdev + "3001ffffffffff00"  //flip to off (relay)

                        var payload    = "a502000008" + hubid + "8003" +targetdev+ "ff00";


                        var crcstr = getCRCString(payload);
                        msg += header + payload + crcstr;
                        console.log("level set(OFF): " + targetdev + "   " +level + "    " + msg);
                    }
                    else {
                        var levelhex = parseInt(level).toString(16);
                        if(levelhex.length <=1)
                            levelhex = "0"+ levelhex;

                        // var payload    = "a502" + levelhex + speed + "0f" + targetdev + "3001 ffffffff ff00"

                        var payload    = "a502" + levelhex + speed + "F9" + hubid + "8003" +targetdev+ "ff00";
                        var crcstr = getCRCString(payload);
                        msg += header + payload + crcstr;
                        console.log("level set: " + targetdev + "    " + level + "   " + msg);
                    }

                }

                break;


            default:
                break;

        }
        return msg;
    },



    ByteArrayToLong: function(byteArray)
    {
        var value = 0;
        value = (byteArray[0] << 24) | (byteArray[1] << 16) | (byteArray[2] << 8)| (byteArray[3]);
        return value;
    },
    isKnownInputDevice: function(id)
    {
        for(var i = 0 ; i < global.currentconfig.enocean.inputs.length; i++)
        {
            var testid = global.currentconfig.enocean.inputs[i].id;
            if(testid == id.toUpperCase())
                return global.currentconfig.enocean.inputs[i];
        }
        return undefined;
    },
    addInputDevice: function(id, eep)
    {
        if(undefined == module.exports.isKnownInputDevice(id))
        {
            var element = {};
            element.id = id.toUpperCase();
            element.eep = eep.toUpperCase();
            element.isdouble = false;

            var type = "";
            if(eep.toUpperCase() == "A5-07-01")
                element.type = "PIR";
            if(eep.toUpperCase() == "F6-02-02")
                element.type = "ROCKER";
            if(eep.toUpperCase() == "A6-06-02")
                element.type = "MOTION";

            global.currentconfig.enocean.inputs.push(element);
            console.log("added device: " + id.toUpperCase());

            data_utils.writeConfigToFile();
            // print list.
            console.log("Known INPUT Devices");
            for(var i = 0 ; i <  global.currentconfig.enocean.inputs.length; i++)
            {
                console.log("id: " +  global.currentconfig.enocean.inputs[i].id + "  eep: " +  global.currentconfig.enocean.inputs[i].eep);
            }
        }
    },
    isKnownOutputDevice: function(id)
    {
        for(var i = 0 ; i < global.currentconfig.enocean.outputs.length; i++)
        {
            var testid = global.currentconfig.enocean.outputs[i].id;
            if(testid == id.toUpperCase())
                return global.currentconfig.enocean.outputs[i];
        }
        return undefined;
    },
    addOutputDevice: function(id)
    {
        if(undefined == module.exports.isKnownOutputDevice(id))
        {
            var element = {};
            element.id = id.toUpperCase();
            element.eep = "A5-38-08";
            element.isdouble = false;

           // var type = "";
           // if(eep.toUpperCase() == "A5-07-01")
           //     element.type = "PIR";
           // if(eep.toUpperCase() == "F6-02-02")
           //     element.type = "ROCKER";
           // if(eep.toUpperCase() == "A6-06-02")
           //     element.type = "MOTION";

            global.currentconfig.enocean.outputs.push(element);
            console.log("added device: " + id.toUpperCase());
            data_utils.writeConfigToFile();
            // print list.
            console.log("Known Output Devices");
            for(var i = 0 ; i <  global.currentconfig.enocean.outputs.length; i++)
            {
                console.log("id: " +  global.currentconfig.enocean.outputs[i].id + "  eep: " +  global.currentconfig.enocean.outputs[i].eep);
            }
        }
    },
    pad: function(num, size) {
        var s = "000000000" + num;
        return s.substr(s.length-size);
    }

};



function getCRC(msg){

    var buf = new Buffer( msg , "hex" );
    var crc = 0;
    for (var i = 0;i < buf.length;i++){
        crc = crcTable[(crc ^ buf[i])];
    }
    return crc;
}
function getCRCString(msg){

    var buf = new Buffer( msg , "hex" );
    var crc = 0;
    for (var i = 0;i < buf.length;i++){
        crc = crcTable[(crc ^ buf[i])];
    }

    var crcstr = crc.toString(16);
    if(crcstr.length <= 1)
        crcstr = "0" + crcstr;
    return crcstr;
}


var crcTable = [
    0x00, 0x07, 0x0e, 0x09, 0x1c, 0x1b, 0x12, 0x15,
    0x38, 0x3f, 0x36, 0x31, 0x24, 0x23, 0x2a, 0x2d,
    0x70, 0x77, 0x7e, 0x79, 0x6c, 0x6b, 0x62, 0x65,
    0x48, 0x4f, 0x46, 0x41, 0x54, 0x53, 0x5a, 0x5d,
    0xe0, 0xe7, 0xee, 0xe9, 0xfc, 0xfb, 0xf2, 0xf5,
    0xd8, 0xdf, 0xd6, 0xd1, 0xc4, 0xc3, 0xca, 0xcd,
    0x90, 0x97, 0x9e, 0x99, 0x8c, 0x8b, 0x82, 0x85,
    0xa8, 0xaf, 0xa6, 0xa1, 0xb4, 0xb3, 0xba, 0xbd,
    0xc7, 0xc0, 0xc9, 0xce, 0xdb, 0xdc, 0xd5, 0xd2,
    0xff, 0xf8, 0xf1, 0xf6, 0xe3, 0xe4, 0xed, 0xea,
    0xb7, 0xb0, 0xb9, 0xbe, 0xab, 0xac, 0xa5, 0xa2,
    0x8f, 0x88, 0x81, 0x86, 0x93, 0x94, 0x9d, 0x9a,
    0x27, 0x20, 0x29, 0x2e, 0x3b, 0x3c, 0x35, 0x32,
    0x1f, 0x18, 0x11, 0x16, 0x03, 0x04, 0x0d, 0x0a,
    0x57, 0x50, 0x59, 0x5e, 0x4b, 0x4c, 0x45, 0x42,
    0x6f, 0x68, 0x61, 0x66, 0x73, 0x74, 0x7d, 0x7a,
    0x89, 0x8e, 0x87, 0x80, 0x95, 0x92, 0x9b, 0x9c,
    0xb1, 0xb6, 0xbf, 0xb8, 0xad, 0xaa, 0xa3, 0xa4,
    0xf9, 0xfe, 0xf7, 0xf0, 0xe5, 0xe2, 0xeb, 0xec,
    0xc1, 0xc6, 0xcf, 0xc8, 0xdd, 0xda, 0xd3, 0xd4,
    0x69, 0x6e, 0x67, 0x60, 0x75, 0x72, 0x7b, 0x7c,
    0x51, 0x56, 0x5f, 0x58, 0x4d, 0x4a, 0x43, 0x44,
    0x19, 0x1e, 0x17, 0x10, 0x05, 0x02, 0x0b, 0x0c,
    0x21, 0x26, 0x2f, 0x28, 0x3d, 0x3a, 0x33, 0x34,
    0x4e, 0x49, 0x40, 0x47, 0x52, 0x55, 0x5c, 0x5b,
    0x76, 0x71, 0x78, 0x7f, 0x6A, 0x6d, 0x64, 0x63,
    0x3e, 0x39, 0x30, 0x37, 0x22, 0x25, 0x2c, 0x2b,
    0x06, 0x01, 0x08, 0x0f, 0x1a, 0x1d, 0x14, 0x13,
    0xae, 0xa9, 0xa0, 0xa7, 0xb2, 0xb5, 0xbc, 0xbb,
    0x96, 0x91, 0x98, 0x9f, 0x8a, 0x8D, 0x84, 0x83,
    0xde, 0xd9, 0xd0, 0xd7, 0xc2, 0xc5, 0xcc, 0xcb,
    0xe6, 0xe1, 0xe8, 0xef, 0xfa, 0xfd, 0xf4, 0xf3
];