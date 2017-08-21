# 一个基于node.js的打包脚本

应用背景：项目中图片过多，采用打包zip的形式减少请求，然后在项目代码中解析。

主要功能如下：

1. 将Egret引擎自带的libs文件夹下的js文件合并成一个js文件并压缩。（libs中的js文件已经基于ugliy.js压缩过）。
2. 将皮肤文件default.thm.json文件分割为mobile和PC两版。（因为此文件本身较大，而且mobile和PC两版在运行时只需要其中一个。）
3. 遍历resource文件夹中的所有文件，生成version文件（算法基于crc32），这里涉及到一个问题是因为项目中将图片打包成了zip形式（在运行时通过代码解析）来减少请求，所以在生成crc的时候需要特别注意zip里面的img是否改变。
4. 操作html文件，修改引用，添加cnd.html，修改logLevel等。

