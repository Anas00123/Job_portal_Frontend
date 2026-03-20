

// ===============================
// UNIVERSAL LOGIN SCRIPT
// ===============================



// ================= EXPECTED ROLE =================

function getExpectedRole() {

    const path = window.location.pathname;

    if (path.includes("recruiter")) return "RECRUITER";
    if (path.includes("admin")) return "ADMIN";

    return "JOB_SEEKER";
}

// ================= REDIRECT BASED ON ROLE =================

function redirectByRole(role) {

    switch (role) {

        case "JOB_SEEKER":
            window.location.href = "/user/userDashboard.html";
            break;

        case "RECRUITER":
            window.location.href = "/recruiter/recruiterDashboard/recruiterDashboard.html";
            break;

        case "ADMIN":
            window.location.href = "/admin/adminDashboard.html";
            break;

        default:
            localStorage.clear();
            window.location.href = "/login.html";
    }
}

// ================= LOGIN USER FUNCTION =================

async function loginUser(loginData) {

    try {

        const response = await fetchWithRefresh(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include", // REQUIRED FOR COOKIES
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (response.ok) {

            const user = {
                userId: result.userId,
                username: result.username,
                email: result.email,
                role: result.role
            };

            // Save only user info
            localStorage.setItem("user", JSON.stringify(user));

            const redirectUrl = sessionStorage.getItem("redirectAfterLogin");

            if (redirectUrl) {
                sessionStorage.removeItem("redirectAfterLogin"); // clean up
                window.location.href = redirectUrl;             // ← go back to jobs.html?title=...
                return;
            }

            return { ok: true, role: result.role };

        } else {

            return { ok: false, message: result.message || "Invalid credentials" };

        }

    } catch (error) {

        return { ok: false, message: "Server error. Try again." };

    }
}

// ================= PASSWORD TOGGLE =================

document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".toggle-password").forEach(toggle => {

        toggle.addEventListener("click", function () {

            const targetId = this.getAttribute("data-target");
            const input = document.getElementById(targetId);
            const icon = this.querySelector("i");

            if (!input) return;

            if (input.type === "password") {

                input.type = "text";
                icon.classList.remove("bi-eye-slash");
                icon.classList.add("bi-eye");

            } else {

                input.type = "password";
                icon.classList.remove("bi-eye");
                icon.classList.add("bi-eye-slash");
            }

        });

    });

});

// ================= LOGIN FORM SUBMIT =================

document.addEventListener("DOMContentLoaded", () => {

    // checkAlreadyLoggedIn();

    const loginForm = document.getElementById("loginForm");
    const errorDiv = document.getElementById("errorLoginMessage");

    if (!loginForm) return;

    loginForm.addEventListener("submit", async function (e) {

        e.preventDefault();
        errorDiv.innerHTML = "";

        const loginBtn = document.getElementById("loginBtn");

        const loginData = {
            usernameOrEmail: document.getElementById("username").value.trim(),
            password: document.getElementById("password").value.trim()
        };

        // Disable button while loading
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML =
                `<span class="spinner-border spinner-border-sm"></span> Logging in...`;
        }

        const result = await loginUser(loginData);

        if (result.ok) {

            const expectedRole = getExpectedRole();

            if (result.role !== expectedRole) {

                // Wrong role login attempt
                localStorage.clear();

                errorDiv.innerHTML =
                    `<div class="alert alert-danger">
                        Please use the correct login page for your role.
                    </div>`;

                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = "Login";
                }

                return;
            }

            // Correct role → redirect
            redirectByRole(result.role);

        } else {

            errorDiv.innerHTML =
                `<div class="alert alert-danger">
                    ${result.message}
                </div>`;

            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = "Login";
            }
        }

    });

});
    