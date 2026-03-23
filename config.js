// ─── API BASE URL ───────────────────────────────────────────
const API_BASE_URL = "https://discharge-screen-travesti-jeffrey.trycloudflare.com/api";

// ─── FETCH WRAPPER ──────────────────────────────────────────
// Automatically retries once on 401 after refreshing token

async function fetchWithRefresh(url, options = {}) {
    options.credentials = "include";
    options.headers = { "Content-Type": "application/json", ...options.headers };

    let res = await fetch(url, options);
    console.log(`📡 ${options.method || "GET"} ${url} → ${res.status}`); // ← add this

    if (res.status === 401 || res.status === 403) {
        console.warn("⚠️ Got 401 — attempting refresh");
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            res = await fetch(url, options);
            console.log(`📡 Retry → ${res.status}`); // ← and this

            if (res.status === 403) {
                console.error("❌ Still 403 after refresh — real access denied");
                return res; // let caller handle
            }
        } else {
            return res;
        }
    }
    return res;
}

// ─── REFRESH TOKEN ──────────────────────────────────────────
async function refreshAccessToken() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) {
            forceLogout();
            return false;
        }
        return true;
    } catch (err) {
        console.error("Token refresh failed:", err);
        forceLogout();
        return false;
    }
}

// ─── AUTH HELPERS ───────────────────────────────────────────
function isLoggedIn() {
    return localStorage.getItem("loggedIn") === "true";
}

function getRole() {
    return localStorage.getItem("role") || "";
}

function isAdmin() {
    const role = getRole();
    return role === "ADMIN" || role === "SUB_ADMIN";
}

function isJobSeeker() {
    return getRole() === "JOB_SEEKER";
}

function isRecruiter() {
    return getRole() === "RECRUITER";
}

function getAdminName() {
    return localStorage.getItem("fullName") || "Admin";
}

function getAdminRole() {
    return localStorage.getItem("role") || "";
}

function getAdminId() {
    return localStorage.getItem("userId") || "";
}

// ─── PAGE PROTECTION ────────────────────────────────────────
function protectAdminPage() {
    if (!isLoggedIn() || !isAdmin()) {
        window.location.href = "/admin/login.html";
    }
}

function protectPage(requiredRole) {
    if (!isLoggedIn()) {
        window.location.href = "/user/loginForm.html";
        return;
    }
    if (requiredRole && getRole() !== requiredRole) {
        window.location.href = "/user/loginForm.html";
    }
}

// ─── LOGOUT ─────────────────────────────────────────────────
async function forceLogout() {
    localStorage.clear();
    window.location.href = "/admin/login.html";
}

async function adminLogout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.error("Logout error:", err);
    } finally {
        localStorage.clear();
        window.location.href = "/admin/login.html";
    }
}