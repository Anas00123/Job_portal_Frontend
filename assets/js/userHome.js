// =======================================
// USER DASHBOARD DYNAMIC SCRIPT
// =======================================

let currentUserId = null;

// =======================================
// INIT
// =======================================
document.addEventListener("DOMContentLoaded", async () => {
    await verifyAuth();
});

// =======================================
// AUTH
// =======================================
async function verifyAuth() {
    try {
        const res = await fetchWithRefresh(`${API_BASE_URL}/auth/me`);
        if (!res.ok) { window.location.href = "/user/loginForm.html"; return; }

        const user = await res.json();
        console.log("Auth user:", user); // ← debug

        if (user.role !== "JOB_SEEKER") { window.location.href = "/user/loginForm.html"; return; }

        currentUserId = user.userId;
        console.log("currentUserId:", currentUserId); // ← debug

        localStorage.setItem("user", JSON.stringify(user));

        loadBasicUserInfo();
        loadProfileDetails();
        loadRecommendedJobs();

    } catch (err) {
        console.error("Auth error:", err);
        window.location.href = "/user/loginForm.html";
    }
}

// =======================================
// INITIALS GENERATOR
// =======================================
function getInitials(name) {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getUser() {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch (e) { return null; }
}

// =======================================
// LOAD BASIC USER INFO
// =======================================
function loadBasicUserInfo() {
    const user = getUser();
    if (!user) return;

    const displayName = user.fullName || user.username;

    const navUsername = document.getElementById("navUsername");
    if (navUsername) navUsername.innerText = displayName;

    const profileName = document.querySelector(".profile-name");
    if (profileName) profileName.innerText = displayName;
}

// =======================================
// FETCH PROFILE DATA
// =======================================
async function loadProfileDetails() {
    try {
        const response = await fetchWithRefresh(`${API_BASE_URL}/profile/me`);

        if (!response.ok) { console.error("Failed to load profile"); return; }

        const profile = await response.json();

        renderAvatar(profile);
        renderExperience(profile.experience);
        renderEducation(profile.education);
        renderSkills(profile.skills);
        renderResume(profile.resumeUrl);

    } catch (err) {
        console.error("Profile load error:", err);
    }
}

// =======================================
// AVATAR RENDER
// =======================================
function renderAvatar(profile) {
    const user = getUser();
    if (!user) return;

    const displayName = user.fullName || user.username;
    const initials = getInitials(displayName);

    ["profileAvatar", "navAvatar", "mobileAvatar"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (profile.profileImg) {
            el.innerHTML = `<img src="${profile.profileImg}" alt="Profile"
                style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
            el.innerText = initials;
        }
    });
}

// =======================================
// EXPERIENCE RENDER
// =======================================
function renderExperience(experiences) {
    const el = document.getElementById("profileExperience");
    if (!el) return;
    if (!experiences || experiences.length === 0) { el.innerText = "Fresher"; return; }
    const { job_title, company_name } = experiences[0];
    el.innerText = job_title && company_name
        ? `${job_title} at ${company_name}`
        : job_title || company_name || "Fresher";
}

// =======================================
// EDUCATION RENDER
// =======================================
function renderEducation(educationList) {
    const el = document.getElementById("profileEducation");
    if (!el) return;
    if (!educationList || educationList.length === 0) { el.innerText = "Add Education"; return; }
    const { degree, specialization, institute_name } = educationList[0];
    el.innerText = degree && specialization
        ? `${degree} (${specialization}) - ${institute_name}`
        : institute_name || degree || "Education Added";
}

// =======================================
// SKILLS RENDER
// =======================================
function renderSkills(skills) {
    const container = document.getElementById("profileSkillsContainer");
    if (!container) return;
    container.innerHTML = "";
    if (!skills || skills.length === 0) return;

    const wrapper = document.createElement("div");
    wrapper.className = "job-tags mt-2";
    skills.forEach(skill => {
        const span = document.createElement("span");
        span.className = "badge me-1";
        span.innerText = skill.skillName || skill;
        wrapper.appendChild(span);
    });
    container.appendChild(wrapper);
}

// =======================================
// RESUME RENDER
// =======================================
function renderResume(resumeUrl) {
    const resumeNameEl = document.getElementById("resumeFileName");
    const downloadBtn = document.querySelector(".download-btn");
    const actionText = document.getElementById("resumeActionText");

    if (!resumeNameEl) return;

    if (!resumeUrl) {
        resumeNameEl.innerText = "No Resume Uploaded";
        if (downloadBtn) downloadBtn.style.display = "none";
        if (actionText) actionText.innerText = "Upload Resume";
        return;
    }

    const fileName = resumeUrl.split("/").pop().replace(/^[a-f0-9-]{36}_/, '');
    resumeNameEl.innerText = fileName;

    if (downloadBtn) {
        downloadBtn.style.display = "inline-block";
        downloadBtn.onclick = () => downloadMyResume(); // ← fixed: no candidateId needed
    }

    if (actionText) actionText.innerText = "Update Resume";
}

// =======================================
// RESUME DOWNLOAD
// =======================================
async function downloadMyResume() {
    if (!currentUserId) { alert("User not loaded yet"); return; }

    try {
        const res = await fetchWithRefresh(
            `${API_BASE_URL}/profile/download/resume/${currentUserId}`
        );

        if (res.status === 404) { alert("Resume not found"); return; }
        if (res.status === 403) { alert("Access denied"); return; }
        if (!res.ok) throw new Error("Failed");

        //  Blob not JSON
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `resume_${currentUserId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } catch (err) {
        console.error("Download error:", err);
        alert("Failed to download resume");
    }
}
// =======================================
// RESUME UPLOAD
// =======================================
document.getElementById("resumeInput")
    ?.addEventListener("change", async function () {
        const file = this.files[0];
        if (!file) return;

        if (file.type !== "application/pdf") { alert("Only PDF allowed"); return; }
        if (file.size > 10 * 1024 * 1024) { alert("Max file size 10MB"); return; }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetchWithRefresh(`${API_BASE_URL}/profile/upload/resume`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Upload failed");

            const data = await response.json();
            renderResume(data.resumeUrl);
            alert("Resume updated successfully");
            this.value = "";

        } catch (err) {
            console.error(err);
            alert("Upload failed");
        }
    });

// =======================================
// RECOMMENDED JOBS
// =======================================
// ── Pagination state ──
let currentPage = 0;
const pageSize = 5;
let totalPages = 0;
let debounceTimer;

// ── Debounced search (waits 400ms after typing stops) ──
function debounceSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentPage = 0; // reset to page 1 on new search
        loadJobs(0);
    }, 400);
}

