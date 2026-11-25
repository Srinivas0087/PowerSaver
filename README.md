# PowerSaver
<<<<<<< HEAD
Electricity Monitoring and Analysis Platform

## Social sign-in setup

Google and Apple sign-in require provider client IDs in both `frontend/.env`
and `backend/.env`. Set `VITE_GOOGLE_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_ID`
and `VITE_APPLE_CLIENT_ID` / `APPLE_OAUTH_CLIENT_ID` to the matching IDs.
For Google, authorize the development frontend origin (for example,
`http://localhost:5173`) in the OAuth client's JavaScript origins. For Apple,
create a Services ID and set `VITE_APPLE_REDIRECT_URI` to its registered return
URL. Restart both development servers after changing environment files. Keep
provider secrets out of frontend variables.

## Status
- [x] Phase 1: Project setup
- [x] Phase 2: React frontend setup
- [x] Phase 3: Landing page and navigation
=======

**Electricity Monitoring and Analysis Platform**

PowerSaver is a full-stack web application that helps people understand how much electricity they use, where it goes, and what their next bill is likely to be. Users register an account, add their properties (a home, hotel, shop or commercial facility), attach electricity meters, record dated meter readings, list their appliances, define a tariff, and then receive analytics charts, bill estimates, a month-end forecast, alerts and energy-saving tips.

