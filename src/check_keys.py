#!/usr/bin/python
# -*- coding: UTF-8 -*-

import json
import sys
import os

path = os.getcwd()
default_res_json = path+"/../../resource/default.res.json"

def check_res(file_path):
    print file_path
    if not os.path.exists(file_path):
        return
    res_json = None
    with open(file_path) as f:
        res_json = json.load(f)
    #print res_json['groups']
    groups = res_json['groups']
    for _val in groups:
        name = _val['name']
        keys = _val['keys']
        print name
        keys_list = keys.split(',')
        for key in keys_list:
            check_key(key,name,groups)


#key需要检测的key,name需要过滤的组名
def check_key(key,name,groups):
    #print key
    for _val in groups:
        g_name = _val['name']
        g_keys = _val['keys']
        if g_name == name:
            continue
        index = g_keys.find(key)
        if index > -1:
            print key + " had repeat key in " + g_name

if __name__ == "__main__":
    args = sys.argv[1:]
    check_res(default_res_json)
    
