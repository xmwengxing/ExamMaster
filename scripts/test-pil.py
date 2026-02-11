#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试PIL库是否正常工作
"""

print("测试PIL库...")
print("="*60)

try:
    from PIL import Image
    import io
    print("✓ PIL库导入成功")
    print(f"  PIL版本: {Image.__version__ if hasattr(Image, '__version__') else '未知'}")
    
    # 测试创建图片
    img = Image.new('RGB', (100, 100), color='red')
    print("✓ 创建测试图片成功")
    
    # 测试保存为JPEG
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=85)
    data = output.getvalue()
    print(f"✓ JPEG编码成功，大小: {len(data)} 字节")
    
    # 测试调整大小
    img_resized = img.resize((50, 50), Image.Resampling.LANCZOS)
    print(f"✓ 图片缩放成功: 100x100 → {img_resized.width}x{img_resized.height}")
    
    print("="*60)
    print("✓ PIL库工作正常！")
    
except ImportError as e:
    print("✗ PIL库未安装")
    print(f"  错误: {e}")
    print("\n安装命令:")
    print("  pip install pillow")
    
except Exception as e:
    print(f"✗ PIL库测试失败: {e}")
    import traceback
    traceback.print_exc()
