
let allApplications = [];

//  Pagination state — declared at top level (was inside function before!)
let currentPage = 0;
const pageSize = 5;
let totalPages = 0;

document.addEventListener("DOMContentLoaded", () => {
    verifyAuth();
    loadApplicationStats()
});

//  Verify auth via cookie
async function verifyAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            window.location.href = "/recruiterLoginForm.html";
            return;
        }

        const user = await response.json();

        if (user.role !== "RECRUITER") {
            window.location.href = "/recruiterLoginForm.html";
            return;
        }

        getApplication(0);

    } catch (error) {
        console.error("Auth error:", error);
        window.location.href = "/recruiterLoginForm.html";
    }
}

//  Load applications with correct page param
async function getApplication(page = 0) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/applications/recruiter?page=${page}&size=${pageSize}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) throw new Error("Failed to fetch applications");

        const data = await response.json();
        allApplications = data.content || [];

        //  Update pagination state
        currentPage = data.number;
        totalPages = data.totalPages;

        loadApplicationStats();
        populateJobFilter(allApplications);
        renderApplications(allApplications);
        updatePaginationControls();

    } catch (err) {
        console.error("Applications error:", err);
        showToast("Failed to load applications", "danger");
    }
}

//  Pagination controls
function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 0 && newPage < totalPages) {
        getApplication(newPage);
    }
}

function updatePaginationControls() {
    document.getElementById("pageInfo").innerText =
        `Page ${currentPage + 1} of ${totalPages}`;
    document.getElementById("prevBtn").disabled = currentPage === 0;
    document.getElementById("nextBtn").disabled = currentPage >= totalPages - 1;
}

//  Update status counts
async function loadApplicationStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications/my/application/count`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch application stats");

        const data = await response.json();


        document.getElementById("totalCount").innerText = data.totalApplication || 0;
        document.getElementById("appliedCount").innerText = data.applied || 0;
        document.getElementById("shortlistedCount").innerText = data.shortlisted || 0;
        document.getElementById("hiredCount").innerText = data.hired || 0;
        document.getElementById("rejectedCount").innerText = data.rejected || 0;

    } catch (error) {
        console.error("Application stats error:", error);
    }
}

//  Populate job filter dropdown
function populateJobFilter(applications) {
    const jobFilter = document.getElementById("jobFilter");
    jobFilter.innerHTML = `<option value="">All Jobs</option>`;
    const uniqueJobs = [...new Set(applications.map(a => a.jobTitle))];
    uniqueJobs.forEach(title => {
        jobFilter.innerHTML += `<option value="${title}">${title}</option>`;
    });
}

//  Filter logic
function applyFilters() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const job = document.getElementById("jobFilter").value;
    const status = document.getElementById("statusFilter").value;

    const filtered = allApplications.filter(app => {
        const matchName = app.candidateName.toLowerCase().includes(search);
        const matchJob = job ? app.jobTitle === job : true;
        const matchStatus = status ? app.applicationStatus === status : true;
        return matchName && matchJob && matchStatus;
    });

    renderApplications(filtered);
}

//  Render table — fixed unclosed <td> bug
function renderApplications(applications) {
    const tableBody = document.getElementById("apptbody");
    tableBody.innerHTML = "";

    if (!applications || applications.length === 0) {
        tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted py-4">
                            <i class="bi bi-inbox fs-4 d-block mb-2"></i>
                            No Applications Found
                        </td>
                    </tr>`;
        return;
    }

    let sno = (currentPage * pageSize) + 1; //  Serial number continues across pages

    applications.forEach(app => {
        const statusClass = `status-${app.applicationStatus}`;
        const date = new Date(app.appliedAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
        tableBody.innerHTML += `
                    <tr>
                        <td>${sno++}</td>
                        <td>
                            <strong>${app.candidateName}</strong><br>
                            <small class="text-muted">${app.candidateEmail}</small>
                        </td>
                        <td>${app.jobTitle}</td>
                        <td style="white-space: nowrap;">${date}</td>
                        <td>
                            <span class="status-badge ${statusClass}"
                                  id="badge-${app.applicationId}">
                                ${app.applicationStatus}
                            </span>
                        </td>
                       <td>
                          <button class="btn btn-sm px-3 btn-outline-primary"
                               onclick="downloadCandidateResume(${app.candidateId})">
                                  <i class="bi bi-file-earmark-pdf me-1"></i>
                          </button>
                        </td>
                        <td>
                            <div class="d-flex gap-2 align-items-center">
                                <select class="form-select form-select-sm"
                                        id="status-${app.applicationId}"
                                        style="width: 130px;">
                                    <option value="SHORTLISTED"
                                        ${app.applicationStatus === 'SHORTLISTED' ? 'selected' : ''}>
                                        Shortlisted
                                    </option>
                                    <option value="HIRED"
                                        ${app.applicationStatus === 'HIRED' ? 'selected' : ''}>
                                        Hired
                                    </option>
                                    <option value="REJECTED"
                                        ${app.applicationStatus === 'REJECTED' ? 'selected' : ''}>
                                        Rejected
                                    </option>
                                </select>
                                <button class="btn btn-sm btn-primary"
                                        onclick="updateStatus(${app.applicationId})">
                                    Update
                                </button>
                            </div>
                        </td>
                    </tr>`;
    });
}

//  Update application status
async function updateStatus(applicationId) {
    const select = document.getElementById(`status-${applicationId}`);
    const newStatus = select.value;

    try {
        const response = await fetch(
            `${API_BASE_URL}/applications/${applicationId}/status`,
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus })
            }
        );

        if (!response.ok) throw new Error("Failed to update status");

        const app = allApplications.find(a => a.applicationId === applicationId);
        if (app) app.applicationStatus = newStatus;

        const badge = document.getElementById(`badge-${applicationId}`);
        if (badge) {
            badge.className = `status-badge status-${newStatus}`;
            badge.innerText = newStatus;
        }

        updateStats(allApplications);
        showToast(`Status updated to ${newStatus}`, "success");

    } catch (err) {
        console.error("Status update error:", err);
        showToast("Failed to update status", "danger");
    }
}

//  Toast notification
function showToast(message, type = "success") {
    const toast = document.getElementById("statusToast");
    const toastMessage = document.getElementById("toastMessage");
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toastMessage.innerText = message;
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
}
//  Download resume

const downloadCandidateResume = async (candidateUserId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/profile/download/resume/${candidateUserId}`, {
            method: "GET",
            credentials: "include"
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `resume_${candidateUserId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);

        } else if (response.status === 403) {
            alert("You don't have permission to download this resume.");
        } else if (response.status === 404) {
            alert("Resume not found for this candidate.");
        } else {
            alert("Something went wrong. Please try again.");
        }

    } catch (error) {
        console.error("Resume download error:", error);
        alert("Network error. Please check your connection.");
    }
};
