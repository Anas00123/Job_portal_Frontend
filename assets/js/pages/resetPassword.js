const passwordPattern = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,20}$/;

const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const passwordError = document.getElementById("passwordError");
const confirmError = document.getElementById("confirmError");
const message = document.getElementById("message");

//  Get token from URL
const token = new URLSearchParams(window.location.search).get("token");

// Redirect if no token
if (!token) {
    message.textContent = "Invalid or missing reset link.";
    message.classList.add("text-danger");
    document.getElementById("actionBtn").disabled = true;
}

// ================= PASSWORD VALIDATION =================
newPassword.addEventListener("input", () => {
    if (!passwordPattern.test(newPassword.value)) {
        passwordError.textContent =
            "8–20 chars, uppercase, lowercase, number, special character, no spaces.";
    } else {
        passwordError.textContent = "";
    }
    validateConfirmPassword();
});

// ================= CONFIRM PASSWORD =================
confirmPassword.addEventListener("input", validateConfirmPassword);

function validateConfirmPassword() {
    if (confirmPassword.value === "") {
        confirmError.textContent = "";
        return;
    }
    confirmError.textContent =
        newPassword.value !== confirmPassword.value ? "Passwords do not match" : "";
}

// ================= SUBMIT =================
document.getElementById("resetForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validate before submitting
    if (!passwordPattern.test(newPassword.value)) {
        passwordError.textContent = "Password does not meet requirements.";
        return;
    }

    if (newPassword.value !== confirmPassword.value) {
        confirmError.textContent = "Passwords do not match.";
        return;
    }

    const actionBtn = document.getElementById("actionBtn");
    actionBtn.disabled = true;
    actionBtn.textContent = "Resetting...";

    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: token,           //  Send token from URL
                newPassword: newPassword.value
            })
        });

        const result = await response.text();

        if (response.ok) {
            message.className = "text-success";
            message.textContent = "Password reset successful! Redirecting to login...";
            setTimeout(() => window.location.href = "/login.html", 2000);
        } else {
            message.className = "text-danger";
            message.textContent = result || "Reset failed. Link may have expired.";
            actionBtn.disabled = false;
            actionBtn.textContent = "Reset Password";
        }

    } catch (error) {
        message.className = "text-danger";
        message.textContent = "Something went wrong. Please try again.";
        actionBtn.disabled = false;
        actionBtn.textContent = "Reset Password";
    }
});