// =======================================
// PROFILE PAGE SCRIPT (COOKIE AUTH)
// =======================================

const HEADERS = {
    "Content-Type": "application/json"
};

let currentUserId = null;
let addressId = null;
let currentAddress = null;

// =======================================
// AUTH VERIFY
// =======================================

async function verifyAuth() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: HEADERS
        });

        if (!res.ok) {
            window.location.href = "/user/loginForm.html";
            return;
        }

        const user = await res.json();

        if (user.role !== "JOB_SEEKER") {
            window.location.href = "/user/loginForm.html";
            return;
        }

        //  Store userId for resume download
        currentUserId = user.userId;

        //  Set name and email from /me response
        document.getElementById("piName").innerText = user.fullName;
        document.getElementById("piEmail").innerText = user.email;
        document.getElementById("avatarBox").innerText = getInitials(user.fullName);

        console.log("Authenticated user:", user);
        //  Load rest of profile
        loadProfile();

    } catch (err) {
        console.error("Auth error:", err);
        window.location.href = "/user/loginForm.html";
    }
}

// =======================================
// INITIALS
// =======================================

function getInitials(name) {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1
        ? parts[0][0] + parts[1][0]
        : parts[0][0];
}

// =======================================
// LOAD PROFILE
// =======================================

async function loadProfile() {
    try {
        const res = await fetchWithRefresh(`${API_BASE_URL}/profile/me`, {
            credentials: "include",
            headers: HEADERS
        });

        if (!res.ok) throw new Error("Failed to load profile");

        const profile = await res.json();

        renderAvatar(profile);
        renderResume(profile.resumeUrl);

        if (profile.address) {
            document.getElementById("piAddress").innerText =
                profile.address.addressLine || "Not Added";
        }

        loadSkills();
        loadEducation();
        loadExperience();
        loadAddress();

    } catch (err) {
        console.error("Profile load error:", err);
    }
}

// =======================================
// AVATAR
// =======================================

function renderAvatar(profile) {
    const box = document.getElementById("avatarBox");

    if (profile.profileImg) {
        box.innerHTML = `
            <img src="${profile.profileImg}"
                 style="width:100%;height:100%;
                 border-radius:50%;object-fit:cover">
        `;
    } else {
        box.innerText = getInitials(
            document.getElementById("piName").innerText
        );
    }
}

// =======================================
// PROFILE IMAGE UPLOAD
// =======================================

// ✅ Fix profile image upload
document.getElementById("profileImageInput")
    ?.addEventListener("change", async function () {
        const file = this.files[0];
        if (!file) return;

        const fd = new FormData();
        fd.append("file", file);

        try {
            // ✅ Use fetchWithRefresh but override headers to remove Content-Type
            const res = await fetch(
                `${API_BASE_URL}/profile/upload/profileimg`,
                {
                    method: "POST",
                    credentials: "include",
                    body: fd
                    
                    // ✅ NO Content-Type - browser sets multipart automatically
                }
            );

            if (res.status === 401) {
                // ✅ Token expired - redirect to login
                window.location.href = "/user/loginForm.html";
                return;
            }

            if (res.ok) {
                loadProfile();
                alert("Profile photo updated");
            } else {
                const data = await res.json();
                alert(data.message || "Upload failed");
            }
        } catch (err) {
            console.error("Image upload error:", err);
            alert("Upload failed");
        }
    });

// =======================================
// RESUME
// =======================================

function renderResume(path) {
    const nameEl = document.getElementById("resumeName");
    const download = document.getElementById("downloadResume");

    if (!path) {
        nameEl.innerText = "No Resume Uploaded";
        download.style.display = "none";
        return;
    }

    //  Extract clean filename
    const file = path.split("/").pop()
        .replace(/^[a-f0-9-]{36}_/, '');

    nameEl.innerText = file;
    download.style.display = "inline-block";
}

//  Resume upload
document.getElementById("resumeInput")
    ?.addEventListener("change", async function () {
        const file = this.files[0];
        if (!file) return;

        const fd = new FormData();
        fd.append("file", file);

        try {
            const res = await fetch(
                `${API_BASE_URL}/profile/upload/resume`,
                {
                    method: "POST",
                    credentials: "include",
                    body: fd
                }
            );

            if (res.ok) {
                const data = await res.json();
                renderResume(data.resumeUrl);
                alert("Resume updated");
            } else {
                alert("Upload failed");
            }
        } catch (err) {
            console.error("Resume upload error:", err);
            alert("Upload failed");
        }
    });

