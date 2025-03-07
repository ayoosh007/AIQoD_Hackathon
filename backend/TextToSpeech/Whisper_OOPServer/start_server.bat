@echo off
echo --------------------------------------
echo Setting up the environment
echo --------------------------------------
call whisper_venv\Scripts\activate.bat

echo --------------------------------------
echo Environment is now Active
echo --------------------------------------

echo --------------------------------------
echo Starting The Whisper_server
echo --------------------------------------
echo.
cd myoopsprj
python manage.py runserver

pause
