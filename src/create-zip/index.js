const fs = require('fs');
const path = require('path');
// const AdmZip = require('adm-zip');
const CRC32 = require('crc-32');
const zlib = require('zlib');
const crcs = {};

const archiver = require('archiver');

/** read the default.res.json from the origin path and create zip files in the target directory
 * @param {String} origin - directory of the default.res.json file
 * @param {String} target - the directory to store zip files
 */
function createZips(origin, target) {
    // get the resJson object
    var resJson = readResJson(origin);
    // get the zipJson
    var zipJson = converResJson(resJson);
    // create zip files
    for (var key in zipJson) {
        var urls = zipJson[key];
        getSingleZip(key, urls, target);
        getSingleWebps(key, urls, target);
    }
    console.log('create zip files complete!');
    return crcs;
}

/** read the default.res.json and convert the json string into a js object
 * @param {String} path - directory of the default.res.json file
 * @return {JSON} the default.res.json object
 */
function readResJson(path) {
    // check if the file exists
    if (!fs.existsSync(path)) {
        throw new Error('no such file!');
    }
    var resFile = fs.readFileSync(path, 'utf8');
    try {
        // convert the json into an object
        var resJson = JSON.parse(resFile);
        return resJson;
    } catch (err) {
        console.log(err);
    }
}

// origin = {
//     "groups": [
//         {
//             "keys": "number_fnt,number_b_fnt,fontXT_fnt,fontSicbo_fnt,font_fnt,bigfont_fnt,font_num_fnt,gold_135_fnt,game_share_yellow_30_fnt,game_share_silver_33_fnt,game_share_white_52_fnt,game_share_golden_33_fnt,sicbo_white_51_fnt",
//             "name": "fontGroup"
//         }
//     ],
//     "resources": [
//         {
//             "url": "fonts/fontSicbo.fnt",
//             "type": "font",
//             "name": "fontSicbo_fnt"
//         }
//     ]
// };

/** convert the origin default.res.json into the group-urls pair
 * @param {JSON} resJson - the default.res.json object
 * @return {JSON} { groupName: [ url ] }
 */
function converResJson(resJson) {
    // convert the groups in the resJson
    var jsonGroup = {};
    resJson.groups.forEach(function (group) {
        var keys = group.keys.split(',');
        var name = group.name;
        if (!jsonGroup[name]) {
            jsonGroup[name] = [];
        }
        jsonGroup[name] = jsonGroup[name].concat(keys);
    }, this);
    // convert the resources in the resJson
    var jsonRes = {};
    resJson.resources.forEach(function (res) {
        var name = res.name;
        var url = res.url;
        jsonRes[name] = url;
    }, this);
    // build the zipJson
    var zipJson = {};
    for (var groupName in jsonGroup) {
        var resKey = jsonGroup[groupName];
        var urls = [];
        resKey.forEach(function (key) {
            if (jsonRes[key]) urls.push(jsonRes[key]);
        }, this);
        zipJson[groupName] = urls;
    }
    // returns the zipJson
    return zipJson;
}

/** to create a zip file of given files
 * @param {String} name - name of the zip file
 * @param {Array<String>} urls - the urls of every file to be written in the zip
 * @param {String} target - directory to store the zip file
 */
function getSingleZip(name, urls, target) {
    var targetPath = path.join(target, name + '.files');
    // create a file to stream archive data to.
    var output = fs.createWriteStream(targetPath);
    var archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });
    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
            throw err;
        }
    });
    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        throw err;
    });
    // pipe archive data to the file
    archive.pipe(output);
    for (var i = urls.length - 1; i >= 0; i--) {
        // add file to the zip
        var localPath = path.join('../', urls[i]);
        // var zipPath = path.dirname(urls[i]);
        // zip.addLocalFile(localPath, zipPath);
        var fileName = localPath.split("/").pop();
        // append a file
        archive.file(localPath, { name: fileName });
    }
    var crcCode = getZipCRC(urls);
    crcs[name + '.files'] = crcCode;
    // finalize the archive (ie we are done appending files but streams have to finish yet)
    archive.finalize();
}

/** to create a zip file of given files
 * @param {String} name - name of the zip file
 * @param {Array<String>} urls - the urls of every file to be written in the zip
 * @param {String} target - directory to store the zip file
 */
function getSingleWebps(name, urls, target) {
    var targetPath = path.join(target, name + '.webps');
    // create a file to stream archive data to.
    var output = fs.createWriteStream(targetPath);
    var archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });
    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
            throw err;
        }
    });
    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        throw err;
    });
    // pipe archive data to the file
    archive.pipe(output);
    for (var i = urls.length - 1; i >= 0; i--) {
        // add file to the zip
        var localPath = path.join('../', urls[i]);
        if (localPath.indexOf(".png") > -1) {
            localPath = localPath.replace("image", "bimage");
            localPath = localPath.replace(".png", ".png.webp");
            // } else {
            //     console.log("-1 ", localPath);
            //     continue;
        }
        if (!fs.existsSync(localPath)) {
            localPath = localPath.replace("bimage", "image");
            localPath = localPath.replace(".png.webp", ".png");
        }
        // var zipPath = path.dirname(urls[i]).replace("image", "bimage");
        // zip.addLocalFile(localPath, zipPath);
        var fileName = localPath.split("/").pop();
        // append a file
        archive.file(localPath, { name: fileName });
    }
    var crcCode = getWebpsCRC(urls);
    crcs[name + '.webps'] = crcCode;
    // finalize the archive (ie we are done appending files but streams have to finish yet)
    archive.finalize();
}

/** get the CRC-32 of a zip file
 * @param {Array<String>} urls - the urls of every file to be written in the zip
 * @return {String} the CRC-32 code
 */
function getZipCRC(urls) {
    var zipCode = '';
    urls = urls.sort();
    for (var i = urls.length - 1; i >= 0; i--) {
        // add file to the zip
        var localPath = path.join('../', urls[i]);
        var fileCrc = getCRC32(localPath);
        zipCode += fileCrc;
    }
    var zipCrc = CRC32.str(zipCode);
    zipCrc = Math.abs(zipCrc);
    var zipCrc = zipCrc.toString(16);
    return zipCrc;
}

/** get the CRC-32 of a zip file
 * @param {Array<String>} urls - the urls of every file to be written in the zip
 * @return {String} the CRC-32 code
 */
function getWebpsCRC(urls) {
    var zipCode = '';
    urls = urls.sort();
    for (var i = urls.length - 1; i >= 0; i--) {
        // add file to the zip
        var localPath = path.join('../', urls[i]);
        if (localPath.indexOf(".png") > -1) {
            localPath = localPath.replace("image", "bimage");
            localPath = localPath.replace(".png", ".png.webp");
        }
        if (!fs.existsSync(localPath)) {
            localPath = localPath.replace("bimage", "image");
            localPath = localPath.replace(".png.webp", ".png");
        }
        var fileCrc = getCRC32(localPath);
        zipCode += fileCrc;
    }
    var zipCrc = CRC32.str(zipCode);
    zipCrc = Math.abs(zipCrc);
    var zipCrc = zipCrc.toString(16);
    return zipCrc;
}

/** get the CRC32 of the given file
 * @param {String} path - path of file
 * @return {String} crc-32 string
 */
function getCRC32(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error('no such file!' + filePath);
    }
    var file = fs.readFileSync(filePath);
    var crcValue = CRC32.buf(file);
    crcValue = Math.abs(crcValue);
    return crcValue.toString(16);
}


// export the main func
exports.createZips = createZips;
exports.getCRC32 = getCRC32;