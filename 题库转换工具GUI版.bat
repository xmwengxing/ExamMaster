@echo off
chcp 65001 >nul
echo ========================================
echo 题库格式转换工具 - GUI版本
echo ========================================
echo.
echo 正在启动图形界面...
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到Python
    echo 请先安装Python 3.7或更高版本
    echo.
    pause
    exit /b 1
)

REM 检查依赖库
echo 检查依赖库...
python -c "import openpyxl" >nul 2>&1
if errorlevel 1 (
    echo 警告: 未安装openpyxl库（Excel支持）
    echo 正在安装...
    pip install openpyxl
)

python -c "import docx" >nul 2>&1
if errorlevel 1 (
    echo 警告: 未安装python-docx库（Word支持）
    echo 正在安装...
    pip install python-docx
)

python -c "import PIL" >nul 2>&1
if errorlevel 1 (
    echo 警告: 未安装pillow库（图片压缩支持）
    echo 正在安装...
    pip install pillow
)

echo.
echo 依赖检查完成，启动GUI...
echo.

REM 启动GUI工具
python scripts\convert-questions-gui.py

if errorlevel 1 (
    echo.
    echo 程序异常退出
    pause
)
