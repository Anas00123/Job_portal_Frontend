
//  No localStorage token

document.addEventListener("DOMContentLoaded", () => {
    verifyAuth();
});

//  Verify auth first
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
            window.location.href = "/login.html";
            return;
        }

        const user = await response.json();

        if (user.role !== "RECRUITER") {
            window.location.href = "/login.html";
            return;
        }

        //  Auth confirmed — setup form
        setupForm();

    } catch (error) {
        console.error("Auth error:", error);
        window.location.href = "/login.html";
    }
}

function setupForm() {
    document.getElementById("postJobForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const submitBtn = document.getElementById("submitBtn");
        const messageBox = document.getElementById("jobMessage");

        const description = quill.root.innerHTML; //  read here, not at page load

        // validate not empty
        if (quill.getText().trim().length === 0) {
            alert("Please enter a job description");
            return;
        }


        submitBtn.disabled = true;
        submitBtn.innerHTML = "Publishing...";

        const jobData = {
            title: document.getElementById("title").value.trim(),
            description: description,
            location: document.getElementById("location").value.trim(),
            salary: parseFloat(document.getElementById("salary").value),
            categoryId: parseInt(document.getElementById("categoryId").value)
        };

        try {
            const response = await fetch(`${API_BASE_URL}/jobs`, {
                method: "POST",
                credentials: "include",   //  Send cookie
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(jobData)
            });

            if (!response.ok) throw new Error("Failed to post job");

            const result = await response.json();

            messageBox.innerHTML = `
                <div class="alert alert-success">
                     Job Posted Successfully! <br>
                    <strong>${result.title}</strong> is now ${result.status}
                </div>
            `;

            document.getElementById("postJobForm").reset();

        } catch (error) {
            messageBox.innerHTML = `
                <div class="alert alert-danger">
                    ❌ Error posting job. Please try again.
                </div>
            `;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="bi bi-check-circle me-1"></i> Publish Job`;
        }
    });
}



let debounceTimer;

document.getElementById("categoryInput").addEventListener("input", function () {
    clearTimeout(debounceTimer);
    const keyword = this.value.trim();

    if (keyword.length < 2) {
        document.getElementById("categoryDropdown").innerHTML = "";
        return;
    }

    // debounce — wait 300ms before hitting API
    debounceTimer = setTimeout(async () => {
        const response = await fetch(
            `${API_BASE_URL}/job-categories/search?keyword=${keyword}`,
            { credentials: "include" }
        );
        const categories = await response.json();

        console.log("Categories:", categories);
        const dropdown = document.getElementById("categoryDropdown");
        dropdown.innerHTML = categories.map(cat => `
            <li class="list-group-item list-group-item-action"
                onclick="selectCategory(${cat.categoryId}, '${cat.categoryName}')">
                ${cat.categoryName}
            </li>
        `).join("");
    }, 300);
});

function selectCategory(id, name) {
    document.getElementById("categoryInput").value = name;
    document.getElementById("categoryId").value = id;
    document.getElementById("categoryDropdown").innerHTML = "";
}