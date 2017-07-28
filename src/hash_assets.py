 #!/usr/bin/python
# -*- coding: UTF-8 -*-

import binascii
import sys
import os
import getopt
import json
import shutil
import zipfile
import time
import zip_merge
import shutil
#import Image

path = os.getcwd()

resource_path = path+"/../../resource/"
libs_path =path+"/../../libs/"
json_path = path+"/../../resource/version.json"
default_res_json = path+"/../../resource/default.res.json"
root_path = path + "/../.."
pathModules = root_path + "/libs/modules"
skin_path = resource_path + "game_skins"
mainfestCout = ""

html_js_list = ["main.min.js","libs.js","resource/js/overWrite.js"]
size_list = [180,167,152,144,120,114,76,72,57,48,36]
html_png = list()
html_png_dic = {}
html_js_ver = {}
items = {}
libs_dic = {}
is_pic_zoom = False


from HTMLParser import HTMLParser
from htmlentitydefs import name2codepoint
class MyHTMLParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        if tag == 'img':
                for attr in attrs:
                        if attr[0] == 'src':
                                print "attr:", attr[1]
                                html_png.append(attr[1])

parser = MyHTMLParser()


def feed_html():
    htmlStr = openSingleFile(root_path + "/index.html")
    parser.feed(htmlStr)

def crc32(filename):
	a_file = open(filename, 'rb')
	crc = binascii.crc32(a_file.read())
	a_file.close()
	return "%x"%(crc& 0xffffffff)
	
def is_same_version(old, new):
	return cmp(old, new) == 0
def getFileSuffix(file):
	return os.path.splitext(file)[1]
def _pushFileOfDir(_dir,suffix,_list):
	for name in os.listdir(_dir):
		_path = os.path.join(_dir, name)
		if os.path.isdir(_path):
			_pushFileOfDir(_path,suffix,_list)
		elif not suffix is None:
			if getFileSuffix(_path)==suffix:
				_list.append(_path)
		else:
			_list.append(_path)

def getFileListOfDir(root_dir,suffix):
	_list = [];
	_pushFileOfDir(root_dir,suffix,_list)
	return _list
	
def auto_hash_assets(_version):
	old = {'cpp_version': 0, 'files' : [], 'version' : 0}
	global mainfestCout
	mainfestCout = "CACHE MANIFEST" + "\n"
	mainfestCout = mainfestCout + "#version 0.1.3" + "\n" + "\n"
	mainfestCout = mainfestCout + "CACHE:" + "\n"
	if os.path.exists(json_path):
		with open(json_path) as f:
			old = json.load(f)

	res_files = getFileListOfDir(resource_path,None);
	for _path in res_files:
		rel = _path[len(resource_path):]
		rel = rel.replace("\\","/")
		if rel.find('eui_skins',0,9) == -1 and rel.find('game_skins') == -1 and rel.find('.proto') == -1 and rel.find('image',0,5) == -1 and rel.find('halfres',0,7) == -1 and rel.find('indexJs',0,7) == -1 and rel.find('Excle2Json')==-1 and rel.find('bimage')==-1:
			items[rel] = crc32(_path)
		
		if rel.find('music',0,5) == -1 and rel.find('game_skins') == -1 and rel.find('.proto') == -1 and rel.find('image',0,5) == -1 and rel.find('eui_skins',0,9) == -1 and rel.find('halfres',0,7) == -1 and rel.find('Excle2Json')==-1 and rel.find('plugin')==-1 and rel.find('topics')==-1 and rel.find('indexJs',0,7) == -1 and rel.find('cdn.html',0,8) == -1 and rel.find('bimage')==-1:
			mainfestCout = mainfestCout + "/resource/" + rel + "?%s"%items[rel] + "\n"

	items_lib = {}
	lib_files = getFileListOfDir(libs_path,None);
	for _path in lib_files:
		rel = _path[len(libs_path):]
		rel = rel.replace("\\","/")
		items_lib[rel] = crc32(_path)
		if rel.find(html_js_list[1]) >= 0:
			html_js_ver[rel] = items_lib[rel]

	items_lib[html_js_list[0]] = crc32(root_path + "/" + html_js_list[0])
	html_js_ver[html_js_list[0]] = items_lib[html_js_list[0]]
	
	items_lib[html_js_list[2]] = crc32(root_path + "/" + html_js_list[2])
	html_js_ver[html_js_list[2]] = items_lib[html_js_list[2]]
	#mainfestCout = mainfestCout + "" + html_js_list[0] + "?%s"%items_lib[html_js_list[0]] + "\n"

	for i,png in enumerate(html_png,1):
		#print i
		png = png.replace("resource/","")
		#print png
		html_png_dic[html_png[i-1]] = html_png[i-1] + "?" + items[png]
		#print html_png[i-1]
            
	new = {}
	#print html_png_dic
	new["files"] = items
	#new["libs"] = items_lib
	new["version"] = 0
	samefiles = is_same_version(old['files'], new['files'])
	if _version is None:
		if samefiles:
			new['version'] = old["version"]+1
		else:
			new['version'] = old["version"]
	else:
		new['version'] = _version

	with open(json_path, 'w') as f:
		json.dump(new, f, sort_keys=True, indent=2)
	#replace_default_res(new)
	
