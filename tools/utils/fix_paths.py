import json
import os
import urllib.parse

def migrate_paths(json_path):
    if not os.path.exists(json_path):
        print(f"File not found: {json_path}")
        return

    print(f"Migrating paths in {json_path}...")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 路径映射
    old_prefixes = [
        r"F:\桌面\AIcut小白教程\需要剪辑的素材",
        r"F:\桌面\开发\AIcut"
    ]
    new_prefix = r"D:\Desktop\AIcut"
    
    def fix_value(val):
        if not isinstance(val, str):
            return val
        
        # 处理原始路径
        for old in old_prefixes:
            if old in val:
                # 特殊处理：如果旧路径包含“需要剪辑的素材”，可能是在 source 目录下
                if "需要剪辑的素材" in old:
                    target = os.path.join(new_prefix, "source")
                else:
                    target = new_prefix
                
                val = val.replace(old, target)
                
                # 处理可能出现的重复斜杠或编码问题
                val = val.replace("\\\\", "\\")
        
        # 处理 URL 编码路径
        for old in old_prefixes:
            old_encoded = urllib.parse.quote(old, safe='')
            if old_encoded in val:
                if "需要剪辑的素材" in old:
                    target = os.path.join(new_prefix, "source")
                else:
                    target = new_prefix
                new_encoded = urllib.parse.quote(target, safe='')
                val = val.replace(old_encoded, new_encoded)
            
        return val

    def traverse(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, (dict, list)):
                    traverse(v)
                else:
                    obj[k] = fix_value(v)
        elif isinstance(obj, list):
            for i in range(len(obj)):
                if isinstance(obj[i], (dict, list)):
                    traverse(obj[i])
                else:
                    obj[i] = fix_value(obj[i])

    traverse(data)

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Done migrating {json_path}")

if __name__ == "__main__":
    files_to_fix = [
        r"d:\Desktop\AIcut\ai_workspace\project-snapshot.json",
        r"d:\Desktop\AIcut\ai_workspace\history\snapshot_2026-01-18T13-13-35.json"
    ]
    for f in files_to_fix:
        migrate_paths(f)