//  Resume download via secure Spring Boot endpoint
async function downloadMyResume() {
    if (!currentUserId) {
        alert("User not loaded yet. Please wait.");
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/profile/download/resume/${currentUserId}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (response.status === 404) {
            alert("No resume found. Please upload one first.");
            return;
        }

        if (!response.ok) throw new Error("Download failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "resume.pdf";
        a.click();
        window.URL.revokeObjectURL(url);

    } catch (err) {
        console.error("Download error:", err);
        alert("Failed to download resume");
    }
}

// =======================================
// ADDRESS
// =======================================

async function loadAddress() {
    try {
        const res = await fetch(`${API_BASE_URL}/profile/address`, {
            credentials: "include" 
        });

        if (!res.ok) {
            document.getElementById("piAddress").innerHTML = "Not Added";
            return;
        }

        const addr = await res.json();
        addressId = addr.addressId;        // ← camelCase from DTO
        currentAddress = addr;

        document.getElementById("piAddress").innerHTML = `
            ${addr.addressLine1 || ""}<br>
            ${addr.addressLine2 || ""}<br>
            ${addr.city || ""}, ${addr.state || ""}<br>
            ${addr.country || ""} - ${addr.pincode || ""}
        `;

    } catch {
        document.getElementById("piAddress").innerHTML = "Not Added";
    }
}

function openAddressModal() {
    if (currentAddress) {
        document.getElementById("addrLine1").value = currentAddress.addressLine1 || "";
        document.getElementById("addrLine2").value = currentAddress.addressLine2 || "";
        document.getElementById("addrCity").value = currentAddress.city || "";
        document.getElementById("addrState").value = currentAddress.state || "";
        document.getElementById("addrCountry").value = currentAddress.country || "";
        document.getElementById("addrPincode").value = currentAddress.pincode || "";
    }
    new bootstrap.Modal(document.getElementById("addressModal")).show();
}

async function saveAddress() {
    const payload = {
        addressLine1: document.getElementById("addrLine1").value,    // ← camelCase to match DTO
        addressLine2: document.getElementById("addrLine2").value,
        city: document.getElementById("addrCity").value,
        state: document.getElementById("addrState").value,
        country: document.getElementById("addrCountry").value,
        pincode: document.getElementById("addrPincode").value,
        isPrimary: true
    };

    console.log("Saving address with payload:", payload);
    try {
        const res = await fetchWithRefresh(`${API_BASE_URL}/profile/address`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
            
            
        });

        
        if (!res.ok) {
            alert("Failed to save address");
            return;
        }

        bootstrap.Modal
            .getInstance(document.getElementById("addressModal"))
            .hide();

        loadAddress();

    } catch (err) {
        console.error("Address save error:", err);
        alert("Failed to save address");
    }
}

// =======================================
// SKILLS
// =======================================

function openSkillModal() {
    new bootstrap.Modal(document.getElementById("skillModal")).show();
}

async function saveSkill() {
    const skillName = document.getElementById("skillName").value.trim();
    if (!skillName) return;

    try {
        const response = await fetch(`${API_BASE_URL}/profile/skills`, {
            method: "POST",
            credentials: "include",
            headers: HEADERS,
            body: JSON.stringify({ skill_name: skillName })
        });

        if (!response.ok) throw new Error("Skill add failed");

        bootstrap.Modal
            .getInstance(document.getElementById("skillModal"))
            .hide();

        document.getElementById("skillName").value = "";
        loadSkills();

    } catch (err) {
        console.error(err);
        alert("Unable to add skill");
    }
}

async function loadSkills() {
    try {
        const res = await fetch(`${API_BASE_URL}/profile/skills`, {
            credentials: "include",
            headers: HEADERS
        });

        const skills = await res.json();
        const container = document.getElementById("skillContainer");
        container.innerHTML = "";

        skills.forEach(skill => {
            container.innerHTML += `
                <span class="skill-badge">
                    ${skill.skillName}
                    <i class="bi bi-x ms-1"
                       onclick="deleteSkill(${skill.skillId})">
                    </i>
                </span>
            `;
        });

    } catch (err) {
        console.error("Skills load error:", err);
    }
}

