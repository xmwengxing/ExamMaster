@echo off
REM ========================================
REM GitHub Sync Script (Improved)
REM ========================================

echo.
echo ====================================
echo      GitHub Sync Script
echo ====================================
echo.

REM Check if in Git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not a Git repository
    pause
    exit /b 1
)

REM Set Git config for Chinese filenames
git config core.quotepath false

REM Get current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Current branch: %CURRENT_BRANCH%
echo.

REM Show change statistics
echo Change statistics:
echo ----------------------------------------
for /f %%i in ('git status --short ^| find /c /v ""') do set CHANGE_COUNT=%%i
echo Total files changed: %CHANGE_COUNT%
echo.

REM Show changes (first 20)
echo Changed files (first 20):
echo ----------------------------------------
git status --short | more /e +0
echo ----------------------------------------
echo.

REM Ask to commit
set /p CONFIRM="Commit all changes? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo [INFO] Commit cancelled
    pause
    exit /b 0
)

REM Add all changes
echo.
echo Adding all changes to staging area...
git add -A
if errorlevel 1 (
    echo [ERROR] Failed to add files
    pause
    exit /b 1
)
echo [OK] Added %CHANGE_COUNT% files

REM Input commit message
echo.
echo Quick commit messages:
echo    1 - Fix AI analysis authentication issue
echo    2 - Refactor server to modular architecture
echo    3 - Update documentation and configuration
echo    4 - Fix bugs and optimize performance
echo    5 - Custom commit message
echo.
set /p COMMIT_CHOICE="Select commit type (1-5): "

if "%COMMIT_CHOICE%"=="1" (
    set "COMMIT_MSG=Fix AI analysis authentication - Add auth middleware and nginx Authorization header"
) else if "%COMMIT_CHOICE%"=="2" (
    set "COMMIT_MSG=Refactor server architecture - Rename server-new.js to server.js"
) else if "%COMMIT_CHOICE%"=="3" (
    set "COMMIT_MSG=Update docs and config - Add server architecture guide"
) else if "%COMMIT_CHOICE%"=="4" (
    set "COMMIT_MSG=Fix bugs and optimize performance - Multiple improvements"
) else if "%COMMIT_CHOICE%"=="5" (
    set /p COMMIT_MSG="Enter custom commit message: "
    if "!COMMIT_MSG!"=="" (
        echo [ERROR] Commit message cannot be empty
        pause
        exit /b 1
    )
) else (
    echo [ERROR] Invalid choice
    pause
    exit /b 1
)

REM Commit changes
echo.
echo Committing: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo [ERROR] Commit failed
    pause
    exit /b 1
)
echo [OK] Commit successful

REM Ask to push
echo.
set /p PUSH_CONFIRM="Push to remote repository? (y/n): "
if /i not "%PUSH_CONFIRM%"=="y" (
    echo [INFO] Push skipped
    pause
    exit /b 0
)

REM Check remote repository
git remote -v | findstr "origin" >nul
if errorlevel 1 (
    echo [ERROR] Remote repository 'origin' not configured
    echo.
    echo Please configure remote repository:
    echo git remote add origin [your-repo-url]
    pause
    exit /b 1
)

REM Fetch remote updates
echo.
echo Checking remote updates...
git fetch origin %CURRENT_BRANCH%
if errorlevel 1 (
    echo [WARN] Cannot fetch remote updates, continuing...
) else (
    REM Check if behind remote
    for /f %%i in ('git rev-list HEAD..origin/%CURRENT_BRANCH% --count') do set BEHIND_COUNT=%%i
    if not "%BEHIND_COUNT%"=="0" (
        echo [WARN] Remote has %BEHIND_COUNT% new commits
        set /p PULL_CONFIRM="Pull remote changes first? (y/n): "
        if /i "!PULL_CONFIRM!"=="y" (
            echo.
            echo Pulling remote changes...
            git pull origin %CURRENT_BRANCH% --rebase
            if errorlevel 1 (
                echo [ERROR] Pull failed, conflicts may need manual resolution
                echo.
                echo After resolving conflicts, run:
                echo   git rebase --continue
                echo   git push origin %CURRENT_BRANCH%
                pause
                exit /b 1
            )
        )
    )
)

REM Push to remote
echo.
echo Pushing to origin/%CURRENT_BRANCH%...
git push origin %CURRENT_BRANCH%
if errorlevel 1 (
    echo.
    echo [ERROR] Push failed
    echo.
    echo Possible reasons:
    echo   1. Network connection issue
    echo   2. No push permission
    echo   3. Remote branch is protected
    echo   4. Need to pull remote changes first
    echo.
    echo Please check error message and resolve manually
    pause
    exit /b 1
)

echo.
echo [OK] Sync completed!
echo.
echo Recent commits:
git log --oneline -5
echo.
echo Remote: https://github.com/xmwengxing/EduMaster_postgresql
echo Branch: %CURRENT_BRANCH%
echo.

pause
