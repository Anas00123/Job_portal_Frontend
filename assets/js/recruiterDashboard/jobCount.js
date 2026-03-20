
async function loadJobCounts() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs/my/jobs/count`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch job counts");

        const data = await response.json();

        document.getElementById("totalJobsCount").innerText = data.totalJobs || 0;
        document.getElementById("activeJobsCount").innerText = data.activeJobs || 0;
        document.getElementById("closedJobsCount").innerText = data.closeJobs || 0;

    } catch (error) {
        console.error("Job count error:", error);
    }
}