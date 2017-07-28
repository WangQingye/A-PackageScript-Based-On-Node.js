var fs = require('fs');
var path = require('path');
var webp = require('webp-converter');

var directory = require('./directory_tree.js');

/** log file */
var log = [];

/** convert all the png file into webp
 *  @param origin - String: origin path of the png files
 *  @param dir - String: path to save the webp files
 *  @param timeStamp - Number(optinal): (in hours) the expires of the webp file
 *  @param logPath - String(optinal): path to save the log file
 */
function pngs2webps(origin, dir, timeStamp, logPath) {
    timeStamp = timeStamp || 0.1;
    log = [];
    // get the origin file list
    var fileList = directory.getFileList(origin);
    // convert
    for (var i = fileList.length - 1; i >= 0; i--) {
        convert2Webp(fileList[i], origin, dir, timeStamp);
    }
    // write the log file
    if (logPath) directory.writeFile(logPath + 'log.json', JSON.stringify(log));
}

/** convert a single png into webp
 *  @param png - the file path info
 *  @param origin - String: origin path of the png files
 *  @param dir - String: path to save the webp files
 *  @param timeStamp - Number(optinal): (in hours) the expires of the webp file
 */
function convert2Webp(png, origin, dir, timeStamp) {
    if (!fs.existsSync(dir)) {
        mkdirsSync(dir);
    }
    // png: {
    //     name: file,
    //     path: path,
    //     mtime: mtime
    // };
    var needConvert = false;
    // check if the path exists
    var targetPath = png.path.toString().replace(origin, dir);
    if (!fs.existsSync(targetPath)) {
        mkdirsSync(targetPath);
    }
    //  check if the file exists
    var targetName = png.name + ".webp";
    if (!fs.existsSync(targetPath + "/" + targetName)) {
        needConvert = true;
    } else {
        // check the mtime of every png file
        var stats = fs.statSync(targetPath + "/" + targetName);
        var mtime = stats.mtime;
        var tt = mtime - png.mtime;
        tt = tt / 1000 / 60 / 60;
        // check if the png file is an old version
        if (tt < timeStamp) {
            needConvert = true;
        }
    }
    if (needConvert) {
        var src_img = png.path + "/" + png.name;
        var dist_img = targetPath + "/" + targetName;
        png2webp(src_img, dist_img);
        log.push(src_img + " has been modified.");
    }
}

/** convert png to webp
 *  @param src_img - the png file path
 *  @param dist_img - the webp file path
 */
function png2webp(src_img, dist_img) {
    webp.cwebp(src_img, dist_img, "-q 75", function (status) {
        //if exicuted successfully status will be '100'
        //if exicuted unsuccessfully status will be '101'
        if (status + '' == '101') {
            console.log(src_img + ' exicuted unsuccessfully. ');
            log.push(src_img + ' exicuted unsuccessfully. ');
        }
    });
}

/** to create a multi-level directory synchronization
 *  @param dirpath - the multi-level directory string
 */
function mkdirsSync(dirpath) {
    try {
        if (!fs.existsSync(dirpath)) {
            let pathtmp;
            dirpath.split(/[/\\]/).forEach(function (dirname) {
                if (pathtmp) {
                    pathtmp = path.join(pathtmp, dirname);
                } else {
                    pathtmp = dirname;
                }
                if (!fs.existsSync(pathtmp)) {
                    if (!fs.mkdirSync(pathtmp)) {
                        return false;
                    }
                }
            });
        }
        return true;
    } catch (e) {
        console.log("create director fail! path=" + dirpath + " errorMsg:" + e);
        return false;
    }
}

exports.pngs2webps = pngs2webps;