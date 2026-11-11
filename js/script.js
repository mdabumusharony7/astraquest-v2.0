
/* ========================================
   ASTRAQUEST — Main JavaScript
======================================== */


/* ========================================
   1. TOAST NOTIFICATIONS
======================================== */

const toast = document.getElementById("toast");

let toastTimer;

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* ========================================
   2. MISSION SELECTION
======================================== */

function selectMission(mission) {
    showToast(
        `${mission} mission selected. Sign in or create an account to continue.`
    );
}

document.querySelectorAll("[data-mission]").forEach((button) => {
    button.addEventListener("click", () => {
        const mission = button.dataset.mission;
        selectMission(mission);
    });
});


/* ========================================
   3. START MISSION BUTTON
======================================== */

const startMissionButton = document.getElementById("startMission");

if (startMissionButton) {
    startMissionButton.addEventListener("click", () => {
        const missionsSection = document.getElementById("missions");

        missionsSection?.scrollIntoView({
            behavior: "smooth"
        });

        showToast("Choose your destination: Moon or Mars.");
    });
}


/* ========================================
   4. EXPLORE FEATURES BUTTON
======================================== */

const exploreFeaturesButton = document.getElementById("exploreFeatures");

if (exploreFeaturesButton) {
    exploreFeaturesButton.addEventListener("click", () => {
        const featuresSection = document.getElementById("features");

        if (featuresSection) {
            featuresSection.scrollIntoView({
                behavior: "smooth"
            });
        } else {
            showToast("More features will be added soon.");
        }
    });
}


/* ========================================
   5. USER PROFILE MENU
======================================== */

const profileButton = document.getElementById("profileButton");
const profileMenu = document.getElementById("profileMenu");

if (profileButton && profileMenu) {

    // Toggle profile menu
    profileButton.addEventListener("click", (event) => {
        event.stopPropagation();

        profileMenu.hidden = !profileMenu.hidden;

        profileButton.setAttribute(
            "aria-expanded",
            String(!profileMenu.hidden)
        );
    });

    // Close profile menu when clicking outside
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".profile-wrap")) {
            profileMenu.hidden = true;

            profileButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    });
}


/* ========================================
   6. MOBILE NAVIGATION
======================================== */

const mobileMenuButton = document.getElementById("mobileMenu");
const mainNavigation = document.getElementById("mainNav");

if (mobileMenuButton && mainNavigation) {

    // Toggle mobile navigation
    mobileMenuButton.addEventListener("click", () => {
        const isOpen = !mainNavigation.classList.contains("open");

        mainNavigation.classList.toggle("open", isOpen);

        mobileMenuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    });

    // Handle navigation links
    mainNavigation.querySelectorAll("a").forEach((link) => {

        link.addEventListener("click", () => {

            // Close mobile navigation
            mainNavigation.classList.remove("open");

            mobileMenuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            // Update active navigation link
            mainNavigation.querySelectorAll("a").forEach((item) => {
                item.classList.remove("active");
            });

            link.classList.add("active");
        });

    });
}


/* ========================================
   7. DYNAMIC COPYRIGHT YEAR
======================================== */

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


/* ========================================
   8. INITIALIZE LUCIDE ICONS
======================================== */

if (window.lucide) {
    window.lucide.createIcons();
}
