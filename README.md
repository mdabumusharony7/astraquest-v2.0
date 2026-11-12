# ASTRAQUEST

## Project folders
- `frontend/` — React homepage, Vite setup, and the existing pages, scripts, styles, and assets.
- `backend/` — Django REST API, PostgreSQL configuration, migrations, and API tests.

## Run locally
Start PostgreSQL, then use two terminals.

### Backend terminal
```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp -n .env.example .env
```
Set `DJANGO_SECRET_KEY` and PostgreSQL credentials in `backend/.env`, then run:
```sh
python manage.py migrate
python manage.py seed_store
python manage.py createsuperuser
python manage.py runserver
```

### Frontend terminal
```sh
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite. Vite proxies `/api` requests to Django on port 8000.

For API tests without PostgreSQL:
`cd backend && DJANGO_DEBUG=True DATABASE_URL=sqlite:///:memory: python manage.py test`

The homepage is built with React. Vite serves and builds all existing HTML pages
as separate entry points so mission and learning flows remain available during
the incremental migration. Static files in `frontend/assets/` are included in
production builds.

## Checks
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `cd backend && DJANGO_DEBUG=True DATABASE_URL=sqlite:///:memory: python manage.py test`

### API
- `POST /api/auth/register/`, `POST /api/auth/token/`, `POST /api/auth/token/refresh/`, `GET /api/auth/me/`
- `GET|POST /api/missions/`, `GET|PATCH /api/missions/{id}/`
- `GET|POST /api/results/`; mission results update the mission status and contribute to the leaderboard.
- `GET /api/store/items/`, `GET /api/store/inventory/`, `POST /api/store/purchases/`
- `GET /api/leaderboard/`
- `GET /admin/` for the Django admin.

The browser auth, mission selection/setup, rocket purchases, and mission/crisis results use these APIs when signed in. Guest flows continue to work locally.

## Pages
- `frontend/index.html` — homepage
- `frontend/auth.html` — login / signup interface
- `frontend/nasa-data.html` — NASA Data topic hub
- `frontend/rockets-spacecraft.html`
- `frontend/space-food.html`
- `frontend/space-power-energy.html`
- `frontend/space-basics.html`
- `frontend/astronaut-life.html`
- `frontend/space-missions-exploration.html`

All six topic detail pages use their matching image in `frontend/assets/` as the hero background. The shared header uses the homepage styles. Topic information is educational overview content; links open public NASA resources.

## Space Store
- Open `frontend/store.html` to explore the new Space Store page.
- Store assets: `frontend/assets/space-store-bg.png`, `frontend/assets/store-rockets.png`, `frontend/assets/store-crew.png`, and `frontend/assets/store-upgrades.png`.
- Store purchases and inventory are persisted for signed-in accounts; guest purchases remain temporary.

### Store page layout update
- The generated `frontend/assets/space-store-bg.png` now covers the full Store page background.
- The Store page displays only the SPACE STORE heading and the Rockets, Crew, and Upgrades category cards.
- The extra detail sections, demo note, and footer content below the cards have been removed from `frontend/store.html`.


## Mission Selection page
Open `frontend/mission-selection.html` directly or click **Start Mission** on the homepage. Select Moon or Mars to save the selected destination locally; signed-in players also save the mission to the Django API.

## Tutorial / How it works
- Click **How it works** in the shared header to open `frontend/tutorial.html`.
- Tutorial imagery is stored in `frontend/assets/tutorial/` to avoid overwriting existing project assets.
- Tutorial page uses Inter typography and matches the shared ASTRAQUEST navigation.
- Tutorial actions link to the existing mission selection, launch sequence, Moon dashboard, mission results, and NASA Data pages.

## Space Food Rescue
- Start from the Moon Mission Dashboard event card.
- Catch ten drifting food packets in 20 seconds using arrow keys, A/D, or touch/drag controls.
- Complete the five-question science check; the mini-game and quiz scores combine for a crisis score out of 10.
- Food stock changes are saved in localStorage and reflected in the dashboard. Signed-in players also save crisis and completed-mission results to the backend.


## Automatic mission clock and crisis alerts
- Mission time advances one game day every 30 seconds while the dashboard is active.
- The day clock pauses while the browser tab is hidden, during a crisis alert, and while a mini-game or quiz is open; saved mission state resumes after returning.
- Daily simulation consumption is 25 units from Food, Radiation Shielding, Life Support, and Power. A required resource reaching zero ends the mission.
- Crises are scheduled once per mission using the duration-based counts in the game design document. The schedule is saved so refresh or resume does not reroll it.
- A blocking crisis alert opens automatically on its scheduled day. Currently scheduled playable crises are Space Food Rescue and Oxygen Pipe Repair.


### Space Food Rescue UI pipeline
The crisis alert opens automatically from the mission schedule. Responding opens the dashboard-shell mini-game: instructions, gameplay, final countdown, final moments, mini-game complete, five-question science quiz, and combined crisis result. The supplied `frontend/assets/space-food.png` image is used as the spacecraft food-scene backdrop.
