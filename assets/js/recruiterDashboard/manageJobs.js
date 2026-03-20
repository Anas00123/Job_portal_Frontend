
//  No localStorage token — cookies sent automatically

document.addEventListener("DOMContentLoaded", () => {
    verifyAuth();
});

//  Verify auth via /me endpoint first
async function verifyAuth() {
    try {
        const response = await fetchWithRefresh(`${API_BASE_URL}/auth/me`, {
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

        //  Auth confirmed — load data
        loadJobs(0);

    } catch (error) {
        console.error("Auth error:", error);
        window.location.href = "/recruiterLoginForm.html";
    }
}

let currentPage = 0;
const pageSize = 5;

async function loadJobs(page = 0) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/jobs/my?page=${page}&size=${pageSize}`,
            {
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            }
        );

        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();

        currentPage = page;              //  update FIRST
        loadJobCounts();
        renderTable(data.content);
        renderPagination(data.totalPages, page);

    } catch (error) {
        console.error("Pagination error:", error);
    }
}

let totalPages = 0;

function renderPagination(total, page) {
    totalPages = total;
}

function nextPage() {
    if (currentPage < totalPages - 1) {
        loadJobs(currentPage + 1);
    }
}

function prevPage() {
    if (currentPage > 0) {
        loadJobs(currentPage - 1);
    }
}



function renderTable(jobs) {
    const tbody = document.getElementById("jobsTableBody");
    
    let sno = (currentPage * pageSize) + 1;
    
    if (jobs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No jobs found</td>
            </tr>`;
        return;
    }

    tbody.innerHTML = jobs.map(job => `
        <tr>
            <td>${sno++}</td>
            <td>${job.title}</td>
            <td>${job.location}</td>
            <td>
                <span class="badge ${job.status === "OPEN" ? "bg-success" : "bg-secondary"}">
                    ${job.status}
                </span>
            </td>
            <td>
                ${job.status === "OPEN"
                    ? `<button class="btn btn-sm btn-outline-danger me-1"
                            onclick="closeJob(${job.jobId})">Close</button>`
                    : `<button class="btn btn-sm btn-outline-success me-1"
                            onclick="reopenJob(${job.jobId})">Reopen</button>`
                }
                <button class="btn btn-sm btn-outline-primary"
                        onclick="editJob(${job.jobId})">Edit</button>
            </td>
        </tr>
    `).join("");
}

async function closeJob(id) {
    if (!confirm("Are you sure you want to close this job?")) return;

    const response = await fetchWithRefresh(`${API_BASE_URL}/jobs/${id}/close`, {
        method: "PUT",
        credentials: "include"  //  Send cookie
    });

    if (!response.ok) {
        alert("Failed to close job");
        return;
    }

    loadJobs(currentPage);
}

async function reopenJob(id) {
    const response = await fetchWithRefresh(`${API_BASE_URL}/jobs/${id}/reopen`, {
        method: "PUT",
        credentials: "include"   //  Send cookie
    });

    if (!response.ok) {
        alert("Failed to reopen job");
        return;
    }

    loadJobs(currentPage);
}

async function editJob(id) {
    try {
        const response = await fetchWithRefresh(`${API_BASE_URL}/jobs/${id}`, {
            credentials: "include"   // Send cookie
        });

        if (!response.ok) throw new Error("Failed to fetch job");

        const job = await response.json();

        console.log("Editing job:", job);
        document.getElementById("editJobId").value = job.jobId;
        document.getElementById("editTitle").value = job.title;
        document.getElementById("editLocation").value = job.location;
        // document.getElementById("editDescription").value = job.description;
        quill.root.innerHTML = job.description;
        // document.getElementById("editStatus").value = job.status;


        const modal = new bootstrap.Modal(document.getElementById("editJobModal"));
        modal.show();

    } catch (error) {
        console.error("Edit error:", error);
    }
}

async function updateJob() {
    const id = document.getElementById("editJobId").value;

     const description = quill.root.innerHTML;

    const updatedJob = {
        title: document.getElementById("editTitle").value,
        location: document.getElementById("editLocation").value,
        description: description,
        // status: document.getElementById("editStatus").value
    };

    try {
        console.log(updatedJob);
        const response = await fetchWithRefresh(`${API_BASE_URL}/jobs/${id}`, {
            method: "PUT",
            credentials: "include",   //  Send cookie
            
            body: JSON.stringify(updatedJob)
        });

        if (!response.ok) 
            {
                const errorData = await response.json();
                console.error("Update failed:", errorData);
                alert(`Failed to update job: ${errorData.message || response.statusText}`);
                return;
            }

        bootstrap.Modal.getInstance(
            document.getElementById("editJobModal")
        ).hide();

        loadJobs(currentPage);

    } catch (error) {
        console.error("Update error:", error);
        alert("Failed to update job");
    }
}