async function deleteSkill(id) {
    if (!confirm("Are you sure you want to delete this skill?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/profile/skills/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: HEADERS
        });

        if (!response.ok) throw new Error("Delete failed");
        loadSkills();

    } catch (err) {
        console.error(err);
        alert("Unable to delete skill");
    }
}

// =======================================
// EXPERIENCE
// =======================================

async function loadExperience() {
    try {
        const res = await fetch(`${API_BASE_URL}/profile/experience`, {
            credentials: "include",
            headers: HEADERS
        });

        const list = await res.json();
        const container = document.getElementById("experienceContainer");
        container.innerHTML = "";

        if (!list || list.length === 0) {
            container.innerHTML = "<p class='text-muted'>No experience added</p>";
            return;
        }

        list.forEach(exp => {
            container.innerHTML += `
                <div class="dashboard-card mb-3">
                    <div class="d-flex justify-content-between">
                        <div>
                            <h6 class="mb-1">${exp.job_title || "-"}</h6>
                            <div class="text-muted">${exp.company_name || "-"}</div>
                            <small>${exp.employment_type || ""}</small>
                            <div class="small text-muted mt-1">
                                ${formatDate(exp.start_date)} -
                                ${exp.isCurrentJob ? "Present" : formatDate(exp.end_date)}
                                • ${calculateExperienceDuration(
                exp.start_date,
                exp.end_date,
                exp.isCurrentJob
            )}
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-teal"
                                onclick="editExperience(${exp.exp_id})">
                                Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger"
                                onclick="deleteExperience(${exp.exp_id})">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.error("Experience load error:", err);
    }
}

function openExperienceModal(exp = null) {
    const modal = new bootstrap.Modal(
        document.getElementById("experienceModal")
    );

    if (exp) {
        document.getElementById("expId").value = exp.exp_id;
        document.getElementById("jobTitle").value = exp.job_title || "";
        document.getElementById("companyName").value = exp.company_name || "";
        document.getElementById("employmentType").value = exp.employment_type || "FULL TIME";
        document.getElementById("startDate").value = exp.start_date || "";
        document.getElementById("endDate").value = exp.end_date || "";
        document.getElementById("currentJob").checked = exp.isCurrentJob || false;
    } else {
        document.getElementById("expId").value = "";
        document.getElementById("jobTitle").value = "";
        document.getElementById("companyName").value = "";
        document.getElementById("employmentType").value = "FULL TIME";
        document.getElementById("startDate").value = "";
        document.getElementById("endDate").value = "";
        document.getElementById("currentJob").checked = false;
    }

    modal.show();
}

async function saveExperience() {
    const id = document.getElementById("expId").value;

    const payload = {
        job_title: document.getElementById("jobTitle").value,
        company_name: document.getElementById("companyName").value,
        employment_type: document.getElementById("employmentType").value,
        start_date: document.getElementById("startDate").value,
        end_date: document.getElementById("endDate").value,
        isCurrentJob: document.getElementById("currentJob").checked
    };

    const url = id ? `${API_BASE_URL}/profile/experience/${id}` : `${API_BASE_URL}/profile/experience`;
    const method = id ? "PUT" : "POST";

    try {
        await fetch(url, {
            method,
            credentials: "include",
            headers: HEADERS,
            body: JSON.stringify(payload)
        });

        bootstrap.Modal
            .getInstance(document.getElementById("experienceModal"))
            .hide();

        loadExperience();

    } catch (err) {
        console.error("Experience save error:", err);
        alert("Failed to save experience");
    }
}

async function deleteExperience(id) {
    if (!confirm("Delete this experience?")) return;

    try {
        await fetch(`${API_BASE_URL}/profile/experience/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: HEADERS
        });
        loadExperience();
    } catch (err) {
        console.error(err);
    }
}

