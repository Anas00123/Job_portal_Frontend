document.addEventListener("DOMContentLoaded", loadMyApplications);

async function loadMyApplications() {
    try {
        const response = await fetchWithRefresh(`${API_BASE_URL}/applications/my`, {
            credentials: "include"
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const applications = await response.json();
        console.log("Applications:", applications); // ← debug
        renderApplications(applications);
        renderStats(applications);

    } catch (error) {
        console.error("Error:", error);
        document.getElementById("applicationsTableBody").innerHTML = `
            <tr><td colspan="5" class="text-center text-danger">
                Failed to load applications
            </td></tr>`;
    }
}

function renderApplications(applications) {
    const tbody = document.getElementById("applicationsTableBody");

    if (!applications || applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                    No applications yet
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = applications.map(app => `
        <tr>
            <td class="fw-semibold">${app.jobTitle || "-"}</td>
            <td>${app.companyName || "-"}</td>
            <td>
                <span class="badge ${getStatusBadge(app.applicationStatus)}">
                    ${app.applicationStatus || "-"}
                </span>
            </td>
            <td class="text-muted">
                ${app.appliedAt ? new Date(app.appliedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                }) : "-"}
            </td>
            <td>
                ${app.resumeUrl
                    ? `<a href="${app.resumeUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-file-earmark-pdf me-1"></i>View
                       </a>`
                    : '<span class="text-muted small">Not available</span>'
                }
            </td>
        </tr>
    `).join("");
}

function getStatusBadge(status) {
    const badges = {
        "APPLIED":     "bg-primary text-white",
        "SHORTLISTED": "bg-warning text-dark",
        "HIRED":       "bg-success text-white",
        "REJECTED":    "bg-danger text-white"
    };
    return badges[status] || "bg-secondary text-white";
}

function renderStats(applications) {
    // ✅ Use applicationStatus consistently
    document.getElementById("countApplied").textContent =
        applications.filter(a => a.applicationStatus === "APPLIED").length;
    document.getElementById("countShortlisted").textContent =
        applications.filter(a => a.applicationStatus === "SHORTLISTED").length;
    document.getElementById("countHired").textContent =
        applications.filter(a => a.applicationStatus === "HIRED").length;
    document.getElementById("countRejected").textContent =
        applications.filter(a => a.applicationStatus === "REJECTED").length;
}