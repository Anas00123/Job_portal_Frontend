// ================= PASSWORD PATTERN =================

const passwordPattern =
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,20}$/;

const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const passwordError = document.getElementById("passwordError");
const confirmError = document.getElementById("confirmError");

// ================= PASSWORD VALIDATION =================

password.addEventListener("input", () => {

    const value = password.value;

    if (!passwordPattern.test(value)) {

        passwordError.textContent =
            "Password must be 8–20 chars, include uppercase, lowercase, number & special character.";

    } else {

        passwordError.textContent = "";

    }

    validateConfirmPassword();
});

// ================= CONFIRM PASSWORD MATCH =================

confirmPassword.addEventListener("input", validateConfirmPassword);

function validateConfirmPassword() {

    if (confirmPassword.value === "") {
        confirmError.textContent = "";
        return;
    }

    if (password.value !== confirmPassword.value) {
        confirmError.textContent = "Passwords do not match";
    } else {
        confirmError.textContent = "";
    }
}

// ================= FORM VALIDATION =================

const form = document.getElementById("recruiterRegisterForm");
const messageDiv = document.getElementById("message");
const registerBtn = document.getElementById("registerBtn");

form.addEventListener("submit", async function (e) {

    e.preventDefault();
    messageDiv.innerHTML = "";

    // ================= PASSWORD VALIDATION =================

    if (!passwordPattern.test(password.value)) {
        passwordError.textContent = "Invalid password format";
        password.focus();
        return;
    }

    if (password.value !== confirmPassword.value) {
        confirmError.textContent = "Passwords do not match";
        confirmPassword.focus();
        return;
    }

    // ================= DISABLE BUTTON =================

    registerBtn.disabled = true;
    registerBtn.innerHTML =
        `<span class="spinner-border spinner-border-sm"></span> Registering...`;

    // ================= CREATE RECRUITER OBJECT =================

    const recruiter = {

        fullname: document.getElementById("recruiterName").value.trim(),
        username: document.getElementById("username").value.trim(),
        companyName: document.getElementById("companyName").value.trim(),
        email: document.getElementById("officialEmail").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        city: document.getElementById("companyCity").value.trim(),
        description: document.getElementById("companyDescription").value.trim(),
        password: password.value.trim(),
    };

    try {

        const response = await fetch(`${API_BASE_URL}/auth/recruiter`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(recruiter)
        });

        const result = await response.json();

        if (response.ok) {

            messageDiv.innerHTML =
                `<div class="alert alert-success">
                    Registration successful
                </div>`;

            form.reset();

        } else {

            messageDiv.innerHTML =
                `<div class="alert alert-danger">
                    ${result.message || "Registration failed"}
                </div>`;
        }

    } catch (error) {

        messageDiv.innerHTML =
            `<div class="alert alert-danger">
                Server error. Please try again.
            </div>`;
    }

    // ================= ENABLE BUTTON AGAIN =================

    registerBtn.disabled = false;
    registerBtn.innerHTML = "Register as Recruiter";
});