async function editExperience(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/profile/experience`, {
            credentials: "include",
            headers: HEADERS
        });
        const list = await res.json();
        const exp = list.find(e => e.exp_id === id);

        if (!exp) {
            alert("Experience not found");
            return;
        }

        openExperienceModal(exp);

    } catch (err) {
        console.error(err);
        alert("Unable to load experience");
    }
}

function calculateExperienceDuration(startDate, endDate, isCurrent) {
    if (!startDate) return "";
    const start = new Date(startDate);
    const end = isCurrent || !endDate ? new Date() : new Date(endDate);
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    if (months < 0) { years--; months += 12; }
    let result = "";
    if (years > 0) result += `${years} yr${years > 1 ? "s" : ""} `;
    if (months > 0) result += `${months} month${months > 1 ? "s" : ""}`;
    return result.trim() || "Less than a month";
}

function formatDate(date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric"
    });
}

// =======================================
// EDUCATION
// =======================================

function editEducation(edu) {
    openEducationModal(edu);
}

function openEducationModal(edu = null) {
    const modal = new bootstrap.Modal(
        document.getElementById("educationModal")
    );

    if (edu) {
        document.getElementById("educationId").value = edu.edu_id;
        document.getElementById("boardName").value = edu.board_name || "";
        document.getElementById("degree").value = edu.degree || "";
        document.getElementById("specialization").value = edu.specialization || "";
        document.getElementById("institute").value = edu.institute_name || "";
        document.getElementById("eduStart").value = edu.start_year || "";
        document.getElementById("eduEnd").value = edu.end_year || "";
        document.getElementById("percentage").value = edu.percentage || "";
    } else {
        document.querySelectorAll("#educationModal input")
            .forEach(i => i.value = "");
        document.getElementById("educationId").value = "";
    }

    modal.show();
}

async function saveEducation() {
    const id = document.getElementById("educationId").value;

    const payload = {
        board_name: document.getElementById("boardName").value,
        degree: document.getElementById("degree").value,
        specialization: document.getElementById("specialization").value,
        institute_name: document.getElementById("institute").value,
        start_year: document.getElementById("eduStart").value,
        end_year: document.getElementById("eduEnd").value,
        percentage: document.getElementById("percentage").value
    };

    const url = id ? `${API_BASE_URL}/profile/education/${id}` : `${API_BASE_URL}/profile/education`;
    const method = id ? "PUT" : "POST";

    try {
        await fetch(url, {
            method,
            credentials: "include",
            headers: HEADERS,
            body: JSON.stringify(payload)
        });

        bootstrap.Modal
            .getInstance(document.getElementById("educationModal"))
            .hide();

        loadEducation();

    } catch (err) {
        console.error("Education save error:", err);
        alert("Failed to save education");
    }
}

async function deleteEducation(id) {
    if (!confirm("Delete this education?")) return;

    try {
        await fetch(`${API_BASE_URL}/profile/education/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: HEADERS
        });
        loadEducation();
    } catch (err) {
        console.error(err);
    }
}

async function loadEducation() {
    try {
        const res = await fetch(`${API_BASE_URL}/profile/education`, {
            credentials: "include",
            headers: HEADERS
        });

        const list = await res.json();
        const container = document.getElementById("educationContainer");
        container.innerHTML = "";

        if (!list || list.length === 0) {
            container.innerHTML = "<p class='text-muted'>No education added</p>";
            return;
        }

        list.forEach(edu => {
            container.innerHTML += `
                <div class="dashboard-card my-3">
                    <div class="d-flex justify-content-between">
                        <div>
                            <h6 class="mb-1">
                                ${edu.degree || "-"}
                                ${edu.specialization ? `(${edu.specialization})` : ""}
                            </h6>
                            <div class="text-muted">${edu.institute_name || "-"}</div>
                            <small>Board: ${edu.board_name || "-"}</small>
                            <div class="small text-muted mt-1">
                                ${edu.start_year || "-"} - ${edu.end_year || "Present"}
                            </div>
                            <div class="mt-1">
                                Percentage: <b>${edu.percentage || "-"}</b>
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-teal"
                                onclick='editEducation(${JSON.stringify(edu)})'>
                                Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger"
                                onclick="deleteEducation(${edu.edu_id})">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.error("Education load error:", err);
    }
}

// =======================================
// INIT
// =======================================

document.addEventListener("DOMContentLoaded", () => {
    verifyAuth();  //  Single entry point — everything starts here
});