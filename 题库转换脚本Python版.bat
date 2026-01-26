@echo off
chcp 65001 >nul
echo ========================================
echo 题目格式转换工具 - Python版本
echo ========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python，请先安装Python
    echo 下载地址：https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/3] 检查依赖...
echo.

REM 检查是否已安装openpyxl和python-docx
python -c "import openpyxl" >nul 2>&1
set OPENPYXL_INSTALLED=%errorlevel%

python -c "import docx" >nul 2>&1
set DOCX_INSTALLED=%errorlevel%

if %OPENPYXL_INSTALLED% neq 0 (
    if %DOCX_INSTALLED% neq 0 (
        echo [提示] 正在安装依赖包 openpyxl 和 python-docx...
        echo.
        pip install openpyxl python-docx
        if errorlevel 1 (
            echo.
            echo [错误] 依赖安装失败，请检查网络连接
            pause
            exit /b 1
        )
        echo.
        echo [成功] 依赖安装完成
    ) else (
        echo [提示] 正在安装 openpyxl...
        pip install openpyxl
    )
) else (
    if %DOCX_INSTALLED% neq 0 (
        echo [提示] 正在安装 python-docx...
        pip install python-docx
    ) else (
        echo [成功] 依赖已安装
    )
)

echo.
echo [2/3] 检查原始文件...
echo.

set FILE_COUNT=0
if exist "原始题库1.xlsx" (
    echo [找到] 原始题库1.xlsx
    set /a FILE_COUNT+=1
)
if exist "原始题库2.xlsx" (
    echo [找到] 原始题库2.xlsx
    set /a FILE_COUNT+=1
)
if exist "原始题库3.docx" (
    echo [找到] 原始题库3.docx
    set /a FILE_COUNT+=1
)

if %FILE_COUNT%==0 (
    echo.
    echo [警告] 未找到任何原始题库文件
    echo 请将以下文件放在项目根目录：
    echo   - 原始题库1.xlsx
    echo   - 原始题库2.xlsx
    echo   - 原始题库3.docx
    echo.
    echo 提示：文件名需以"原始题库"开头
    echo.
    pause
    exit /b 1
)

echo.
echo [3/4] 配置单元/章节信息...
echo.
echo 提示：如果原始文件中没有单元/章节信息，可以在此手动指定
echo       例如：九上第一单元、第二章、Unit 1 等
echo       直接回车则不填入（使用文件中的原始信息）
echo.
set /p CHAPTER="请输入单元/章节名称（可选）: "

if not "%CHAPTER%"=="" (
    echo.
    echo [已设置] 将为所有题目添加章节信息：%CHAPTER%
) else (
    echo.
    echo [跳过] 将使用文件中的原始章节信息
)

echo.
echo [4/4] 开始转换...
echo.
echo ========================================
echo.

REM 运行Python转换脚本，传递章节参数
if not "%CHAPTER%"=="" (
    python scripts/convert-questions.py --chapter "%CHAPTER%"
) else (
    python scripts/convert-questions.py
)

if errorlevel 1 (
    echo.
    echo [错误] 转换过程中出现错误
    echo 请查看上方错误信息
) else (
    echo.
    echo ========================================
    echo [完成] 转换成功！
    echo ========================================
    echo.
    echo 生成的文件：
    if exist "转换后的题目-合并.csv" echo   ✓ 转换后的题目-合并.csv （新格式：支持填空题、简答题、单元/章节）
    if exist "转换后的题目-单选题.csv" echo   ✓ 转换后的题目-单选题.csv
    if exist "转换后的题目-多选题.csv" echo   ✓ 转换后的题目-多选题.csv
    if exist "转换后的题目-判断题.csv" echo   ✓ 转换后的题目-判断题.csv
    echo.
    echo 提示：生成的CSV文件已更新为新格式（8个字段）
    echo       包含：题型、题干、选项、答案、解析、单元/章节、填空配置、简答参考答案
    echo       请检查格式正确后再导入系统
)

echo.
pause
