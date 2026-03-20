
// ================= STORAGE =================

function saveUser(data) {
 
    const user = {
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role
    };

    localStorage.setItem("role", JSON.stringify(user.role));
    localStorage.setItem("user", JSON.stringify(user));
}

function getUser() {
    return JSON.parse(localStorage.getItem("user"));
}


function clearAuthData() {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
}

// ================= LOGOUT =================

async function logout() {

    try {

        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });

    } catch (error) {
        console.error("Logout error:", error);
    }

    clearAuthData();
    window.location.href = "/";
}

// ================= ROLE GUARD =================

async function protectPage(allowedRoles) {

    try {

        const response = await fetchWithRefresh(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            window.location.href = "/";
            return;
        }

        const user = await response.json();

        saveUser(user);

        if (!allowedRoles.includes(user.role)) {
            redirectDashboard(user.role);
            return;
        }

    } catch (error) {

        console.error("Auth check failed:", error);
        window.location.href = "/";
    }
}

// ================= ROLE REDIRECT =================

function redirectDashboard(role) {

    switch (role) {

        case "RECRUITER":
            window.location.href =
                "/recruiter/recruiterDashboard/recruiterDashboard.html";
            break;

        case "JOB_SEEKER":
            window.location.href = "/user/userDashboard.html";
            break;

        case "ADMIN":
            window.location.href = "/admin/dashboard.html";
            break;

        default:
            clearAuthData();
            window.location.href = "/";
    }
}

// ================= AUTH FETCH =================

async function authFetch(url, options = {}) {

    const config = {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    };

    const response = await fetch(url, config);

    if (response.status === 401) {

        clearAuthData();
        window.location.href = "/";

        return null;
    }

    return response;
}