// ── Clear all filters ──
function clearSearch() {
    document.getElementById("searchTitle").value = "";
    document.getElementById("searchLocation").value = "";
    document.getElementById("searchCategory").value = "";
    currentPage = 0;
    loadJobs(0);
}

// ── Load Jobs ──
async function loadJobs(page = 0) {
    const title = document.getElementById("searchTitle")?.value.trim() || null;
    const location = document.getElementById("searchLocation")?.value.trim() || null;
    const category = document.getElementById("searchCategory")?.value.trim() || null;

    const params = new URLSearchParams({ page, size: pageSize });
    if (title) params.append("title", title);
    if (location) params.append("location", location);
    if (category) params.append("category", category);

    try {
        const response = await fetch(`${API_BASE_URL}/jobs/openjobs?${params}`, {
            credentials: "include"
        });
        const data = await response.json();

        currentPage = data.number;
        totalPages = data.totalPages;

        document.getElementById("jobCount").innerText = data.totalElements || 0;

        renderJobs(data.content);
        renderFilterChips(title, location, category);
        renderPagination(data.totalPages, data.number);

    } catch (err) {
        console.error("Jobs load error:", err);
    }
}

// ── Render filter chips ──
function renderFilterChips(title, location, category) {
    const container = document.getElementById("activeFilters");
    container.innerHTML = "";
    const add = (label, field) => {
        const chip = document.createElement("div");
        chip.className = "filter-chip";
        chip.innerHTML = `${label} <button onclick="clearField('${field}')">✕</button>`;
        container.appendChild(chip);
    };
    if (title) add(`Title: ${title}`, "searchTitle");
    if (location) add(`Location: ${location}`, "searchLocation");
    if (category) add(`Category: ${category}`, "searchCategory");
}

// ── Clear a single filter chip ──
function clearField(fieldId) {
    document.getElementById(fieldId).value = "";
    currentPage = 0;
    loadJobs(0);
}

// ── Render Pagination ──
function renderPagination(total, current) {
    const container = document.getElementById("jobPagination");
    if (!container) return;
    container.innerHTML = "";
    if (total <= 1) return;

    const prev = document.createElement("button");
    prev.innerHTML = '<i class="bi bi-chevron-left"></i>';
    prev.disabled = current === 0;
    prev.onclick = () => loadJobs(current - 1);
    container.appendChild(prev);

    for (let i = 0; i < total; i++) {
        const btn = document.createElement("button");
        btn.innerText = i + 1;
        if (i === current) btn.classList.add("active");
        btn.onclick = () => loadJobs(i);
        container.appendChild(btn);
    }

    const next = document.createElement("button");
    next.innerHTML = '<i class="bi bi-chevron-right"></i>';
    next.disabled = current >= total - 1;
    next.onclick = () => loadJobs(current + 1);
    container.appendChild(next);
}