| | |
|---|---|
| **Frontend** | React 19, Vite 8, React Router 7, Axios, Bootstrap 5, Recharts |
| **Backend** | Python, Django 6.1, Django REST Framework 3.18 |
| **Database** | SQLite |
| **Authentication** | DRF token authentication |
| **API style** | REST, JSON over HTTP |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement and Objectives](#2-problem-statement-and-objectives)
3. [Features and Modules](#3-features-and-modules)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Project Structure](#6-project-structure)
7. [Installation and Setup](#7-installation-and-setup)
8. [Configuration](#8-configuration)
9. [Database Design](#9-database-design)
10. [Backend in Detail](#10-backend-in-detail)
11. [Business Logic and Worked Examples](#11-business-logic-and-worked-examples)
12. [API Reference](#12-api-reference)
13. [Frontend in Detail](#13-frontend-in-detail)
14. [User Workflow](#14-user-workflow)
15. [Security](#15-security)
16. [Testing](#16-testing)
17. [Error Handling](#17-error-handling)
18. [Troubleshooting](#18-troubleshooting)
19. [Deployment Guide](#19-deployment-guide)
20. [Limitations, Known Issues and Future Work](#20-limitations-known-issues-and-future-work)
21. [Development History](#21-development-history)
22. [Glossary](#22-glossary)

---

## 1. Project Overview

### 1.1 What is PowerSaver?

PowerSaver turns raw electricity meter readings into useful information. Instead of waiting for the monthly bill, a user can see their consumption by day, by month and by property, estimate what each appliance costs them, preview the next bill, and get warned when usage looks unusual or approaches a limit they set.

### 1.2 Why was it developed?

Most households and small businesses only learn how much electricity they used when the bill arrives, at which point it is too late to change anything. It is also hard to know which appliances are responsible for the usage. PowerSaver was built to make consumption visible, measurable and manageable.

### 1.3 Intended users

The application supports four property types, defined in the `Property` model:

| Property type | Example |
|---|---|
| Residential | A house or apartment |
| Hotel | A hotel with several meters |
| Small Business | A shop or small office |
| Commercial Facility | A larger commercial building |

A single user can own several properties, and each property can have several meters.

### 1.4 What makes it useful?

- Consumption is calculated automatically from consecutive meter readings.
- Impossible readings (negative, going backwards, or duplicated for a date) are rejected.
- Bill estimates support both flat-rate and slab (tiered) tariffs.
- The forecast projects the current month's usage and bill from recent history.
- Every saving tip explains the rule that triggered it.
- Each user can only see and change their own data.

> **Important:** appliance figures and bill amounts are *estimates*. They are not meter data and may differ from the electricity provider's real bill. The forecast, alerts and tips are rule-based calculations, not artificial intelligence.

---

## 2. Problem Statement and Objectives

### 2.1 Problems with traditional electricity monitoring

1. **Difficulty tracking consumption.** Readings are noted on paper, or not at all.
2. **Lack of awareness.** Users do not know their daily or weekly usage pattern.
3. **Wastage.** Appliances are left running because their cost is invisible.
4. **High-consumption appliances are hard to identify.** There is no breakdown by appliance.
5. **Poor energy management.** There is no limit, warning or projection to plan against.

### 2.2 How PowerSaver addresses them

| Problem | PowerSaver feature |
|---|---|
| Difficulty tracking consumption | Meters and dated readings; consumption is the current reading minus the previous reading |
| Lack of awareness | Analytics for the last 7 days, last 6 months and each property |
| Wastage | Appliance usage estimates and saving tips |
| Finding heavy appliances | Appliance summary by category; tips for appliances using 50 kWh or more per month |
| Poor energy management | Monthly limit per property, limit alerts, sudden-increase alerts, month-end forecast |

### 2.3 Objectives

- Let users record and review electricity readings per meter.
- Estimate appliance consumption from power rating and usage hours.
- Estimate bills using the user's own tariff.
- Forecast month-end consumption and bill.
- Warn users early and suggest ways to save.
- Keep every user's data private.

---

## 3. Features and Modules

The backend is split into seven Django apps. Each app owns its models, serializers, views and URLs.

| Module (Django app) | Purpose | Main inputs | Main outputs |
|---|---|---|---|
| `users` | Registration, login, logout, profile | username, email, password, full name, phone | token and user data |
| `properties` | Manage properties and monthly limits | name, type, address, city, limit | property list |
| `readings` | Meters and meter readings | meter number; reading date and value | previous reading and consumption |
| `appliances` | Appliance list and usage estimates | name, category, watts, quantity, daily hours | daily, weekly and monthly kWh |
| `billing` | Tariffs and bill estimates | rate, slabs, fixed and other charges; period | energy, fixed, other and total charges |
| `analytics` | Consumption summary and forecast | meter readings | chart data and projections |
| `notifications` | Alerts and recommendations | readings, property limit, appliances | alert and tip records |

How the modules connect:

- **Properties** are the parent of everything except the user profile.
- **Readings** feed **Analytics**, **Billing**, the **Forecast** and **Alerts**.
- **Appliances** feed **Recommendations**.
- **Tariffs** feed both **Billing** and the **Forecast** (for the projected bill).
- **Users** provides the token that protects every other API.

---

## 4. Technology Stack

### 4.1 Frontend

| Technology | Version | Why it was selected |
|---|---|---|
| HTML, CSS, JavaScript | n/a | The foundation of every web page; React compiles JSX into JavaScript that builds the HTML |
| React | 19 | Component-based UI; each screen is built from reusable pieces |
| Vite | 8 | Very fast development server and production build tool |
| React Router | 7 | Page navigation and protected routes |
| Axios | 1.x | HTTP client with interceptors, used to attach the login token to every request |
| Bootstrap and Bootstrap Icons | 5.3 / 1.13 | Responsive layout, styling and icons without writing much CSS |
| Recharts | 3 | Line, bar and pie charts |
| oxlint | 1.x | Fast linting (`npm run lint`) |

### 4.2 Backend

| Technology | Version | Why it was selected |
|---|---|---|
| Python | 3.12 or newer | Readable language with a strong web ecosystem |
| Django | 6.1.3 | Built-in ORM, authentication, admin site, migrations and security defaults |
| Django REST Framework | 3.18.3 | Serializers, ViewSets, routers, permissions and token authentication |
| django-cors-headers | 4.9.0 | Allows the React app (a different origin) to call the API |
| python-dotenv | 1.2.4 | Loads secrets and settings from a `.env` file |
| asgiref, sqlparse, tzdata | 3.13 / 0.6 / 2026.6 | Installed automatically because Django depends on them |

### 4.3 Database

| Technology | Why it was selected |
|---|---|
| SQLite | A file-based database that ships with Python. No server or setup is needed, which makes it ideal for development, learning and demonstrations. |

### 4.4 How the three layers communicate

1. The browser loads the React application.
2. React calls the Django REST API with Axios, sending JSON and an `Authorization: Token ...` header.
3. Django (through DRF) validates the request and uses the ORM to read or write SQLite.
4. Django returns JSON, and React renders it as tables, forms and charts.

---

## 5. System Architecture

### 5.1 Overview

```
 +-------------------+     HTTP + JSON      +----------------------+
 |  React Frontend   | -------------------> |   Django + DRF       |
 |  (Vite, :5173)    |  Authorization:      |   (runserver, :8000) |
 |                   |  Token <key>         |                      |
 |  pages            |                      |  urls -> ViewSet     |
 |  services (Axios) | <------------------- |  -> Serializer       |
 +-------------------+     JSON response    +----------+-----------+
                                                       |  ORM
                                                       v
                                              +------------------+
                                              |  SQLite          |
                                              |  db.sqlite3      |
                                              +------------------+
```

### 5.2 Frontend architecture

- `pages/` contains one component per screen.
- `components/` contains the layouts (public layout with navbar and footer, dashboard layout with sidebar), `ProtectedRoute`, `StatCard`, `PasswordInput` and similar shared pieces.
- `services/` contains one file per API area. Pages never call Axios directly for most operations; they call functions such as `listProperties()` or `createReading()`.
- `context/AuthContext.jsx` stores the logged-in user and exposes `login`, `register` and `logout`.

### 5.3 Backend architecture

- `powersaver/urls.py` mounts every app under `/api/`.
- Each app follows the same pattern: **model**, **serializer**, **view or ViewSet**, **URL router**.
- Calculations that go beyond simple CRUD live in `services.py` files (`billing`, `analytics`, `notifications`) so views stay small.

### 5.4 Database architecture

One SQLite file (`backend/db.sqlite3`) holds all tables. Django migrations (`0001_initial.py` in each app) create the tables from the models. The file is excluded from Git by `.gitignore`, so each machine creates its own with `python manage.py migrate`.

### 5.5 Complete request-response example: saving a meter reading

1. The user fills the form in `Readings.jsx` and presses save.
2. The page calls `createReading(data)` from `readingService.js`.
3. Axios sends `POST /api/readings/` with the JSON body and the token header (added by the interceptor in `api.js`).
4. Django's CORS middleware accepts the request because the origin is allowed.
5. The URL router sends it to `MeterReadingViewSet`.
6. DRF checks the token (`TokenAuthentication`) and permission (`IsAuthenticated`).
7. `MeterReadingSerializer.validate()` builds a temporary `MeterReading` and calls `full_clean()`, which runs the model rules (not negative, not lower than the previous reading, not higher than the next reading, one reading per meter per date).
8. If valid, the ORM runs an `INSERT` into SQLite.
9. The serializer adds `previous_reading` and `consumption` and Django returns `201 Created` with JSON.
10. React updates the readings table.

---

## 6. Project Structure

```
PowerSaver/
├── README.md
├── .gitignore
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── powersaver/
│   │   ├── settings.py          # configuration, DRF, CORS, SQLite
│   │   ├── urls.py              # mounts all apps under /api/
│   │   ├── wsgi.py / asgi.py
│   ├── users/                   # Profile model, auth views, serializers, tests
│   ├── properties/              # Property model and ViewSet
│   ├── readings/                # ElectricityMeter, MeterReading
│   ├── appliances/              # Appliance, ApplianceUsageEstimate
│   ├── billing/                 # Tariff, BillEstimate, services.py
│   ├── analytics/               # services.py, forecast_services.py, views
│   └── notifications/           # Alert, Recommendation, services.py
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx              # all routes
        ├── index.css
        ├── pages/               # Landing, Login, Register, Dashboard, Properties,
        │                        # Readings, Appliances, Analytics, Billing, Alerts,
        │                        # Recommendations, Forecast, Profile, NotFound
        ├── components/          # Navbar, Footer, DashboardLayout, ProtectedRoute, ...
        ├── services/            # api.js and one service file per API area
        ├── context/             # AuthContext.jsx
        └── data/                # demoData.js (used by the Dashboard)
```

Each backend app also contains `admin.py`, `apps.py`, `tests.py` and a `migrations/` folder.

---

## 7. Installation and Setup

### 7.1 Prerequisites

- Python 3.12 or newer
- A recent Node.js LTS release and npm
- Git

### 7.2 Get the code

```bash
git clone https://github.com/Srinivas0087/PowerSaver.git
cd PowerSaver
```

### 7.3 Backend

```bash
cd backend

# 1. Create and activate a virtual environment (recommended)
python -m venv venv
# Windows:      venv\Scripts\activate
# macOS/Linux:  source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create the environment file
cp .env.example .env          # Windows: copy .env.example .env

# 4. Edit .env and set DJANGO_SECRET_KEY to a long random value

# 5. Create the database tables
python manage.py migrate

# 6. (Optional) create an admin user for /admin/
python manage.py createsuperuser

# 7. Start the server
python manage.py runserver
```

The API is now available at `http://127.0.0.1:8000/api/`. Visit `http://127.0.0.1:8000/api/health/` and you should see:

```json
{"status": "ok", "service": "PowerSaver backend"}
```

### 7.4 Frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env          # Windows: copy .env.example .env
npm run dev
```

The app is available at `http://localhost:5173`.

### 7.5 First run checklist

1. Open `http://localhost:5173` and click **Register**.
2. Create an account; you are logged in automatically.
3. Go to **Properties** and add a property.
4. Go to **Readings**, add a meter, then add at least two readings on different dates.
5. Open **Analytics**, **Billing** and **Forecast** to see results.

### 7.6 Useful commands

| Command | Where | Purpose |
|---|---|---|
| `python manage.py runserver` | backend | Start the API |
| `python manage.py migrate` | backend | Apply database migrations |
| `python manage.py makemigrations` | backend | Create migrations after changing models |
| `python manage.py test` | backend | Run the 38 automated tests |
| `python manage.py createsuperuser` | backend | Create an admin account |
| `npm run dev` | frontend | Start the Vite dev server |
| `npm run build` | frontend | Create a production build in `dist/` |
| `npm run preview` | frontend | Preview the production build |
| `npm run lint` | frontend | Run oxlint |

---

## 8. Configuration

### 8.1 Backend environment variables (`backend/.env`)

`settings.py` loads this file with python-dotenv.

| Variable | Example | Meaning |
|---|---|---|
| `DJANGO_SECRET_KEY` | `a-long-random-string` | Django's secret key. **Required**: the server will not start without it. |
| `DJANGO_DEBUG` | `True` | Debug mode is on only when the value is exactly `True`. Use `False` in production. |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated host names the server will answer to |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated frontend origins allowed to call the API |

### 8.2 Frontend environment variable (`frontend/.env`)

| Variable | Example | Meaning |
|---|---|---|
| `VITE_API_URL` | `http://127.0.0.1:8000/api` | Base URL of the backend API, read in `services/api.js` |

Vite only exposes variables that start with `VITE_`. After changing `.env`, restart `npm run dev`.

### 8.3 Key Django settings

| Setting | Value | Notes |
|---|---|---|
| `INSTALLED_APPS` | Django contrib apps, `rest_framework`, `rest_framework.authtoken`, `corsheaders`, and the seven PowerSaver apps | |
| `DATABASES` | `django.db.backends.sqlite3`, file `BASE_DIR / 'db.sqlite3'` | |
| `REST_FRAMEWORK` | `TokenAuthentication` by default; `IsAuthenticated` by default | Every endpoint needs a token unless a view opts out |
| `CORS_ALLOWED_ORIGINS` | built from the environment variable | |
| `AUTH_PASSWORD_VALIDATORS` | similarity, minimum length, common password, numeric-only | |
| `TIME_ZONE` / `USE_TZ` | `UTC` / `True` | |

---

## 9. Database Design

### 9.1 SQLite and Django

SQLite stores the database in one file. Django connects through the built-in `sqlite3` engine, so no driver needs to be installed. You write Python model classes; Django's ORM generates and runs the SQL. Running `makemigrations` creates migration files describing model changes, and `migrate` applies them to the database.

### 9.2 Entity relationships

```
User (Django auth)
 ├── 1:1 ── Profile
 ├── 1:1 ── Token (DRF authtoken)
 └── 1:N ── Property
              ├── 1:N ── ElectricityMeter ── 1:N ── MeterReading
              ├── 1:N ── Appliance ───────── 1:N ── ApplianceUsageEstimate
              ├── 1:N ── Tariff ──────────── 1:N ── BillEstimate (also FK to Property)
              ├── 1:N ── Alert
              └── 1:N ── Recommendation
```

Deleting a user deletes their properties, and deleting a property deletes everything beneath it (`on_delete=CASCADE`). The one exception is `BillEstimate.tariff`, which uses `SET_NULL`, so saved estimates survive if their tariff is deleted.

### 9.3 Tables and fields

All names below are taken from the model files.

#### `users.Profile`

| Field | Type | Notes |
|---|---|---|
| `user` | OneToOne to User | cascade delete |
| `phone` | Char(20) | optional |
| `created_at` | DateTime | automatic |

Django's built-in `User` stores username, email, hashed password and `first_name`. PowerSaver stores the user's full name in `first_name`.

#### `properties.Property`

| Field | Type | Notes |
|---|---|---|
| `owner` | ForeignKey to User | cascade delete |
| `name` | Char(100) | unique per owner |
| `property_type` | Char(20) | RESIDENTIAL, HOTEL, SMALL_BUSINESS, COMMERCIAL |
| `address` | Text | optional |
| `city` | Char(100) | optional |
| `monthly_limit_kwh` | Decimal(10,2) | optional, must be 0 or more; used for alerts |
| `created_at`, `updated_at` | DateTime | automatic |

Constraint: `unique_property_name_per_owner`.

#### `readings.ElectricityMeter`

| Field | Type | Notes |
|---|---|---|
| `property` | ForeignKey | cascade delete |
| `meter_number` | Char(50) | unique per property |
| `description` | Char(200) | optional |
| `is_active` | Boolean | default True; only active meters are used in calculations |
| `created_at` | DateTime | automatic |

#### `readings.MeterReading`

| Field | Type | Notes |
|---|---|---|
| `meter` | ForeignKey | cascade delete |
| `reading_date` | Date | |
| `reading_value` | Decimal(12,2) | kWh, must be 0 or more |
| `notes` | Char(200) | optional |
| `created_at` | DateTime | automatic |

Constraints: `unique_reading_per_meter_per_date` and `reading_value_not_negative`. The model's `clean()` method also rejects a value lower than the previous reading or higher than the next reading, and `save()` always runs `full_clean()`.

#### `appliances.Appliance`

| Field | Type | Notes |
|---|---|---|
| `property` | ForeignKey | cascade delete |
| `name` | Char(100) | |
| `category` | Char(20) | LIGHTING, COOLING, HEATING, KITCHEN, ENTERTAINMENT, OFFICE, LAUNDRY, OTHER |
| `power_watts` | PositiveInteger | at least 1 |
| `quantity` | PositiveInteger | default 1, at least 1 |
| `daily_hours` | Decimal(4,2) | 0 to 24 |
| `created_at` | DateTime | automatic |

#### `appliances.ApplianceUsageEstimate`

A saved snapshot of an appliance's estimated usage (`daily_kwh`, `weekly_kwh`, `monthly_kwh`, `calculated_at`), created by `ApplianceUsageEstimate.create_from(appliance)`.

#### `billing.Tariff`

| Field | Type | Notes |
|---|---|---|
| `property` | ForeignKey | cascade delete |
| `name` | Char(100) | default "My tariff" |
| `rate_per_unit` | Decimal(8,2) | used when no slabs are defined |
| `fixed_charge` | Decimal(10,2) | default 0 |
| `other_charges` | Decimal(10,2) | default 0 |
| `slabs` | JSON list | for example `[{"up_to": 100, "rate": 4.5}, {"up_to": null, "rate": 6}]` |
| `is_active` | Boolean | default True |
| `created_at` | DateTime | automatic |

#### `billing.BillEstimate`

| Field | Type | Notes |
|---|---|---|
| `property` | ForeignKey | cascade delete |
| `tariff` | ForeignKey | `SET_NULL`, optional |
| `period_start`, `period_end` | Date | |
| `units_consumed` | Decimal(12,2) | |
| `energy_charges`, `fixed_charges`, `other_charges`, `total_amount` | Decimal(12,2) | |
| `created_at` | DateTime | automatic |

#### `notifications.Alert`

| Field | Type | Notes |
|---|---|---|
| `property` | ForeignKey | cascade delete |
| `alert_type` | Char(20) | SUDDEN_INCREASE, UNUSUAL_PATTERN, LIMIT_EXCEEDED, HIGH_MONTHLY |
| `severity` | Char(10) | INFO, WARNING, CRITICAL |
| `message` | Text | |
| `is_read` | Boolean | default False |
| `created_at` | DateTime | automatic |

#### `notifications.Recommendation`

| Field | Type | Notes |
|---|---|---|
| `property` | ForeignKey | cascade delete |
| `title` | Char(150) | |
| `message` | Text | |
| `reason` | Text | which rule or data triggered the tip |
| `priority` | Char(10) | LOW, MEDIUM, HIGH |
| `created_at` | DateTime | automatic |

> The alert type `UNUSUAL_PATTERN` exists in the model, but no current rule generates it.

### 9.4 CRUD operations

| Operation | HTTP method | Django ORM | SQL |
|---|---|---|---|
| Create | POST | `serializer.save()` | INSERT |
| Read | GET | `queryset.filter(...)` | SELECT |
| Update | PUT / PATCH | `serializer.save()` on an instance | UPDATE |
| Delete | DELETE | `instance.delete()` | DELETE |

---

## 10. Backend in Detail

### 10.1 `users`: authentication and profile

- **RegisterView** validates `full_name`, `username` (3 to 20 letters, digits or underscores), `email`, `password` and `confirm_password`. Usernames and emails must be unique (case-insensitive). Django's password validators run. The user is created with a hashed password, a `Profile` is created, and a token is returned.
- **LoginView** authenticates a username and password. A wrong username and a wrong password return the same message, so attackers cannot tell which was wrong.
- **LogoutView** deletes the token that made the request.
- **ProfileView** supports `GET` and `PATCH` only, and always works on the logged-in user.

### 10.2 `properties`

`PropertyViewSet` is a `ModelViewSet`. `get_queryset()` returns only the logged-in user's properties, and `perform_create()` sets `owner` from the request, so the client can never choose the owner. The serializer rejects a duplicate name (case-insensitive) for the same owner.

### 10.3 `readings`

- `ElectricityMeterViewSet` lists meters of the user's properties and supports `?property=`. The serializer restricts the `property` choice to the user's own properties and rejects duplicate meter numbers within a property.
- `MeterReadingViewSet` supports `?meter=` and `?property=`. The serializer returns `meter_number`, `previous_reading` and `consumption`, and runs the model's validation rules (see 9.3).

### 10.4 `appliances`

`ApplianceViewSet` supports `?property=` and an extra `summary` action that returns estimated daily, weekly and monthly kWh and a monthly breakdown by category, sorted from highest to lowest. Every response is labelled `data_source: "estimate"`.

### 10.5 `billing`

- `TariffViewSet` is full CRUD. The serializer validates slabs: the list must contain objects, each with a non-negative numeric `rate`; limits must be positive and increasing; a slab with `up_to` of `null` must be last.
- `BillEstimateViewSet` is read-only.
- `GenerateBillView` (`POST /api/billing/generate/`) validates that the period end is not before the start and that the tariff belongs to the chosen property, then calls `generate_bill_estimate()` and saves a `BillEstimate`.

### 10.6 `analytics`

- `AnalyticsSummaryView` returns totals, current and previous month consumption, daily data for the last 7 days, monthly data for the last 6 months (including the current month) and consumption per property.
- `ConsumptionForecastView` returns a per-property and overall forecast for the current month.

### 10.7 `notifications`

`AlertViewSet` and `RecommendationViewSet` are read-only, with extra actions: `generate` (creates alerts and tips) and, for alerts, `mark_read`. Duplicate alerts and tips are not created twice on the same day.

### 10.8 Django admin

`/admin/` is available for the models of `users`, `properties`, `readings`, `appliances`, `billing` and `notifications`. Create an admin user with `createsuperuser`.

---

## 11. Business Logic and Worked Examples

### 11.1 Consumption from meter readings

```
consumption = current reading - previous reading
```

The first reading of a meter has no consumption because there is nothing to compare it with.

| Date | Reading (kWh) | Consumption |
|---|---|---|
| 1 Jan | 1000 | none (first reading) |
| 8 Jan | 1056 | 56 |
| 15 Jan | 1119 | 63 |

### 11.2 Appliance estimate

```
kWh per day   = (watts x quantity x daily hours) / 1000
kWh per week  = kWh per day x 7
kWh per month = kWh per day x 30
```

Example: an air conditioner of 1500 W, quantity 1, used 8 hours a day uses 1500 x 1 x 8 / 1000 = **12 kWh per day**, **84 kWh per week** and **360 kWh per month**.

### 11.3 Bill estimate

**Flat rate** (no slabs): `energy charges = units x rate_per_unit`.

**Slab pricing** fills each slab in order. Example slabs: first 100 units at 4.50, everything above at 6.00. For 150 units: 100 x 4.50 + 50 x 6.00 = 450 + 300 = **750**.

```
total = energy charges + fixed charge + other charges
```

With a fixed charge of 50 and other charges of 20, the total is 750 + 50 + 20 = **820**. If consumed units exceed the last defined slab limit and no final slab has `up_to: null`, the request fails with a clear error message.

### 11.4 Consumption used for a bill

For each active meter, the reading just before the period start is used as the baseline, and the differences between consecutive readings inside the period are added up.

### 11.5 Forecast

For each property:

1. Average daily consumption is calculated per active meter from readings over the last 30 days, with consumption spread evenly across each reading interval, then the meters are added together.
2. Projected month usage = actual usage so far this month + (average daily usage x remaining days).
3. If the property has an active tariff, the projected bill is calculated with the same function as the bill estimate (without saving it).
4. If there is not enough history, the property is reported as "not enough historical meter readings" instead of guessing.

Example: day 10 of a 30-day month, 80 kWh used so far, average 8 kWh per day, 20 days remaining: 80 + 8 x 20 = **240 kWh** projected.

### 11.6 Alerts

| Rule | Trigger | Type and severity |
|---|---|---|
| Limit exceeded | this month's usage is at or above `monthly_limit_kwh` | LIMIT_EXCEEDED, CRITICAL |
| Near limit | usage is at least 80% of the limit | HIGH_MONTHLY, WARNING |
| Sudden increase | the latest reading interval is at least 1.5 times the previous interval (needs 3 readings) | SUDDEN_INCREASE, WARNING |

Example: limit 200 kWh, usage 165 kWh gives a warning (165 is at least 160). Readings of 1000, 1100 and 1250 give intervals of 100 and 150; 150 is at least 1.5 x 100, so a sudden-increase alert is created.

### 11.7 Recommendations

For every appliance whose estimated usage is **50 kWh per month or more**, a tip titled "Reduce usage of ..." is created. Priority is **HIGH** at 150 kWh per month or more, otherwise **MEDIUM**. Each tip stores the `reason` explaining the numbers and states that it is an estimate. Example: three 75 W fans used 10 hours a day use 67.5 kWh per month, giving a MEDIUM tip.

---

## 12. API Reference

Base URL: `http://127.0.0.1:8000/api`

All endpoints except `health/`, `auth/register/` and `auth/login/` need:

```
Authorization: Token <your-token>
Content-Type: application/json
```

### 12.1 Endpoint summary

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health/` | Status check |
| POST | `/auth/register/` | Create account |
| POST | `/auth/login/` | Log in |
| POST | `/auth/logout/` | Log out |
| GET, PATCH | `/auth/profile/` | View or update profile |
| GET, POST | `/properties/` | List or create |
| GET, PUT, PATCH, DELETE | `/properties/{id}/` | One property |
| GET, POST | `/meters/` | List or create (`?property=`) |
| GET, PUT, PATCH, DELETE | `/meters/{id}/` | One meter |
| GET, POST | `/readings/` | List or create (`?meter=`, `?property=`) |
| GET, PUT, PATCH, DELETE | `/readings/{id}/` | One reading |
| GET, POST | `/appliances/` | List or create (`?property=`) |
| GET, PUT, PATCH, DELETE | `/appliances/{id}/` | One appliance |
| GET | `/appliances/summary/` | Estimated totals by category |
| GET, POST | `/billing/tariffs/` | List or create |
| GET, PUT, PATCH, DELETE | `/billing/tariffs/{id}/` | One tariff |
| POST | `/billing/generate/` | Generate a bill estimate |
| GET | `/billing/estimates/` and `/{id}/` | Saved estimates (`?property=`) |
| GET | `/analytics/` | Consumption summary |
| GET | `/analytics/forecast/` | Month-end forecast |
| GET | `/alerts/` and `/{id}/` | Alerts (`?property=`, `?is_read=`) |
| POST | `/alerts/generate/` | Generate alerts and tips |
| POST | `/alerts/{id}/mark_read/` | Mark one alert read |
| GET | `/recommendations/` and `/{id}/` | Tips (`?property=`) |
| POST | `/recommendations/generate/` | Generate alerts and tips |

### 12.2 Authentication

**Register**: `POST /auth/register/`

```json
{
  "full_name": "Asha Rao",
  "username": "asha_rao",
  "email": "asha@example.com",
  "password": "S3cure-Pass-2026",
  "confirm_password": "S3cure-Pass-2026"
}
```

Response `201 Created`:

```json
{
  "token": "9f2c...e1",
  "user": {
    "id": 1,
    "username": "asha_rao",
    "full_name": "Asha Rao",
    "email": "asha@example.com",
    "phone": "",
    "date_joined": "2026-11-21T09:30:00Z"
  }
}
```

**Login**: `POST /auth/login/` with `{"username": "...", "password": "..."}` returns the same shape with status `200`. A failed login returns `400` with "Invalid username or password."

**Logout**: `POST /auth/logout/` (token required) returns `{"detail": "Logged out successfully."}`.

**Profile**: `GET /auth/profile/` returns the user object. `PATCH /auth/profile/` accepts `full_name`, `email` and `phone`.

### 12.3 Properties

`POST /properties/`

```json
{
  "name": "Home",
  "property_type": "RESIDENTIAL",
  "address": "12 Lake Road",
  "city": "Hyderabad",
  "monthly_limit_kwh": "250.00"
}
```

Response `201`: the same fields plus `id`, `property_type_display`, `created_at` and `updated_at`.

### 12.4 Meters and readings

`POST /meters/`

```json
{ "property": 1, "meter_number": "MTR-001", "description": "Main meter", "is_active": true }
```

`POST /readings/`

```json
{ "meter": 1, "reading_date": "2026-11-15", "reading_value": "1119.00", "notes": "" }
```

Response `201`:

```json
{
  "id": 3,
  "meter": 1,
  "meter_number": "MTR-001",
  "reading_date": "2026-11-15",
  "reading_value": "1119.00",
  "notes": "",
  "previous_reading": "1056.00",
  "consumption": "63.00",
  "created_at": "2026-11-21T09:40:00Z"
}
```

A reading lower than the previous one returns `400` with an explanatory message such as "Reading cannot be lower than the previous reading (1056.00 on 2026-11-08)."

### 12.5 Appliances

`POST /appliances/`

```json
{
  "property": 1,
  "name": "Air conditioner",
  "category": "COOLING",
  "power_watts": 1500,
  "quantity": 1,
  "daily_hours": "8.00"
}
```

The response includes `estimated_daily_kwh`, `estimated_weekly_kwh`, `estimated_monthly_kwh` and `data_source: "estimate"`.

`GET /appliances/summary/` returns `appliance_count`, `estimated_daily_kwh`, `estimated_weekly_kwh`, `estimated_monthly_kwh` and `monthly_by_category`, along with a note that the values are estimates.

### 12.6 Billing

`POST /billing/tariffs/`

```json
{
  "property": 1,
  "name": "Domestic slabs",
  "rate_per_unit": "5.00",
  "fixed_charge": "50.00",
  "other_charges": "20.00",
  "slabs": [ { "up_to": 100, "rate": 4.5 }, { "up_to": null, "rate": 6 } ],
  "is_active": true
}
```

`POST /billing/generate/`

```json
{ "property": 1, "tariff": 1, "period_start": "2026-11-01", "period_end": "2026-11-30" }
```

Response `201` contains the saved estimate: `units_consumed`, `energy_charges`, `fixed_charges`, `other_charges`, `total_amount`, period dates and the tariff.

### 12.7 Analytics

`GET /analytics/` returns:

```json
{
  "total_properties": 1,
  "total_meters": 1,
  "total_consumption": 119.0,
  "current_month_consumption": 63.0,
  "previous_month_consumption": 56.0,
  "daily_consumption":   [ { "date": "2026-11-15", "consumption": 63.0 } ],
  "monthly_consumption": [ { "month": "Nov 2026", "consumption": 63.0 } ],
  "property_consumption":[ { "property": "Home", "consumption": 119.0 } ]
}
```

`GET /analytics/forecast/` returns the forecast date and month, elapsed and remaining days, totals (`actual_month_consumption`, `average_daily_consumption`, `projected_month_consumption`, `projected_bill_amount`) and a `property_forecasts` list with `forecast_available`, a message, the projection and an optional `bill_estimate` for each property.

### 12.8 Alerts and recommendations

`POST /alerts/generate/` (or `/recommendations/generate/`) returns:

```json
{ "alerts_created": 1, "recommendations_created": 2 }
```

`GET /alerts/?is_read=false` lists unread alerts. `POST /alerts/{id}/mark_read/` marks one as read.

### 12.9 Error format

Validation errors return `400` with field-by-field messages:

```json
{ "username": ["This username is already taken."] }
```

Other statuses: `401` for a missing or invalid token, `404` when a record does not exist **or belongs to another user**.

---

## 13. Frontend in Detail

### 13.1 Routes

Defined in `App.jsx`.

| Route | Page | Access |
|---|---|---|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `*` | NotFound | Public |
| `/dashboard` | Dashboard | Logged in |
| `/properties` | Properties | Logged in |
| `/readings` | Readings | Logged in |
| `/appliances` | Appliances | Logged in |
| `/analytics` | Analytics | Logged in |
| `/billing` | Billing | Logged in |
| `/alerts` | Alerts | Logged in |
| `/recommendations` | Recommendations | Logged in |
| `/forecast` | Forecast | Logged in |
| `/profile` | Profile | Logged in |

Public pages use `PublicLayout` (navbar and footer). Logged-in pages are wrapped in `ProtectedRoute` and `DashboardLayout` (sidebar).

### 13.2 Authentication flow in React

`AuthContext` provides `user`, `loading`, `login`, `register` and `logout`.

1. On first load, if a token is saved in `localStorage`, the app calls `GET /auth/profile/` to restore the user. An invalid token is removed.
2. `login()` and `register()` store the returned token and set the user.
3. `logout()` calls the API, then removes the token even if the server cannot be reached.
4. `ProtectedRoute` shows a loading spinner, then redirects to `/login` when there is no user.

### 13.3 API layer

`services/api.js` creates one Axios instance with `baseURL` from `VITE_API_URL` and an interceptor that adds `Authorization: Token <token>` to every request. It also exports two helpers:

- `getErrorMessage(error)` turns a failed request into one readable message (including "Cannot reach the server. Is the backend running?").
- `getFieldErrors(error)` extracts field-by-field errors so forms can show them next to each input.

Service files, one per area:

| File | Functions |
|---|---|
| `authService.js` | `registerUser`, `loginUser`, `logoutUser`, `fetchProfile` |
| `propertyService.js` | `listProperties`, `createProperty`, `updateProperty`, `deleteProperty` |
| `meterService.js` | `listMeters`, `createMeter` |
| `readingService.js` | `listReadings`, `createReading` |
| `applianceService.js` | `listAppliances`, `getAppliance`, `createAppliance`, `updateAppliance`, `deleteAppliance`, `getApplianceSummary` |
| `billingService.js` | `listTariffs`, `createTariff`, `updateTariff`, `deleteTariff`, `listBillEstimates`, `generateBillEstimate` |
| `forecastService.js` | `getConsumptionForecast`, `getForecastAnalytics` |
| `notificationService.js` | `listAlerts`, `markAlertRead`, `listRecommendations`, `generateNotifications` |

### 13.4 Pages

| Page | What it does |
|---|---|
| Landing | Public introduction to PowerSaver |
| Register / Login | Forms with validation; server errors are shown per field |
| Dashboard | Summary cards and line, bar and pie charts. **Currently uses labelled demonstration data** from `data/demoData.js` |
| Properties | List, add, edit and delete properties |
| Readings | Choose a property, add meters, add and list readings with previous reading and consumption |
| Appliances | Add, edit and delete appliances; see estimated kWh and the category summary |
| Analytics | Daily, monthly and per-property charts from `GET /analytics/` |
| Billing | Manage tariffs and generate and list bill estimates |
| Alerts | List alerts, filter by read state, mark as read, generate new alerts |
| Recommendations | List saving tips with priority and reason |
| Forecast | Month-end usage and bill projection per property |
| Profile | View and update name, email and phone |

### 13.5 Styling and charts

Bootstrap 5 provides the grid, forms, cards and navigation, and Bootstrap Icons provides the icons. Recharts renders `LineChart`, `BarChart` and `PieChart` components with a responsive container.

---

## 14. User Workflow

1. The user opens the PowerSaver landing page and registers or logs in.
2. The token is saved and the dashboard layout appears.
3. The user adds a property and optionally sets a monthly limit.
4. The user adds a meter and records readings over time.
5. The user adds appliances to see estimated usage.
6. The user adds a tariff and generates a bill estimate.
7. The user opens Analytics and Forecast to see charts and projections.
8. The user clicks **Generate** on the Alerts or Recommendations page to run the alert and tip rules, then reads and acts on them.
9. At every step the frontend sends a request, Django validates and processes it, SQLite stores or returns data, and the page updates.

---

## 15. Security

| Measure | Where |
|---|---|
| Passwords are hashed by Django and checked with four password validators | `users/serializers.py`, `settings.py` |
| Token authentication on every endpoint except health, register and login | `REST_FRAMEWORK` settings |
| Owner-only access: every queryset filters by the logged-in user, so other users' records return 404 | each `views.py` |
| Related-object choices (property, meter, tariff) are limited to the user's own records | serializers |
| `owner` cannot be set from the request body | `PropertyViewSet.perform_create` |
| Same error message for wrong username and wrong password | `LoginSerializer` |
| Secrets come from `.env`, which is ignored by Git | `settings.py`, `.gitignore` |
| CORS only allows the configured frontend origins | `django-cors-headers` |
| Input validation at serializer and model level | serializers and models |

Notes for production: the token is stored in the browser's `localStorage`, which is simple but readable by any script running on the page; keep dependencies updated and avoid injecting untrusted HTML. Tokens do not expire automatically in DRF's default token system; they are removed on logout.

---

## 16. Testing

### 16.1 Running the tests

```bash
cd backend
python manage.py test
```

Expected result: `Ran 38 tests ... OK`. The tests use DRF's `APITestCase`, so they exercise the real API endpoints against a temporary test database.

### 16.2 What is covered

| App | Tests | Covered behaviour |
|---|---|---|
| `users` | 10 | registration success and password hashing, password mismatch, weak password, duplicate username, duplicate email (case-insensitive), login success and failure, profile requires login, profile view and update, logout deletes token |
| `properties` | 8 | requires login, create and list, invalid type, negative limit, duplicate name, update and delete, other users cannot see or change a property, owner cannot be set from the request |
| `readings` | 12 | requires login, consumption calculation, negative, lower-than-previous, higher-than-next, duplicate-date and invalid-date readings, edit and delete, filter by meter, cannot add a meter to another user's property, duplicate meter number, other users cannot access readings |
| `appliances` | 8 | requires login, estimate calculation and label, quantity multiplies consumption, invalid values, update and delete, summary, cannot use another user's property, other users cannot access appliances |
| `billing`, `analytics`, `notifications` | 0 | not covered by automated tests yet |
| Frontend | 0 | no automated tests yet |

### 16.3 Suggested next tests

- Slab and flat-rate bill calculation, including the "slabs do not cover all units" error
- Forecast with one meter, several meters and no history
- Alert thresholds (80%, 100%, 1.5 times increase) and duplicate prevention
- Recommendation thresholds (50 and 150 kWh)
- Frontend component and route-guard tests

---

## 17. Error Handling

**Backend**

- Serializers and model validation return `400` with field-level messages.
- Missing or invalid tokens return `401`.
- Records that do not exist, or belong to someone else, return `404`.
- Registration runs inside a database transaction.
- Bill generation converts calculation errors (for example, incomplete slabs) into a readable validation error.

**Frontend**

- `getErrorMessage()` shows one friendly message for each failure, including when the backend is unreachable.
- `getFieldErrors()` places server messages next to the right form field.
- `ProtectedRoute` sends logged-out users to `/login`.
- `NotFound` handles unknown routes.

---

## 18. Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `KeyError: 'DJANGO_SECRET_KEY'` when starting Django | `backend/.env` is missing | Copy `.env.example` to `.env` |
| Browser shows "Cannot reach the server" | Backend not running, or wrong `VITE_API_URL` | Start `runserver`; check `frontend/.env` and restart `npm run dev` |
| CORS error in the browser console | Frontend origin not in `CORS_ALLOWED_ORIGINS` | Add the exact origin (including port) to `backend/.env` and restart Django |
| `DisallowedHost` error | Host missing from `DJANGO_ALLOWED_HOSTS` | Add it to `backend/.env` |
| `no such table` error | Migrations not applied | Run `python manage.py migrate` |
| `401 Unauthorized` on every call | Token missing, expired by logout, or invalid | Log in again |
| Changing `.env` has no effect | Servers read it only at startup | Restart the server |
| `pip install` fails for Django 6.1 | Python version too old | Use Python 3.12 or newer |
| Forecast says "not enough historical meter readings" | A meter needs at least two readings with a positive difference in the last 30 days | Add more readings |
| Bill estimate fails with a slab message | Tariff slabs do not cover all units | Add a final slab with `up_to` set to `null` |

---

## 19. Deployment Guide

> **Status: PowerSaver has not been deployed, and the repository contains no deployment configuration.** This section describes what would be needed; it is a plan, not a record of completed work.

### 19.1 Frontend

1. Set `VITE_API_URL` to the public API address.
2. Run `npm run build`. Vite writes static files to `frontend/dist/`.
3. Upload `dist/` to any static hosting service.
4. Configure the host to serve `index.html` for unknown paths so React Router routes work on refresh.

### 19.2 Backend

1. Set `DJANGO_DEBUG=False`, a strong `DJANGO_SECRET_KEY`, the real `DJANGO_ALLOWED_HOSTS` and the frontend's address in `CORS_ALLOWED_ORIGINS`.
2. Run the app with a production WSGI server. `powersaver/wsgi.py` exists, but a server such as gunicorn is not in `requirements.txt` and would need to be added.
3. Static files (for the Django admin) need `STATIC_ROOT` and `collectstatic`, which are not configured yet.
4. Serve over HTTPS.

### 19.3 Database

SQLite is fine for a demonstration. For real users with simultaneous writes, move to PostgreSQL or MySQL by changing `DATABASES` in `settings.py` and installing the matching driver. Back up the database regularly.

### 19.4 How the deployed system would work

The browser loads the React files from the static host, React calls the live API URL, Django validates and processes each request, and the database stores or returns the data, exactly as in development.

---

## 20. Limitations, Known Issues and Future Work

### 20.1 Current limitations

- Meter readings are entered manually; there is no live or automatic data.
- The Dashboard page shows demonstration data, not the user's data.
- Appliance usage and bills are estimates.
- Alerts and tips are created only when the user clicks Generate, not automatically.
- The forecast is a simple average, not a prediction model.
- The `UNUSUAL_PATTERN` alert type is defined but not generated.
- SQLite allows one writer at a time and is not meant for heavy multi-user traffic.
- Automated tests do not cover billing, analytics, notifications or the frontend.
- Not deployed, and there is no production configuration.

### 20.2 Housekeeping items noticed in the code

- `frontend/src/services/` contains duplicate `components/ProtectedRoute.jsx` and `context/AuthContext.jsx` files; the app uses the copies in `src/components/` and `src/context/`, so the duplicates can be removed.
- `settings.py` defines a `MAILERS` setting for console email. Django's real setting is `EMAIL_BACKEND`, and nothing in the project sends email.
- `/alerts/generate/` and `/recommendations/generate/` run the same function, so one could be removed.

### 20.3 Future enhancements (not implemented)

- Smart meter and IoT integration for automatic readings
- Real-time electricity monitoring
- AI-based consumption prediction and anomaly detection
- Richer energy analytics and appliance-level comparisons
- Scheduled and email notifications
- Mobile application
- PostgreSQL, caching and background jobs for production scale
- Automated test coverage for all modules and the frontend

---

## 21. Development History

The project was built in phases, visible in the Git history:

| Phase | Work |
|---|---|
| 1 | Backend setup and requirements |
| 2 | React frontend setup with Vite |
| 3 | Landing page, navbar, footer and routing |
| 4 | Registration and login forms with validation |
| 5 | Dashboard layout, sidebar and demo charts |
| 6 | Django project, apps, settings and health check |
| 7 | Database models, migrations and admin |
| 8A to 8D | Authentication, property, meter and reading, and appliance APIs, with tests |
| 9A, 9B | React login, register, logout, protected routes and the Properties page connected to Django |
| Later | Billing, analytics, forecast, alerts, recommendations, and the Readings, Forecast, Profile and Recommendations pages |

---

## 22. Glossary

| Term | Meaning |
|---|---|
| **API** | A defined way for two programs to communicate; here, React asks and Django answers |
| **REST** | An API style that uses HTTP methods (GET, POST, PATCH, DELETE) on resource URLs |
| **JSON** | A text format for exchanging data between frontend and backend |
| **CRUD** | Create, Read, Update, Delete |
| **ORM** | Object-Relational Mapper; lets you use Python classes instead of writing SQL |
| **Serializer** | Converts models to JSON and validates incoming data |
| **ViewSet** | A DRF class that provides list, create, retrieve, update and delete for a resource |
| **Migration** | A file describing a database change, applied with `migrate` |
| **Token authentication** | The server issues a secret key at login; the client sends it with each request |
| **CORS** | A browser rule controlling which websites may call an API |
| **kWh** | Kilowatt-hour, the unit of electricity consumption ("one unit") |
| **Tariff / slab** | The price rules for electricity; slabs charge different rates for different usage bands |
| **SPA** | Single-page application; the page updates without full reloads |
| **Vite** | A build tool and development server for modern frontends |
>>>>>>> 8ef158703e71b152a74c6ccdfcc7f793fe4020be
