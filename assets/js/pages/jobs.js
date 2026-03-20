let currentPage = 0;
const pageSize = 6;
let totalPages = 0;
let debounceTimer;
let selectedJobId = null;
let selectedJobTitle = null;
// let isLoggedIn = false;


function goToJobsPage() {
    const title = document.getElementById("searchTitle")?.value.trim();
    const location = document.getElementById("searchLocation")?.value.trim();
    const category = document.getElementById("searchCategory")?.value.trim();

    const params = new URLSearchParams();
    if (title) params.append("title", title);
    if (location) params.append("location", location);
    if (category) params.append("category", category);

    window.history.replaceState({}, "", `?${params.toString()}`);
    currentPage = 0;
    loadJobs(0);
}

function debounceSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentPage = 0;
        loadJobs(0);
    }, 400);
}

function clearSearch() {
    document.getElementById("searchTitle").value = "";
    document.getElementById("searchLocation").value = "";
    document.getElementById("searchCategory").value = "";
    currentPage = 0;
    updateURL();
    loadJobs(0);
}

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

        const jobCount = document.getElementById("jobCount");
        if (jobCount) jobCount.innerText = data.totalElements || 0;

        renderJobs(data.content);
        renderFilterChips(title, location, category);
        renderPagination(data.totalPages, data.number);

    } catch (err) {
        console.error("Jobs load error:", err);
    }
}

function renderFilterChips(title, location, category) {
    const container = document.getElementById("activeFilters");
    if (!container) return;
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

function clearField(fieldId) {
    document.getElementById(fieldId).value = "";
    currentPage = 0;
    updateURL();
    loadJobs(0);
}

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

function renderJobs(jobs) {
    const container = document.getElementById("recommendedJobsContainer");
    container.innerHTML = "";

    if (!jobs || jobs.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="bi bi-briefcase fs-1 d-block mb-3"></i>
                <h6>No jobs found</h6>
                <small>Try different keywords or clear filters</small>
            </div>`;
        return;
    }

    jobs.forEach(job => {
        const col = document.createElement("div");
        col.className = "col";
        col.innerHTML = `
            <div class="job-card h-100 d-flex flex-column">

                <!-- Top: title + badge -->
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 class="fw-bold mb-1">${job.title}</h6>
                        <small class="text-muted">
                            <i class="bi bi-building me-1"></i>${job.companyName || ""}
                        </small>
                    </div>
                    <span class="badge bg-success-subtle text-success ms-2 flex-shrink-0">${job.status}</span>
                </div>

                <!-- Location -->
                <small class="text-muted mb-2">
                    <i class="bi bi-geo-alt me-1"></i>${job.location || "Remote"}
                </small>

                <!-- Tags -->
                <div class="mb-2 d-flex flex-wrap gap-1">
                    <span class="badge bg-light text-dark">
                        <i class="bi bi-tag me-1"></i>${job.categoryName || ""}
                    </span>
                    <span class="badge bg-light text-dark">
                        <i class="bi bi-cash me-1"></i>
                        ${job.salary ? '₹' + job.salary.toLocaleString('en-IN') : 'Not disclosed'}
                    </span>
                </div>

                <!-- Description -->
                <p class="text-muted small mb-3 flex-grow-1">
                    ${job.description ? stripHtml(job.description).substring(0, 100) + "..." : "No description available."}
                </p>

                <!-- Footer: date + buttons -->
                <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                    <small class="text-muted">
                        <i class="bi bi-clock me-1"></i>${formatDate(job.createdAt)}
                    </small>
                    <div class="d-flex gap-2 align-items-stretch">
                        <button class="my-btn btn-outline-primary h-100"
                            onclick="window.location.href='/job/jobDetails.html?id=${job.jobId}'">
                            <i class="bi bi-eye me-1"></i>View
                        </button>
                        <button class="apply-btn  h-100"
                            onclick="applyJob(${job.jobId}, '${job.title.replace(/'/g, "\\'")}')">
                            <i class="bi bi-send me-1"></i>Apply
                        </button>
                    </div>
                </div>

            </div>`;
        container.appendChild(col);
    });
}
function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// ── Read URL params and auto-trigger search on page load ──
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);

    document.getElementById("searchTitle").value = params.get("title") || "";
    document.getElementById("searchLocation").value = params.get("location") || "";
    document.getElementById("searchCategory").value = params.get("category") || "";

    // wire up debounce on inputs
    ["searchTitle", "searchLocation", "searchCategory"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", debounceSearch);
    });

    await checkAuth();
    loadJobs(0);
    // ── Auto-open apply modal if user just logged in ──
    checkPendingApply();

});

function updateURL() {
    const title = document.getElementById("searchTitle")?.value.trim();
    const location = document.getElementById("searchLocation")?.value.trim();
    const category = document.getElementById("searchCategory")?.value.trim();

    const params = new URLSearchParams();
    if (title) params.append("title", title);
    if (location) params.append("location", location);
    if (category) params.append("category", category);

    const queryString = params.toString();
    window.history.replaceState(
        {},
        "",
        queryString ? `?${queryString}` : window.location.pathname  // ← clears URL completely when empty
    );
}
function formatDate(dateStr) {
    if (!dateStr) return "Recently posted";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
    });
}

async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            credentials: "include"
        });

        if (res.ok) {
            const user = await res.json();
            //  Only job seekers can apply
            isLoggedIn = user.role === "JOB_SEEKER";
        }
    } catch {
        isLoggedIn = false;
    }
}

//  Apply button clicked — check login first
function applyJob(jobId, jobTitle) {
    if (!isLoggedIn) {

        selectedJobId = jobId;
        selectedJobTitle = jobTitle;


        //  Show login modal instead of redirecting
        new bootstrap.Modal(
            document.getElementById("loginModal")
        ).show();
        return;
    }

    //  User is logged in — show apply confirmation

    document.getElementById("applyJobTitle").innerText = jobTitle;

    new bootstrap.Modal(
        document.getElementById("applyModal")
    ).show();
}

//  Confirm apply
async function confirmApply() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications/apply/${selectedJobId}`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        });

        bootstrap.Modal
            .getInstance(document.getElementById("applyModal"))
            .hide();

        if (response.ok) {
            showToast("Applied successfully! 🎉", "success");
        } else if (response.status === 409) {
            showToast("You have already applied for this job", "warning");
        } else {
            showToast("Failed to apply. Please try again.", "danger");
        }

    } catch (err) {
        console.error("Apply error:", err);
        showToast("Something went wrong", "danger");
    }
}


