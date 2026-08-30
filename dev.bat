@echo off
setlocal EnableDelayedExpansion

REM ===========================================================================
REM  NexHubStudio dev launcher
REM
REM    dev.bat          backend + frontend  (frontend only if backend/ absent)
REM    dev.bat front    frontend only  -> http://localhost:5173
REM    dev.bat back     backend only   -> https://localhost:8443
REM
REM  NOTE: backend/ exists ONLY on the feature/fullstack-migration branch.
REM        On master the frontend runs, but there is no /api proxy,
REM        so API calls fall through to the SPA (index.html).
REM
REM  JDK lookup order:
REM    1) %JAVA_HOME%
REM    2) D:\dev\01.OpenJDK\jdk-21.0.4+7   (default)
REM  Java 21 is required (Spring Boot 3.2).
REM
REM  ASCII only on purpose: cmd.exe parses .bat in the console codepage,
REM  so non-ASCII bytes corrupt line parsing regardless of chcp.
REM ===========================================================================

cd /d "%~dp0"

set "MODE=%~1"
if "%MODE%"=="" set "MODE=all"

set "DEFAULT_JDK=D:\dev\01.OpenJDK\jdk-21.0.4+7"
set "FRONT_URL=http://localhost:5173"
set "BACK_URL=https://localhost:8443"
set "STARTED_BACK="

REM child windows skip the banner and go straight to their server
if /i "!MODE!"=="_child_back"  goto child_back
if /i "!MODE!"=="_child_front" goto child_front

echo.
echo  NexHubStudio dev launcher
echo  ----------------------------------------------------------
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "BRANCH=%%b"
if defined BRANCH echo   branch : !BRANCH!
echo   mode   : !MODE!
echo.

if /i "!MODE!"=="front" goto front
if /i "!MODE!"=="back"  goto back
if /i "!MODE!"=="all"   goto back
echo  [X] unknown argument "!MODE!"   (use: front ^| back ^| no argument)
endlocal
exit /b 1

REM ------------------------------------------------------------- backend ---
:back
if exist "backend\gradlew.bat" goto have_backend
if /i "!MODE!"=="back" goto no_backend
REM Do not use "!" here: EnableDelayedExpansion consumes it even when escaped.
echo  [*] backend\ not found - starting frontend only.
echo      Need the backend?  git switch feature/fullstack-migration
echo.
goto front

:no_backend
echo  [X] backend\ not found.
echo      The backend lives only on feature/fullstack-migration:
echo          git switch feature/fullstack-migration
endlocal
exit /b 1

:have_backend
set "JDK=%JAVA_HOME%"
if not defined JDK set "JDK=!DEFAULT_JDK!"
if exist "!JDK!\bin\java.exe" goto have_jdk
echo  [X] JDK not found at: !JDK!
echo      Set JAVA_HOME to a Java 21 install and retry.
endlocal
exit /b 1

:have_jdk
for /f "tokens=3" %%v in ('""!JDK!\bin\java.exe" -version 2>&1 | findstr /i "version""') do set "JV=%%~v"
echo   JDK    : !JDK!  ^(!JV!^)
echo   backend  starting -^> !BACK_URL!
start "NexHub Backend" cmd /k ""%~f0" _child_back "!JDK!""
set "STARTED_BACK=1"

if /i "!MODE!"=="back" goto done

REM ------------------------------------------------------------ frontend ---
:front
if not exist "node_modules" (
  echo   node_modules missing - running npm install
  call npm install
  if errorlevel 1 goto npm_failed
)
echo   frontend starting -^> !FRONT_URL!
start "NexHub Frontend" cmd /k ""%~f0" _child_front"

:done
echo.
echo  ----------------------------------------------------------
if /i not "!MODE!"=="back"  echo   frontend : !FRONT_URL!
if defined STARTED_BACK     echo   backend  : !BACK_URL!    health: !BACK_URL!/actuator/health
echo.
echo   Each server runs in its own window. Close it or press Ctrl+C to stop.
echo.
endlocal
exit /b 0

:npm_failed
echo  [X] npm install failed
endlocal
exit /b 1

REM ------------------------------------------------- child windows ---------
REM  Run in their own window. Plain lines only - no "&&" chaining, which
REM  breaks on quoted paths and on a PATH containing special characters.

:child_back
set "JDK=%~2"
set "JAVA_HOME=%JDK%"
set "PATH=%JDK%\bin;%PATH%"
cd /d "%~dp0backend"
echo  [backend] JAVA_HOME=%JAVA_HOME%
echo  [backend] cwd=%CD%
REM Call with an explicit path: cmd does not search the current directory when
REM NoDefaultCurrentDirectoryInExePath is set (happens when launched via PowerShell).
call "%~dp0backend\gradlew.bat" bootRun --console=plain
echo.
echo  [backend] process ended (exit %ERRORLEVEL%)
goto :eof

:child_front
cd /d "%~dp0"
echo  [frontend] cwd=%CD%
call npm run dev
echo.
echo  [frontend] process ended (exit %ERRORLEVEL%)
goto :eof
