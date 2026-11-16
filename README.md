==============================================================
 POWERSAVER - Electricity Monitoring and Analysis Platform
 TEAM 7
 Tech: HTML, CSS, JavaScript, React.js (Vite), Python, Django,
       Django REST Framework, SQLite
 Repository: https://github.com/Srinivas0087/PowerSaver
==============================================================

RULES (read first)
  1. Type only the command, never the prompt text before it.
  2. Use Command Prompt (CMD), NOT PowerShell. The prompt must
     NOT start with "PS". If it does, type:  cmd  and press Enter.
  3. You need TWO windows that stay open: one for the backend,
     one for the frontend.


--------------------------------------------------------------
 STEP 1: INSTALL THESE (one time)
--------------------------------------------------------------
  - Git         https://git-scm.com
  - Python 3.10+ https://www.python.org/downloads
                 (tick "Add python.exe to PATH" on first screen)
  - Node.js LTS  https://nodejs.org
  - VS Code      https://code.visualstudio.com (optional)

  Close all windows, open a new CMD, and check:
      git --version
      python --version
      node --version
      npm --version
  Each must print a version number.


--------------------------------------------------------------
 STEP 2: DOWNLOAD THE PROJECT
--------------------------------------------------------------
      cd %USERPROFILE%\Desktop
      git clone https://github.com/Srinivas0087/PowerSaver.git
      cd PowerSaver
      git switch main
      git pull

  If a page (for example Billing) is missing, use:
      git switch frontend-development
      git pull


--------------------------------------------------------------
 STEP 3: RUN THE BACKEND (CMD window 1)
--------------------------------------------------------------
      cd backend
      python -m venv venv
      venv\Scripts\activate
          (prompt must now start with  (venv)  )
      pip install -r requirements.txt
      copy .env.example .env

  Make a secret key:
      python -c "from django.core.management.utils import get_random_secret_key as g; print(g())"

  Copy the long text it prints. Open backend\.env in VS Code
  (command:  code ..  ) and set it like this. KEEP the single
  quotes:

      DJANGO_SECRET_KEY='paste-the-key-here'
      DJANGO_DEBUG=True
      DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
      CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

  Save the file (Ctrl+S). Then:
      python manage.py migrate
      python manage.py runserver

  Expected: Starting development server at http://127.0.0.1:8000/
  LEAVE THIS WINDOW OPEN.

  Optional (in another window, with (venv) active, inside backend):
      python manage.py test
  Expected: all tests end with OK.


--------------------------------------------------------------
 STEP 4: RUN THE FRONTEND (NEW CMD window 2)
--------------------------------------------------------------
      cd %USERPROFILE%\Desktop\PowerSaver\frontend
      npm install

  Create a file named  .env  inside the frontend folder
  (VS Code: right-click frontend, New File, name it .env)
  containing exactly this one line, then save:

      VITE_API_URL=http://127.0.0.1:8000/api

  Then:
      npm run dev

  Expected: Local: http://localhost:5173/
  LEAVE THIS WINDOW OPEN.


--------------------------------------------------------------
 STEP 5: USE THE APP
--------------------------------------------------------------
  1. Open http://localhost:5173/ in Chrome.
  2. Click "Get Started" and register a new account
     (example password: Str0ng!Pass#2026).
  3. Properties: add a property.
  4. Meter Readings: add a meter, then readings 1200 and 1500.
     Consumption shows 300.00 (current minus previous).
  5. Appliances: add an air conditioner, 1500 W, 8 hours/day.
     Estimates show 12 / 84 / 360 kWh (estimates, not meter data).
  6. Bill Estimation: add a tariff (price 6, fixed 100) and
     calculate 300 units. Total shows 1900.00.

  ABOUT THE DATABASE
  The database file (db.sqlite3) is NOT on GitHub. Every laptop
  starts with an empty database created by "migrate", so you
  register your own account. The Dashboard shows clearly labelled
  demonstration data until Phase 13.


--------------------------------------------------------------
 RUNNING IT AGAIN LATER
--------------------------------------------------------------
  CMD 1 (backend):
      cd %USERPROFILE%\Desktop\PowerSaver\backend
      venv\Scripts\activate
      python manage.py runserver

  CMD 2 (frontend):
      cd %USERPROFILE%\Desktop\PowerSaver\frontend
      npm run dev

  To get new code:
      git pull
      pip install -r requirements.txt     (in backend, with venv)
      npm install                         (in frontend)
      python manage.py migrate            (in backend, with venv)


--------------------------------------------------------------
 USEFUL ADDRESSES
--------------------------------------------------------------
  http://localhost:5173/                  The website
  http://127.0.0.1:8000/api/health/       Backend health check
  http://127.0.0.1:8000/admin/            Django admin
        (create admin: python manage.py createsuperuser)


--------------------------------------------------------------
 TROUBLESHOOTING
--------------------------------------------------------------
  "running scripts is disabled"
      You are in PowerShell. Type cmd and press Enter.
  KeyError: 'DJANGO_SECRET_KEY'
      backend\.env is missing, misnamed or not saved.
  Requests go to "undefined/auth/login"
      frontend\.env is missing. Create it, restart npm run dev.
  "Cannot reach the server" in the app
      The backend window is not running.
  CORS error in the browser console
      Frontend must use port 5173; restart the backend.
  Red "Failed to resolve import" screen
      A file is missing or in the wrong folder. Check the name.
  Blank white page
      Press F12, open Console, press F5, read the red text.
  "python" or "pip" not recognized
      Reinstall Python and tick "Add python.exe to PATH".


--------------------------------------------------------------
 PROJECT STRUCTURE
--------------------------------------------------------------
  PowerSaver/
    backend/    Django REST API (users, properties, readings,
                appliances, billing, analytics, notifications)
    frontend/   React app (pages, components, services, context)
    README.md
    README.txt

 BUILD STATUS
  Done : Phases 1-5   setup, landing page, auth forms, dashboard
  Done : Phases 6-8   Django backend, models, REST APIs
  Done : Phase 9      React connected to Django (login, properties)
  Done : Phases 10-12 meter readings, appliances, bill estimation
  To do: Phases 13-16 analytics, alerts, recommendations,
                      forecasting, final testing
==============================================================