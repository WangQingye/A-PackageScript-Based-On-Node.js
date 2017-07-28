var fs = require('fs');
var path = require('path');


/** Get all the files' info inside the folder
 *  @param path - String: file path
 *  @return Array: Array of file list object
 */
function getFileList(path) {
    var filesList = [];
    readFile(path, filesList);
    return filesList;
}

/** read file path
 * @param path - String: file path
 * @param filesList - Array: the file tree
 */
function readFile(path, filesList) {
    // read file
    files = fs.readdirSync(path);
    files.forEach(ergodic);
    // ergodic file path
    function ergodic(file) {
        states = fs.statSync(path + '/' + file);
        if (states.isDirectory()) {
            readFile(path + '/' + file, filesList);
        } else {
            // store file info
            var item = {
                name: file,
                path: path,
                mtime: states.mtime
            };
            filesList.push(item);
        }
    }
}

/** write data into a utf-8 file
 *  @param fileName - file name
 *  @param data - data to be written
 */
function writeFile(fileName, data) {
    try {
        fs.writeFile(fileName, data, 'utf-8');
    } catch (err) {
        console.log(err);
    }
}

/** write file info into a json
 *  @param path - target file path
 *  @param fileName - json name
 */
function writeFileList(path, fileName, dir) {
    // get the fillist
    var filesList = getFileList(path);
    var str = JSON.stringify(filesList);
    // check filename
    dir = dir || './';
    // write file
    try {
        writeFile(dir + fileName + '.json', str);
    } catch (err) {
        console.log(err);
    }

}

exports.getFileList = getFileList;
exports.writeFileList = writeFileList;
exports.writeFile = writeFile;
