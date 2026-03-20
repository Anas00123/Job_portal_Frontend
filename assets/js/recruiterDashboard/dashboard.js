
//  No token check from localStorage — cookies are sent automatically

document.addEventListener("DOMContentLoaded", () => {
    verifyAuth();  //  First verify auth via /me endpoint
});

//  Check auth using cookie (not localStorage)
async function verifyAuth() {
    try {
        const response = await fetchWithRefresh(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            credentials: "include",  //  Sends cookie automatically
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            // Not authenticated → redirect to login
            window.location.href = "/recruiterLoginForm.html";
            return;
        }

        const user = await response.json();

        //  Check role
        if (user.role !== "RECRUITER") {
            window.location.href = "/recruiterLoginForm.html";  //  Redirect to recruiter login if not recruiter
            return;
        }

        //  Set recruiter name from /me response
        document.getElementById("recruiterName").innerText = user.fullName;

        //  Load dashboard data after auth confirmed
        loadDashboard();
        loadJobCounts();
        setupLogout();

    } catch (error) {
        console.error("Auth error:", error);
        window.location.href = "/login.html";
    }
}

let currentPage = 0;
const pageSize = 5;

async function loadDashboard(page = 0) {
    try {
        const response = await fetchWithRefresh(
            `${API_BASE_URL}/jobs/my?page=${page}&size=${pageSize}`,
            {
                credentials: "include",  //  Send cookie
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        if (!response.ok) throw new Error("Failed to fetch jobs");

        const data = await response.json();
        const jobs = data.content;

        console.log(data)
        loadRecentJobs(jobs);
        generateChart(jobs);
        renderPagination(data.totalPages, data.number);
        currentPage = data.number;

    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}

function loadRecentJobs(jobs) {
    const tbody = document.getElementById("recentJobsBody");
    tbody.innerHTML = "";

    jobs.slice(0, 5).forEach(job => {
        tbody.innerHTML += `
            <tr>
                <td>${job.title}</td>
                <td>${job.categoryName}</td>
                <td>${job.location}</td>
                <td>
                    <span class="badge ${job.status === "OPEN" ? "bg-success" : "bg-secondary"}">
                        ${job.status}
                    </span>
                </td>
                <td>${new Date(job.createdAt).toLocaleDateString()}</td>
            </tr>
        `;
    });
}


let jobChartInstance;

function generateChart(jobs) {
    const ctx = document.getElementById("jobChart").getContext("2d");

    if (jobChartInstance) {
        jobChartInstance.destroy();
    }

    const labels = jobs.map(j => j.title);
    const data = jobs.map((_, index) => index + 1);

    jobChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Jobs Posted",
                data: data,
                backgroundColor: "#18a99c"
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}



async function downloadResume(candidateId) {
    try {
        const response = await fetchWithRefresh(
            `${API_BASE_URL}/profile/download/resume/${candidateId}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (response.status === 404) {
            alert("Resume not found for this candidate");
            return;
        }

        if (response.status === 403) {
            alert("You don't have permission to download this resume");
            return;
        }

        if (!response.ok) throw new Error("Download failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `resume_${candidateId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);

    } catch (err) {
        console.error("Download error:", err);
        alert("Failed to download resume");
    }
}

function setupLogout() {
    document.getElementById("logoutBtn").addEventListener("click", async () => {
        //  Call backend logout to clear cookie
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });
        window.location.href = "../../index.html";  //  Fixed path
    });
}