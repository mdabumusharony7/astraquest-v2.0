ASTRAQUEST Crew Selection Update

Open frontend/index.html and use Start Mission -> Moon Mission -> Continue to reach frontend/crew-selection.html.

Crew selection includes six named specialists, no crew portrait images, and requires exactly four selections before proceeding to frontend/rocket-hangar.html. Selected crew is saved in sessionStorage as astraquestSelectedCrew. Mission settings are saved as astraquestMissionConfig.

Crew selection background: frontend/assets/crew-selection-bg.png
Crew selection styling: frontend/css/crew-selection.css
Crew selection behavior: frontend/js/crew-selection.js

Note: The four-member selection rule is retained from the current game requirements. The mission preparation page's crew-size control is still present, but crew selection itself currently requires exactly four members to match the crew-selection specification.