def getValueOfPath(version_data,path):
	data = version_data["files"]
	for _path in data:
		if _path == path:
			return data[_path]
	print("can not find value of:"+path)
	return "null"
def relaceUrlValue(version_data,url):
	if url.find("?")>0:
		arr = url.split("?")
		crc32_val = getValueOfPath(version_data,arr[0])
		return arr[0]+"?"+crc32_val
	else:
		crc32_val = getValueOfPath(version_data,url)
		return url+"?"+crc32_val
def replace_default_res(new_version):
	if not os.path.exists(default_res_json):
		return
	res_json = None
	with open(default_res_json) as f:
		res_json = json.load(f)
	data = res_json["resources"]
	for _val in data:
		url = _val["url"]
		_val["url"] = relaceUrlValue(new_version,url)
	with open(default_res_json, 'w') as f:
		json.dump(res_json, f, sort_keys=True, indent=2)

def openSingleFile(path):
    with open(path, 'r') as f:
        return f.read()

def checkJs(path):
    dirpath = pathModules + "/" + path
    listdir = os.listdir(dirpath)
    n = 0
    dircont = ""
    l = len(listdir)
    fileName = "name"
    while n < l:
        fileName = listdir[n]
        
        pos = fileName.find('.js')
        if pos > -1:
            #dircont = dircont + openSingleFile(dirpath + "/" + fileName)
            #dircont = dirpath + "/" + fileName + " "
            libs_dic[fileName] = openSingleFile(dirpath + "/" + fileName)
            
        n = n + 1
    return dircont

def h5_js_merge(needReplace):
        cont = ""
        global mainfestCout
        #print needReplace
        #遍历顺序
        lastIndex = 0
        nowIndex = 0
        lib_index = {}
        for d,x in libs_dic.items():
                #print d
                index = needReplace.find(d)
                lib_index[index] = d

        #print lib_index
        last_lab = ""
        lib_index = sorted(lib_index.items())
        #lib_index = sorted(lib_index.items(), lambda x, y: cmp(x[1], y[1]))
        #print lib_index
        for i in lib_index:
                #print i
                print i[1]
                cont = cont + libs_dic[i[1]]
                
        #生成合并文件
        with open(root_path + "/libs/" + "libs.js", 'w') as f:
            f.write(cont)

        #mainfestCout = mainfestCout + "libs/" + "libs.js" + "?%s"%crc32(root_path + "/libs/" + "libs.js") + "\n"
        print "js_merge finished"

def find_js():
        libsList = os.listdir(pathModules)
        for jsdir in libsList:
            checkJs(jsdir)
        print "find_js finished"
        print len(libs_dic)

def change_html(_level):
        #读取index.html
        htmlStr = openSingleFile(root_path + "/index.html")
        libstart = htmlStr.index("<!--modules_files_start-->") + len("<!--modules_files_start-->")
        libend = htmlStr.index("<!--modules_files_end-->")
        needReplace = htmlStr[libstart:libend]      #需要替换的文本
        h5_js_merge(needReplace)
        htmlStr = htmlStr.replace(needReplace,"\n\t<script egret=\"lib\" src=\"libs/libs.js?%s"%crc32(root_path + "/libs/" + "libs.js") + "\"></script>\n\t")
        print _level
        htmlStr = htmlStr.replace("var logLevel = 0;","var logLevel = %s;"%_level)
        htmlStr = htmlStr.replace("var isDebug = true;","var isDebug = false;")
        print html_js_ver
        for d,x in html_js_ver.items():
               pos = htmlStr.index(d) + len(d)
               endpos = htmlStr.index("\">",pos)
               needReplace = htmlStr[pos:endpos]
               if len(needReplace) == 0:
                       htmlStr = htmlStr[:pos] + "?%s"%x + htmlStr[pos:]
               else:
                       htmlStr = htmlStr.replace(needReplace,"?%s"%x)
               
        n = 0
        l = len(size_list)
        global is_pic_zoom
        hasicon = htmlStr.find("apple-touch-icon")
        while n < l and is_pic_zoom and hasicon == -1:
                link = "\t<link rel=\"apple-touch-icon\" sizes=\"%dx%d\" href=\"%dpng.png\" /> \n"%(size_list[n],size_list[n],size_list[n])
                pos = htmlStr.index("</head>")
                htmlStr = htmlStr[:pos] + link + htmlStr[pos:]
                n = n + 1

        #index.manifest
        #mainfest_crc32 = crc32(root_path + "/index.manifest")
        #print root_path + "/index.manifest"
        #pos = htmlStr.index("index.manifest") + len("index.manifest")
        #endpos = htmlStr.index("\">",pos)
        #needReplace = htmlStr[pos:endpos]
        #htmlStr = htmlStr.replace(needReplace,"?%s"%mainfest_crc32)
        #pos = htmlStr.index("<head>")
        #htmlStr = htmlStr[:pos] + "<html manifest=\"index.manifest?%d\">\n"%int(time.time()) + htmlStr[pos:]
        htmlStr = htmlStr.replace("<html>","<html manifest=\"index.manifest?%s\">"%crc32(root_path + "/resource/" + "version.json"))

        for k,v in html_png_dic.iteritems():
            if htmlStr.find(k)>0:
                htmlStr = htmlStr.replace(k,v)
        
        #生成新的html
        with open(root_path + "/" + "index.html", 'w') as f:
            f.write(htmlStr)


