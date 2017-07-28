#!/usr/bin/python
# -*- coding: UTF-8 -*-

import zipfile
import os

def create_zip(zip_name,path_list):
    #print path_list
    path_len = len(path_list)
    f = zipfile.ZipFile(zip_name,'w',zipfile.ZIP_DEFLATED)
    for i in range(0,path_len):
        f.write(path_list[i])
    f.close()
    

if __name__ == "__main__":
    args = sys.argv[1:]
    create_zip(root_path)
    
