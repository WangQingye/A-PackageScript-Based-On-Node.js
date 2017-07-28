/**
 * Created by wqy on 2017/7/12.
 */

const fs = require('fs');
const createZip = require('./create-zip');
const config = JSON.parse(fs.readFileSync('./fileConfig.json'));
const version = {};
const fileList = {};
//console.log(createZip.getCRC32('./index.html'));
exports.createVersion = createVersion;

function createVersion() {
    console.log('start create version');
    // 读取files
    readFile('../../resource');
    // 单独添加以下lib.js因为它没在resource里面
    version.files = fileList;
    version.libs = {};
    version.libs['libs/libs.js'] = createZip.getCRC32('../../libs/libs.js');
    version.libs['main.min.js'] = createZip.getCRC32('../../main.min.js');
    version.version = 0;
    createMainfest();
    version.files['index.manifest'] = createZip.getCRC32('../../index.manifest');
    fs.writeFileSync('../version.json', JSON.stringify(version, null, 2), 'utf-8');
    console.log('version done');
    // 生成mainfest
}

// 生成files
function readFile(path) {
    var files = fs.readdirSync(path);
    files.forEach(ergodic);
    function ergodic(file) {
        var filePath = path + '/' + file;
        var states = fs.statSync(filePath);
        if (states.isDirectory())
        {
            // 如果文件夹在config中，就跳过这个文件夹
            if (config.folder['indexOf'](filePath) !== -1) return;
            readFile(filePath);
        } else
        {
            // 如果在config中，就跳过这个文件
            if (config.file['indexOf'](filePath) !== -1) return;
            fileList[filePath.replace('../../resource/','')] = createZip.getCRC32(filePath)
        }
    }
}

// 生成mainfest
function createMainfest() {
    console.log('start create index.manifest');
    var str = "CACHE MANIFEST\r#version 0.1.3\r\rCACHE:\r";
    for (file in fileList)
    {
        var fileDir = "./resource/" + file.split('/')[0];
        if (config.mainfest.folder['indexOf'](fileDir) !== -1)
        {
            continue;
        }
        str += "resource/" + file + "?" + fileList[file]+"\r"
    }
    str += "libs/libs.js?" + version.libs['libs/libs.js'] + "\r";
    str += "NETWORK:\r*";
    fs.writeFileSync('../../index.manifest', str, 'utf-8');
    console.log('index.manifest done');
}
