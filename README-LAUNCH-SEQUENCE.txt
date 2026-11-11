ASTRAQUEST Launch Sequence page

New page: launch-sequence.html
Styles: css/launch-sequence.css
Behavior: js/launch-sequence.js
Assets:
- assets/launch-sequence-bg.png: spaceport background without a rocket
- assets/moon-rocket-1.png: Moon Rocket 1 / Pioneer-1 overlaid on the background
- assets/moon-destination-thumbnail.png: Moon destination thumbnail

Flow update:
Allocate Resources -> Launch Sequence

The launch sequence button currently initializes the first launch/wiring step and reports its status. The full wiring mini-game can be built as the next gameplay step.


=== Launch Animation (launch-animation.html) - image-based replacement ===
Flow: Launch Sequence -> Wiring Challenge -> launch-animation.html -> (CONTINUE) moon-dashboard.html

Files: launch-animation.html, css/launch-animation.css, js/launch-animation.js
Photos (2560x1441): assets/launch-pad.jpg, assets/clouds.webp (transparent), assets/space-orbit.jpg, assets/moon-surface.jpg
Rocket: assets/launch-rocket-1.png (trimmed copy; assets/moon-rocket-1.png is untouched for the other pages)

Phases: Countdown (launch pad) -> Liftoff (pad scrolls away, clouds, sky fades to space) -> Transit (Earth orbit, camera flies to the Moon)
-> Landing (dissolve to moon surface, dust) -> Mission complete.
Only code-drawn visuals: canvas smoke (pad smoke, exhaust trail, landing dust). No 3D, no CSS-drawn scenery.
Reads localStorage: astraquestSelectedMission (Moon/Mars; the old astraquestMission/astraquestDestination are fallbacks),
astraquestRocketName, astraquestSelectedCrew. Writes astraquestMissionLanded. Mars tints the moon-surface photo only.
Has a SOUND ON/OFF toggle (synthesized audio, starts only after a click) and live telemetry in the HUD.
