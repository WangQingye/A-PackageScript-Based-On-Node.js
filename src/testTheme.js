/**
 * Created by wqy on 2017/7/11.
 * 分割theme文件为PC和Mobile
 */
const fs = require('fs');
//fs.rename('./default.mobile.json', './default.thm.json');
const themeFile = fs.readFileSync('../default.thm.json', 'utf-8');
exports.silceTheme = function () {
    console.log('start slice theme');
    const obj = JSON.parse(themeFile);
    const obj1 = JSON.parse(themeFile);
    for(var i = obj.exmls.length - 1; i >=  0 ; i--)
    {
        if(obj.exmls[i].path.indexOf('resource/game_skins/mobile/') !== -1)
        {
            obj.exmls.splice(obj.exmls.indexOf(obj.exmls[i]), 1);
        }
    }
    for(var j = obj1.exmls.length - 1; j >=  0 ; j--)
    {
        if(obj1.exmls[j].path.indexOf('resource/game_skins/pc/') !== -1)
        {
            obj1.exmls.splice(obj1.exmls.indexOf(obj1.exmls[j]), 1);
        }
    }
    fs.writeFileSync('../pc.thm.json', JSON.stringify(obj, null, 2), 'utf-8');
    console.log('pc theme done');
    fs.writeFileSync('../mobile.thm.json', JSON.stringify(obj1, null, 2), 'utf-8');
    console.log('mobile theme done');
};

