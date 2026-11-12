# ASTRAQUEST Oxygen Pipe Puzzle Integration (v2)

The source-to-destination pipe puzzle is embedded in Step 2 of `frontend/oxygen-pipe-repair.html`, inside the Moon Mission
crisis flow (dashboard → 6 steps → quiz → result). Start it from `frontend/moon-dashboard.html` → "Start challenge".

## What changed in v2 (fixes "can't complete the game")
- **Rules simplified:** any unbroken route from the Oxygen Container to Life Support wins. Unused openings on T- and
  cross-junctions are capped automatically (no manual capping). A straight pipe/elbow with a loose end leaks and only
  costs bonus points; it no longer blocks progress.
- **Winnable every time:** each random board is generated so a perfect 100/100, zero-leak solution exists.
- **2-minute timer** (was 60 s), starting on the first rotation; shown in the shared mission panel.
- **Auto-complete:** a fully sealed connection finishes Step 2 by itself; "Check Connection" also works.
- **Hint** button (highlights the tiles on the quickest route that still need turning) and **Reset Pipe Layout**.

## Files
- `frontend/js/oxygen-route-puzzle.js` — puzzle engine. API unchanged: `initAstraOxygenPuzzle({onSolved})`,
  `stopAstraOxygenPuzzleTimer()`. `onSolved` now receives `{score, leaks, secondsLeft}`.
- `frontend/css/oxygen-route-puzzle.css` — board, tiles, auto-caps, hint and diagnostics styles.
- `frontend/js/oxygen-pipe-repair.js` — crisis flow (Step 2 copy updated; milestones/quiz/scoring unchanged).
- `frontend/assets/oxygen-puzzle/tiles/` — pipe artwork.

## Saved data (localStorage)
`astraquestOxygenPuzzleScore` (puzzle score /100) in addition to the existing crisis keys
(`astraquestOxygenMiniGameScore`, `astraquestOxygenQuizScore`, `astraquestLastCrisisScore`, …).
