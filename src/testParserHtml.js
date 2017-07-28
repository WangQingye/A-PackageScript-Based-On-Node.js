/**
 * Created by wqy on 2017/7/11.
 */
const fs = require('fs');
const Version = require('./testVersion');
const Theme = require('./testTheme');
const cheerio = require('cheerio');
const createZip = require('./create-zip');
const $ = cheerio.load(fs.readFileSync('../../index.html', 'utf8'), {
    withDomLvl1: true,
    normalizeWhitespace: false,
    xmlMode: false,
    decodeEntities: true
});
// 生成libs.js
   createLibs();
// 移动cdn.html
   fs.renameSync('../cdn.html','../../cdn.html');
// 分割default.thm.json为 pc.thm.json和mobile.thm.json
   Theme.silceTheme();
// libs生成和thm分割后再开始生成version和mainfest
   Version.createVersion('../../resource');
// 生成.files文件并将特定的crc写入version
   createZips();
// 操作html
   handleHtml();
/**
 * 生成libs
 * */
function createLibs() {
    console.log('start create libs.js');
    const urls = $('script[egret=lib]');
    // var code = {};
    // for(var i = 0; i < urls.length - 1; i++)
    // {
    //     var url = $(urls[i]).attr('src');
    //     code[url] = fs.readFileSync('../../' + url, 'utf8');
    //     $(urls[i]).remove();
    // }
    // var result = uglify.minify(code);
    var str = '';
    for(var i = 0; i < urls.length; i++)
    {
        var url = $(urls[i]).attr('src');
        str += "\r" + fs.readFileSync('../../' + url, 'utf8');
        // 留下最后一个，用来替换SRC
        if(i !== urls.length - 1) $(urls[i]).remove();
    }
    //fs.writeFileSync('../../libs/libs.js', result.code, 'utf8');
    fs.writeFileSync('../../libs/libs.js', str, 'utf8');
    console.log('libs.js done');
}

/**
 * 操作index - 替换libs, 修改argv, 给图片加version
 * */
function handleHtml() {
    console.log('handle html');
    //读入version
    var version = JSON.parse(fs.readFileSync('../version.json'));
    // 把引入js的最后一个文件的src替换为lib.js
    const urlsAfter = $('script[egret=lib]');
    $(urlsAfter[0]).attr('src', 'libs/libs.js?' + version.libs['libs/libs.js']);
    $(urlsAfter[0]).removeAttr('src-release');
    // 重新写入index
    fs.writeFileSync('../../index.html', $.html(), 'utf8');
    // 以字符串的形式操作html
    var text = fs.readFileSync('../../index.html', 'utf8');
    // 替换logLevel
    if (process.argv[2])
    {
        if (text.indexOf('var logLevel = 0') === -1) console.log('logLevel不等于0');
        text = text.replace('var logLevel = 0', "var logLevel = "+ process.argv[2]);
    }else
    {
        console.log('no logLevel');
    }
    // 替换isDebug
    text = text.replace('var isDebug = true', 'var isDebug = false');
    // 给html中的图片加version
    var htmlImgs = fs.readdirSync('../../resource/html');
    for (var i = 0; i < htmlImgs.length; i++)
    {
        var imageVersion = htmlImgs[i] + '?' + version.files['html/' + htmlImgs[i]];
        text = text.replace(htmlImgs[i], imageVersion);
    }
    // 给main.min.js加version
    text = text.replace('main.min.js', 'main.min.js?' + version.libs['main.min.js']);
    // 添加mainfest到html中
    text = text.replace('<html>', '<html manifest="index.manifest?' + version.files['index.manifest'] + '">');
    fs.writeFileSync('../../index.html', text, 'utf8');
    console.log('html done');
}

/**
 * 打包图片成files, 并在version中添加独有的crc
 * */
function createZips()
{
    console.log('create zips');
    var filesCrc = createZip.createZips('../default.res.json','../');
    var version = JSON.parse(fs.readFileSync('../version.json'));
    var manifest = fs.readFileSync('../../index.manifest', 'utf8');
    var str = '';
    var defaultJson = JSON.parse(fs.readFileSync('../default.res.json'));
    for (var i = 0; i < defaultJson.groups.length; i++)
    {
        defaultJson.groups[i].keys = defaultJson.groups[i].name + '.files'
    }
    for (file in filesCrc)
    {
        version.files[file] = filesCrc[file];
        str += 'resource/' + file + '?' + filesCrc[file] + '\r';
    }
    str += 'NETWORK:';
    manifest = manifest.replace('NETWORK:', str);
    fs.writeFileSync('../../index.manifest',manifest, 'utf-8');
    fs.writeFileSync('../default.res.json', JSON.stringify(defaultJson, null, 2), 'utf-8');
    fs.writeFileSync('../version.json', JSON.stringify(version, null, 2), 'utf-8');
    console.log('zips done');
}