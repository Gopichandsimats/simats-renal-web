# SIMATS Renal Calculi Web Application

React + Node.js web version of the Android app found in `SIMATS RENAL CALCULI.zip`.

## What is included

- React web app for doctor and patient portals
- Patient login, signup, dashboard, upload, reports, profile, and settings
- Doctor login, case list, filters, case review, notes, and confirmation flow
- Backend API proxy for the existing PHP backend:
  - `dlogin.php`
  - `psignup.php`
  - `plogin.php`
  - `report.php`
- AI model adapter endpoint for CT scan analysis
  - Uses `MODEL_API_URL` if you have a trained model service
  - Falls back to a demo predictor when no model file/service is available

## Run

```bash
npm run install:all
npm run dev:backend
npm run dev:frontend
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

## Backend configuration

Create `backend/.env` if needed:

```env
PORT=4000
PHP_BASE_URL=http://14.139.187.229:8081/oct/renal/
MODEL_API_URL=
```

When `MODEL_API_URL` is set, `/api/analyze` forwards the uploaded file to that trained model service. The service should return JSON with fields such as `status`, `stone_count`, `stone_sizes`, `stone_locations`, `confidence`, and `annotated_image`.

## Important note

The supplied Android project did not include the trained model artifact or PHP backend source. This web app is integrated with the existing backend URL used by the Android app and provides a pluggable AI model adapter for the trained model.
