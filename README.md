# PowerSaver
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