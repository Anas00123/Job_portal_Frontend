document.addEventListener("DOMContentLoaded", function () {

    const container = document.getElementById("recruiter-sidebar");

    fetch("/components/recruiter-sidebar.html")
        .then(res => res.text())
        .then(data => {
            container.innerHTML = data;

            activateSidebar();
        });

});

function activateSidebar() {

    const currentPath = window.location.pathname;

    document.querySelectorAll(".sidebar-link").forEach(link => {

        if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
        }

    });

}