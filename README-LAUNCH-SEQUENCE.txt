ASTRAQUEST Launch Sequence page

New page: frontend/launch-sequence.html
Styles: frontend/css/launch-sequence.css
Behavior: frontend/js/launch-sequence.js
Assets:
- frontend/assets/launch-sequence-bg.png: spaceport background without a rocket
- frontend/assets/moon-rocket-1.png: Moon Rocket 1 / Pioneer-1 overlaid on the background
- frontend/assets/moon-destination-thumbnail.png: Moon destination thumbnail

Flow update:
Allocate Resources -> Launch Sequence

The launch sequence button currently initializes the first launch/wiring step and reports its status. The full wiring mini-game can be built as the next gameplay step.


=== Launch Animation (launch-animation.html) - image-based replacement ===
Flow: Launch Sequence -> Wiring Challenge -> frontend/launch-animation.html -> (CONTINUE) frontend/moon-dashboard.html

Files: frontend/launch-animation.html, frontend/css/launch-animation.css, frontend/js/launch-animation.js
Photos (2560x1441): frontend/assets/launch-pad.jpg, frontend/assets/clouds.webp (transparent), frontend/assets/space-orbit.jpg, frontend/assets/moon-surface.jpg
Rocket: frontend/assets/launch-rocket-1.png (trimmed copy; frontend/assets/moon-rocket-1.png is untouched for the other pages)

Phases: Countdown (launch pad) -> Liftoff (pad scrolls away, clouds, sky fades to space) -> Transit (Earth orbit, camera flies to the Moon)
-> Landing (dissolve to moon surface, dust) -> Mission complete.
Only code-drawn visuals: canvas smoke (pad smoke, exhaust trail, landing dust). No 3D, no CSS-drawn scenery.
Reads localStorage: astraquestSelectedMission (Moon/Mars; the old astraquestMission/astraquestDestination are fallbacks),
astraquestRocketName, astraquestSelectedCrew. Writes astraquestMissionLanded. Mars tints the moon-surface photo only.
Has a SOUND ON/OFF toggle (synthesized audio, starts only after a click) and live telemetry in the HUD.
