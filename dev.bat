@echo off
setlocal EnableDelayedExpansion

REM ===========================================================================
REM  NexHubStudio dev launcher
REM
REM    dev.bat          backend + frontend, REAL data  (frontend calls the backend)
REM    dev.bat mock     frontend only,  MOCK data  (no backend needed)
REM    dev.bat api      frontend only,  REAL data  (backend already running elsewhere)
REM    dev.bat front    same as mock  (kept for habit)
REM    dev.bat back     backend only   -> https://localhost:8443
REM    dev.bat clean    remove generated backend artifacts (no server start)
REM
REM  REAL vs MOCK is decided by which npm script the frontend runs:
REM    npm run dev      -> --mode mock -> VITE_USE_MOCK=true  -> MSW answers /api
REM    npm run dev:api  -> --mode api  -> VITE_USE_MOCK=false -> vite proxies
REM                        /api to https://localhost:8443
REM  Starting the backend and then running the frontend in mock mode would
REM  leave the backend idle, so the combined launch uses dev:api.
REM
REM  "api" exists because backend\ lives only on feature/fullstack-migration.
REM  On master you can still point the frontend at a backend started from that
REM  worktree - the /api proxy is on both branches.
REM
REM  clean removes only regenerable, gitignored output:
REM    backend\build    Gradle compile output
REM    backend\.gradle  Gradle build cache
REM    backend\data     H2 file DB   <- manually entered rows are lost
REM    backend\logs     Spring Boot logs
REM  Source under backend\src is tracked by git and is never touched.
REM  Next start is slower (full compile + Liquibase re-seed).
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

REM which npm script the frontend window runs. Only the combined launch
REM (no argument) has a backend to talk to, so only it uses dev:api.
set "FRONT_SCRIPT=dev"
if /i "!MODE!"=="all" set "FRONT_SCRIPT=dev:api"
if /i "!MODE!"=="api" set "FRONT_SCRIPT=dev:api"

if /i "!MODE!"=="front" goto front
if /i "!MODE!"=="mock"  goto front
if /i "!MODE!"=="api"   goto front
if /i "!MODE!"=="back"  goto back
if /i "!MODE!"=="clean" goto clean
if /i "!MODE!"=="all"   goto back
echo  [X] unknown argument "!MODE!"   (use: mock ^| api ^| front ^| back ^| clean ^| no argument)
endlocal
exit /b 1

REM --------------------------------------------------------------- clean ---
:clean
set "BUSY="
netstat -ano | findstr "LISTENING" | findstr ":8443" >nul 2>&1
if not errorlevel 1 set "BUSY=8443"
netstat -ano | findstr "LISTENING" | findstr ":5173" >nul 2>&1
if errorlevel 1 goto busy_checked
if defined BUSY set "BUSY=!BUSY! 5173"
if not defined BUSY set "BUSY=5173"
:busy_checked
if defined BUSY goto clean_busy

if not exist "%~dp0backend" goto clean_nothing
echo   removing generated artifacts under backend\
call :rmdir_if "%~dp0backend\build"
call :rmdir_if "%~dp0backend\.gradle"
call :rmdir_if "%~dp0backend\data"
call :rmdir_if "%~dp0backend\logs"

REM If nothing is left (i.e. no tracked source, e.g. on master), drop the folder.
dir /a /b "%~dp0backend" 2>nul | findstr "." >nul
if errorlevel 1 goto clean_drop_dir
echo.
echo   backend\src is kept - it is tracked by git.
goto clean_done

:clean_drop_dir
rmdir /q "%~dp0backend" 2>nul
echo   removed: backend\  (was empty - no tracked source on this branch)
goto clean_done

:clean_nothing
echo   nothing to clean - backend\ does not exist.
echo.
endlocal
exit /b 0

:clean_busy
echo  [X] servers are still running on port(s): !BUSY!
echo      Stop them first - running processes hold locks on build\ and data\.
endlocal
exit /b 1

:clean_done
echo.
echo   Done. Next backend start will be slower
echo   (full compile + Liquibase re-creates the schema and seed data).
echo.
endlocal
exit /b 0

:rmdir_if
if not exist "%~1" goto rmdir_skip
rmdir /s /q "%~1" 2>nul
if exist "%~1" echo   [X] failed : %~1
if not exist "%~1" echo   removed  : %~1
goto :eof
:rmdir_skip
echo   skipped  : %~1  (not present)
goto :eof

REM ------------------------------------------------------------- backend ---
:back
if exist "backend\gradlew.bat" goto have_backend
if /i "!MODE!"=="back" goto no_backend
REM backend\ lives only on feature/fullstack-migration. Without it there is
REM nothing for dev:api to talk to, so fall back to mock instead of leaving the
REM frontend pointed at a dead proxy (every /api call would 500).
set "FRONT_SCRIPT=dev"
REM Do not use "!" here: EnableDelayedExpansion consumes it even when escaped.
echo  [*] backend\ not found - starting frontend only, MOCK data.
echo      Need the backend?  git switch feature/fullstack-migration
echo      Backend already running elsewhere?  dev.bat api
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
echo   frontend starting -^> !FRONT_URL!   ^(npm run !FRONT_SCRIPT!^)
start "NexHub Frontend" cmd /k ""%~f0" _child_front "!FRONT_SCRIPT!""

:done
echo.
echo  ----------------------------------------------------------
if /i not "!MODE!"=="back"  echo   frontend : !FRONT_URL!
if defined STARTED_BACK     echo   backend  : !BACK_URL!    health: !BACK_URL!/actuator/health
if /i "!FRONT_SCRIPT!"=="dev:api" echo   data     : REAL   (backend query, H2 file db)
if /i "!FRONT_SCRIPT!"=="dev"     echo   data     : MOCK   (MSW in the browser, no backend)
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
set "FRONT_SCRIPT=%~2"
if "%FRONT_SCRIPT%"=="" set "FRONT_SCRIPT=dev"
echo  [frontend] cwd=%CD%
echo  [frontend] npm run %FRONT_SCRIPT%
call npm run %FRONT_SCRIPT%
echo.
echo  [frontend] process ended (exit %ERRORLEVEL%)
goto :eof