// ── Also call loadJobs from loadRecommendedJobs ──
async function loadRecommendedJobs() {
    loadJobs(0);
}

function renderJobs(jobs) {
    const container = document.getElementById("recommendedJobsContainer");
    container.innerHTML = "";

    if (!jobs || jobs.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-briefcase fs-1 d-block mb-3"></i>
                <h6>No jobs found</h6>
                <small>Try different keywords or clear filters</small>
            </div>`;
        return;
    }

    jobs.forEach(job => {
        const card = document.createElement("div");
        card.className = "job-card mb-3";
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="fw-bold mb-1">${job.title}</h6>
                    <small class="text-muted">
                        <i class="bi bi-building me-1"></i>${job.companyName || ""}
                        &nbsp;|&nbsp;
                        <i class="bi bi-geo-alt me-1"></i>${job.location || "Remote"}
                    </small>
                </div>
                <span class="badge bg-success-subtle text-success">${job.status}</span>
            </div>

            <div class="mt-2">
                <span class="badge bg-light text-dark me-1">
                    <i class="bi bi-tag me-1"></i>${job.categoryName || ""}
                </span>
                <span class="badge bg-light text-dark">
                    <i class="bi bi-cash me-1"></i>
                    ${job.salary ? '₹' + job.salary.toLocaleString('en-IN') : 'Not disclosed'}
                </span>
            </div>

            <p class="text-muted small mt-2 mb-2">
                ${job.description ? stripHtml(job.description).substring(0, 100) + "..." : ""}
            </p>

            <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                    <i class="bi bi-clock me-1"></i>${formatDate(job.createdAt)}
                </small>
                <div class="d-flex justify-content-between align-items-center">

             <div class="d-flex gap-2">
                <!-- View → goes to job detail page -->
                  <button class="btn btn-sm btn-outline-primary"
                     onclick="window.location.href='/job/jobDetails.html?id=${job.jobId}'">
                <i class="bi bi-eye me-1"></i> View
             </button>
            <!-- Apply → applies directly without redirect -->
             <button class="btn btn-sm btn-primary"
                    data-job-id="${job.jobId}"
                    onclick="applyJob(${job.jobId}, '${job.title.replace(/'/g, "\\'")}')">
                  <i class="bi bi-send me-1"></i> Apply
            </button>
            </div>
             </div>
            </div>`;
        container.appendChild(card);
    });
}

// Strip HTML tags for description preview
function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}
// =======================================
// APPLY JOB
// =======================================
async function applyJob(jobId, jobTitle) {
    // Show confirm dialog instead of redirecting
    if (!confirm(`Apply for "${jobTitle}"?\n\nYour saved resume will be submitted automatically.`)) return;

    try {
        const response = await fetchWithRefresh(`${API_BASE_URL}/applications/apply/${jobId}`, {
            method: "POST"
        });

        if (response.ok) {
            showToast("Applied successfully! 🎉", "success");
            // Disable the button so they can't apply twice
            const btn = document.querySelector(`button[data-job-id="${jobId}"]`);
            if (btn) {
                btn.disabled = true;
                btn.innerText = "Applied ✓";
                btn.classList.replace("btn-primary", "btn-success");
            }
        } else {
            const data = await response.json();
            showToast(data.message || "Failed to apply", "danger");
        }
    } catch (err) {
        console.error("Apply error:", err);
        showToast("Something went wrong", "danger");
    }
}

function showToast(message, type = "success") {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:9999;";
    wrapper.innerHTML = `
        <div class="toast show align-items-center text-white bg-${type} border-0">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto"
                        onclick="this.closest('div[style]').remove()"></button>
            </div>
        </div>`;
    document.body.appendChild(wrapper);
    setTimeout(() => wrapper.remove(), 3500);
}

// =======================================
// HELPERS
// =======================================
function formatSalary(salary) {
    if (!salary) return "Not disclosed";
    return salary.toLocaleString("en-IN");
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
    });
}

// =======================================
// LOGOUT
// =======================================
async function logout() {
    try {
        await fetchWithRefresh(`${API_BASE_URL}/auth/logout`, { method: "POST" }); 
    } catch (err) {
        console.error("Logout error", err);
    }
    localStorage.clear();
    window.location.href = "/user/loginForm.html";
}