//  Redirect to login — save current page to return after login
function redirectToLogin() {
    sessionStorage.setItem("redirectAfterLogin", window.location.href);

    // save which job user wanted to apply
    sessionStorage.setItem("pendingJobId", selectedJobId);
    sessionStorage.setItem("pendingJobTitle", selectedJobTitle);

    window.location.href = "../user/loginForm.html";
}

//  View job detail
function viewJobDetail(jobId) {
    window.location.href = `/job/jobDetails.html?id=${jobId}`;
}
function showToast(message, type = "success") {
    const toast = document.getElementById("appToast");
    const toastMsg = document.getElementById("toastMessage");

    // reset classes
    toast.className = "toast align-items-center border-0 text-white";
    toast.classList.add(`bg-${type}`);
    toastMsg.innerText = message;

    bootstrap.Toast.getOrCreateInstance(toast).show();
}



function checkPendingApply() {
    const pendingJobId = sessionStorage.getItem("pendingJobId");
    const pendingJobTitle = sessionStorage.getItem("pendingJobTitle");

    if (!pendingJobId || !pendingJobTitle) return;

    // clear immediately so it doesn't re-trigger on refresh
    sessionStorage.removeItem("pendingJobId");
    sessionStorage.removeItem("pendingJobTitle");

    // wait for auth check + jobs to load, then open modal

    if (!isLoggedIn) return; // safety check

    selectedJobId = pendingJobId;
    selectedJobTitle = pendingJobTitle;

    document.getElementById("applyJobTitle").innerText = pendingJobTitle;
    new bootstrap.Modal(document.getElementById("applyModal")).show();

}