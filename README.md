# ASTRAQUEST Vanilla Frontend

## Run locally
1. Open this folder in VS Code.
2. Start Live Server on `index.html`.
3. Use the homepage NASA Data link to open the data explorer.
4. Select a topic card to open its dedicated learning page.

## Pages
- `index.html` — homepage
- `auth.html` — login / signup interface
- `nasa-data.html` — NASA Data topic hub
- `rockets-spacecraft.html`
- `space-food.html`
- `space-power-energy.html`
- `space-basics.html`
- `astronaut-life.html`
- `space-missions-exploration.html`

All six topic detail pages use their matching image in `assets/` as the hero background. The shared header uses the homepage styles. Topic information is educational overview content; links open public NASA resources. Authentication is frontend-only until a backend is connected.

## Space Store
- Open `store.html` to explore the new Space Store page.
- Store assets: `assets/space-store-bg.png`, `assets/store-rockets.png`, `assets/store-crew.png`, and `assets/store-upgrades.png`.
- Store categories are frontend previews; inventory, purchases, and unlocks are not connected to a backend yet.

### Store page layout update
- The generated `assets/space-store-bg.png` now covers the full Store page background.
- The Store page displays only the SPACE STORE heading and the Rockets, Crew, and Upgrades category cards.
- The extra detail sections, demo note, and footer content below the cards have been removed from `store.html`.


## Mission Selection page
Open `mission-selection.html` directly or click **Start Mission** on the homepage. Select Moon or Mars to save the selected destination in localStorage and continue to `rocket-hangar.html`.

\n## Tutorial / How it works\n- Click **How it works** in the shared header to open `tutorial.html`.\n- Tutorial imagery is stored in `assets/tutorial/` to avoid overwriting existing project assets.\n- Tutorial page uses Inter typography and matches the shared ASTRAQUEST navigation.\n- Tutorial actions link to the existing mission selection, launch sequence, Moon dashboard, mission results, and NASA Data pages.\n

## Space Food Rescue
- Start from the Moon Mission Dashboard event card.
- Catch ten drifting food packets in 20 seconds using arrow keys, A/D, or touch/drag controls.
- Complete the five-question science check; the mini-game and quiz scores combine for a crisis score out of 10.
- Food stock changes are saved in localStorage and reflected in the dashboard. This frontend prototype does not yet use a backend mission scheduler.


## Automatic mission clock and crisis alerts
- Mission time advances one game day every 30 seconds while the dashboard is active.
- The day clock pauses while the browser tab is hidden, during a crisis alert, and while a mini-game or quiz is open; saved mission state resumes after returning.
- Daily simulation consumption is 25 units from Food, Radiation Shielding, Life Support, and Power. A required resource reaching zero ends the mission.
- Crises are scheduled once per mission using the duration-based counts in the game design document. The schedule is saved so refresh or resume does not reroll it.
- A blocking crisis alert opens automatically on its scheduled day. Currently scheduled playable crises are Space Food Rescue and Oxygen Pipe Repair.


### Space Food Rescue UI pipeline
The crisis alert opens automatically from the mission schedule. Responding opens the dashboard-shell mini-game: instructions, gameplay, final countdown, final moments, mini-game complete, five-question science quiz, and combined crisis result. The supplied `assets/space-food.png` image is used as the spacecraft food-scene backdrop.