def zoom(im,w,h,_path):
    im2 = im.resize((w, h),Image.ANTIALIAS)
    im2.save(_path + "/%dpng.png"%w,"PNG")

def ico_zoom():
        #切图
        _cpath = path + "/config"
        _icopath = resource_path + "/icon/myico.png"

        if not os.path.exists(_icopath):
                return
        ret = os.path.exists(_cpath)
        ico_crc = crc32(_icopath)
        cig_crc = ""
        global is_pic_zoom
        if ico_crc != cig_crc:
                print "need zoom ico"
                is_pic_zoom = True
                im = Image.open(_icopath)
                n = 0
                l = len(size_list)
                while n < l:
                        zoom(im,size_list[n],size_list[n],root_path)
                        n = n + 1


def mainfest():
        print "mainfest"
        f = openSingleFile(resource_path + "/index.manifest")
        line = f.split('\n')

        # change version
        
        for l in line:
                slen = len(l)
                pos = l.find("#version")
                needReplace = ""
                if pos >= 0:
                        needReplace = l[pos:slen]
                        f = f.replace(needReplace,"#version %d"%(int(time.time())))
                pos = l.find('?')
                if pos >= 0:
                        needReplace = l[pos:slen]
                if items.get(l):
                        f = f.replace(needReplace,"")
                        pos = f.index(l) + slen
                        f = f[:pos] + "?" + items[l] + f[pos:]
        
        with open(resource_path + "/index.manifest", 'w') as w:
                w.write(f)

def create_mainfest():
        global mainfestCout
        print 'create_mainfest'
        mainfestCout = mainfestCout + "NETWORK:" + "\n" + "/index.html"
        with open(root_path + "/index.manifest", 'w') as f:
            f.write(mainfestCout)
        
def create_theme():
    print 'create_theme'
    if not os.path.exists(skin_path):
        return

    listdir = os.listdir(skin_path)
    n = 0
    dircont = ""
    l = len(listdir)
    while n < l:
        dirName = listdir[n]
        needPath = "resource/game_skins/" + dirName
        n = n + 1
        res_json = None
        
        with open(resource_path + "default.thm.json") as f:
            res_json = json.load(f)

        elen = len(res_json["exmls"])
        print elen
        en = 0
        skins_json = res_json["skins"]
        while en < elen:
            index = res_json["exmls"][en]["path"].find(needPath)
            if index == -1:
                index = res_json["exmls"][en]["path"].find("eui_skins")
                if index == -1:
                    del res_json["exmls"][en]
                    en = en - 1
                    elen = elen -1
            en = en + 1
        print len(res_json["exmls"])
        with open(resource_path + dirName + ".thm.json", 'w') as f:
            json.dump(res_json, f, sort_keys=True, indent=2)
def merge_pic():
	if not os.path.exists(default_res_json):
		return
	res_json = None
	with open(default_res_json) as f:
		res_json = json.load(f)
	groups = res_json['groups']
	resources = res_json['resources']
	res_dic = {}
	for res in resources:
		res_dic[res['name']] = {'type':res['type'],'url':res['url']}
	name = ""
	keys = ""
	
	for _val in groups:
		name = _val['name']
		keys = _val['keys']
		print name
		if keys == "":
			continue
		keys_list = keys.split(',')
		path_list = []
		webp_path_list = []
		for key in keys_list:
			#print key
			need_path = resource_path + res_dic[key]['url']
			path_list.append(need_path)
			webp_path = need_path.replace('/image','/bimage')
			#print webp_path
			if os.path.exists(webp_path + '.webp'):
				webp_path_list.append(webp_path + '.webp')
			else:
				webp_path_list.append(need_path)
		#print path_list
		zip_merge.create_zip(resource_path + name + ".files",path_list)
		zip_merge.create_zip(resource_path + name + ".webps",webp_path_list)
		#重构default.res文件
		_val['keys'] = name + ".files"
	with open(default_res_json, 'w') as f:
		json.dump(res_json, f, sort_keys=True, indent=2)

if __name__ == "__main__":
	args = sys.argv[1:]
	merge_pic()
	find_js();
	feed_html();
	create_theme();
	#ico_zoom();
	if len(args)==1:
		auto_hash_assets(None);
	else:
		auto_hash_assets(None);
	#mainfest();
	print len(args)
	if len(args)==1:
		change_html(args[0]);
	else:
		change_html('0');
	
	create_mainfest();
	shutil.move(resource_path + "cdn.html",root_path);
	print "============hash assets ok=============="
