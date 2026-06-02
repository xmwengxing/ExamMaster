#!/usr/bin/env python3
"""
交互式课件增量部署脚本
仅构建并上传课件内容，不触动 ExamMaster 主体代码。

用法:
  python3 deploy-courses.sh              # 部署默认课件 (ai-trainer)
  python3 deploy-courses.sh --course ai-trainer   # 指定课件名

环境变量:
  SSH_HOST      服务器地址 (默认: root@47.104.173.139)
  SSH_PASSWORD  SSH密码   (默认: Jinglang@2026)
  PROJECT_DIR   项目路径   (默认: /www/wwwroot/exammaster.zzzjl.com)
"""

import subprocess, os, sys, time, argparse, shutil

SSH_HOST = os.environ.get('SSH_HOST', 'root@47.104.173.139')
SSH_PASSWORD = os.environ.get('SSH_PASSWORD', 'Jinglang@2026')
PROJECT_DIR = os.environ.get('PROJECT_DIR', '/www/wwwroot/exammaster.zzzjl.com')

parser = argparse.ArgumentParser(description='交互式课件增量部署')
parser.add_argument('--course', default='ai-trainer', help='课件目录名 (默认: ai-trainer)')
args = parser.parse_args()

COURSE_NAME = args.course
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# 课件工程默认在仓库外（不入版本控制）
# 默认查找位置（按顺序）：
#   1. $COURSE_DIR 环境变量
#   2. $HOME/.cache/<course>/presentation/
#   3. 仓库内 ai-trainer-course/presentation/（已废弃，仅兼容旧部署）
COURSE_DIR = os.environ.get('COURSE_DIR', os.path.join(os.path.expanduser('~'), '.cache', COURSE_NAME, 'presentation'))
PRESENTATION_DIR = COURSE_DIR
COURSE_SRC = os.path.join(PRESENTATION_DIR, 'dist')
COURSE_DST_LOCAL = os.path.join(SCRIPT_DIR, 'public', 'courses', COURSE_NAME)
COURSE_DST_DIST = os.path.join(SCRIPT_DIR, 'dist', 'courses', COURSE_NAME)

RSYNC_E = 'ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no'

def setup_ssh():
    s = '/tmp/_ssh_pass.py'
    with open(s, 'w') as f:
        f.write('#!/usr/bin/env python3\nprint("{}")\n'.format(SSH_PASSWORD))
    os.chmod(s, 0o700)
    return {**os.environ, 'SSH_ASKPASS': s, 'SSH_ASKPASS_REQUIRE': 'force'}

ENV = setup_ssh()

def run(cmd, cwd=None, timeout=120):
    r = subprocess.run(cmd, shell=True, env=ENV, capture_output=True, text=True, timeout=timeout, cwd=cwd)
    if r.returncode != 0:
        print(f"  ❌ 错误: {r.stderr[-300:]}")
        sys.exit(1)
    print(r.stdout.strip())

# ============ Main ============
print("=" * 56)
print(f"  交互式课件部署: {COURSE_NAME}")
print(f"  服务器: {SSH_HOST}")
print("=" * 56)

# 1. 构建课件
print(f"\n[1/4] 构建课件 ({PRESENTATION_DIR})...")
if not os.path.isdir(PRESENTATION_DIR):
    print(f"  ❌ 课件目录不存在: {PRESENTATION_DIR}")
    sys.exit(1)

run('npm run build', cwd=PRESENTATION_DIR, timeout=120)
print("  ✅ 课件构建完成")

# 2. 复制到本地 public/courses/ (先清空避免 vite dev 残留)
print(f"\n[2/4] 复制到本地 public/courses/{COURSE_NAME}/...")
os.makedirs(COURSE_DST_LOCAL, exist_ok=True)
# 清理旧 assets/* + audio/* + *.html 防止 vite dev 注入的临时资源污染
for stale in ['assets', 'audio', 'course.json', 'embed.html', 'index.html']:
    p = os.path.join(COURSE_DST_LOCAL, stale)
    if os.path.exists(p):
        if os.path.isdir(p):
            shutil.rmtree(p)
        else:
            os.remove(p)
run(f'cp -r {COURSE_SRC}/* {COURSE_DST_LOCAL}/')
print("  ✅ 本地 public 复制完成")

# 2.5 同步到本地 dist/courses/ (docker nginx 容器 :ro 挂载这个目录，必须同步)
print(f"\n[2.5/4] 同步到本地 dist/courses/{COURSE_NAME}/ (nginx 容器只读挂载)...")
if os.path.exists(COURSE_DST_DIST):
    shutil.rmtree(COURSE_DST_DIST)
shutil.copytree(COURSE_SRC, COURSE_DST_DIST)
print(f"  ✓ 本地 dist 同步完成 → {COURSE_DST_DIST}")

# 3. 上传到服务器 dist/courses/ (nginx 从这里读取静态文件)
print(f"\n[3/4] 上传课件到服务器 dist/courses/{COURSE_NAME}/...")
remote_path = f'{PROJECT_DIR}/dist/courses/{COURSE_NAME}/'
rsync_cmd = f'rsync -avz --delete -e "{RSYNC_E}" {COURSE_SRC}/ {SSH_HOST}:{remote_path}'
r = subprocess.run(rsync_cmd, shell=True, env=ENV, capture_output=True, text=True, timeout=300)
if r.returncode != 0:
    print(f"  ❌ rsync 错误: {r.stderr[-300:]}")
    sys.exit(1)

# 统计
lines = r.stdout.strip().split('\n')
file_count = sum(1 for l in lines if not l.startswith('sending') and not l.startswith('sent') and l.strip())
print(f"  ✅ 已上传 {file_count} 个文件到服务器")

print("\n" + "=" * 56)
print(f"  🎉 课件 {COURSE_NAME} 部署完成！")
print(f"  🌐 https://exammaster.zzzjl.com")
print("=" * 56)
