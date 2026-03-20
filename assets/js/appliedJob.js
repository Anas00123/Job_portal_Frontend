document.addEventListener("DOMContentLoaded", loadMyApplications);

async function loadMyApplications() {
    try {
        const response = await fetchWithRefresh(`${API_BASE_URL}/applications/my`, {
            credentials: "include"
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const applications = await response.json();
        renderApplications(applications);
        renderStats(applications);

    } catch (error) {
        console.error("Error:", error);
        document.getElementById("applicationsTableBody").innerHTML = `
            <tr><td colspan="5" class="text-center text-danger">Failed to load applications</td></tr>`;
    }
}

function renderApplications(applications) {
    const tbody = document.getElementById("applicationsTableBody");

    if (applications.length === 0) {
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
            <td class="fw-semibold">${app.jobTitle}</td>
            <td>${app.companyName}</td>
            <td><i class="bi bi-geo-alt text-muted me-1"></i>${app.location}</td>
            <td><span class="badge ${getStatusBadge(app.status)}">${app.status}</span></td>
            <td class="text-muted">${new Date(app.appliedAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
    })}</td>
        </tr>
    `).join("");
}

function getStatusBadge(status) {
    const badges = {
        "APPLIED": "bg-primary text-white",
        "SHORTLISTED": "bg-warning text-dark",
        "HIRED": "bg-success text-white",
        "REJECTED": "bg-danger text-white"
    };
    return badges[status] || "bg-secondary text-white";
}

function renderStats(applications) {
    document.getElementById("countApplied").textContent =
        applications.filter(a => a.applicationStatus === "APPLIED").length;
    document.getElementById("countShortlisted").textContent =
        applications.filter(a => a.applicationStatus === "SHORTLISTED").length;
    document.getElementById("countHired").textContent =
        applications.filter(a => a.applicationStatus === "HIRED").length;
    document.getElementById("countRejected").textContent =
        applications.filter(a => a.applicationStatus === "REJECTED").length;
}