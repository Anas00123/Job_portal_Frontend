// ── Shared Admin Sidebar ──
// Include this after config.js on every admin page
// Usage: renderAdminSidebar('dashboard' | 'employers' | 'candidates' | 'applications' | 'subadmins' | 'companies' | 'categories')

function renderAdminSidebar(activePage) {
    const ROLE = localStorage.getItem("role") || "ADMIN";
    const IS_SUB_ADMIN = ROLE === "SUB_ADMIN";
    const FULL_NAME = localStorage.getItem("fullName") || (IS_SUB_ADMIN ? "Sub Admin" : "Admin");
    const initials = FULL_NAME.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

    const menuItems = [
        { key: "dashboard",     href: "dashboard.html",        icon: "bi-speedometer2",        label: "Dashboard" },
        { key: "employers",     href: "manageEmployers.html",   icon: "bi-building",            label: "Employers" },
        { key: "candidates",    href: "candidates.html",        icon: "bi-people",              label: "Candidates" },
        { key: "applications",  href: "applications.html",      icon: "bi-file-earmark-text",   label: "Applications" },
        { key: "companies",     href: "companies.html",         icon: "bi-building-fill",       label: "Companies" },
        { key: "categories",    href: "jobCategories.html",     icon: "bi-tags",                label: "Job Categories" },
        
    ];

    const subAdminItem = { key: "subadmins", href: "subAdmins.html", icon: "bi-shield-lock", label: "Sub Admins" };

    let menuHTML = menuItems.map(item => `
        <a href="${item.href}" class="sidebar-item ${activePage === item.key ? 'active' : ''}">
            <i class="bi ${item.icon}"></i> ${item.label}
        </a>`).join("");

    // Sub Admin section - locked for sub-admins
    menuHTML += `<div class="sidebar-divider"></div>
        <div class="sidebar-section-label">Admin Only</div>`;

    if (IS_SUB_ADMIN) {
        menuHTML += `<span class="sidebar-item locked" title="Restricted to Admins only">
            <i class="bi bi-shield-lock"></i> Sub Admins
            <i class="bi bi-lock-fill ms-auto" style="font-size:11px;"></i>
        </span>`;
    } else {
        menuHTML += `<a href="subAdmins.html" class="sidebar-item ${activePage === 'subadmins' ? 'active' : ''}">
            <i class="bi bi-shield-lock"></i> Sub Admins
        </a>`;
    }

    menuHTML += `<div class="sidebar-divider"></div>
        <button class="sidebar-item" onclick="openProfileModal()">
            <i class="bi bi-person-circle"></i> My Profile
        </button>
        <button class="sidebar-item" onclick="logout()" style="color:#f87171;">
            <i class="bi bi-box-arrow-right" style="color:#f87171;"></i> Logout
        </button>`;

    const sidebarHTML = `
        <div class="sidebar-brand">
            <h5>Jobs<span>Hunt</span></h5>
            <div class="role-badge ${IS_SUB_ADMIN ? 'subadmin' : 'admin'}">${IS_SUB_ADMIN ? 'SUB ADMIN' : 'ADMIN'}</div>
        </div>
        <div class="sidebar-nav">${menuHTML}</div>
        <div class="sidebar-footer">
            <div class="admin-info">
                <div class="admin-avatar">${initials}</div>
                <div class="admin-info-text">
                    <div class="admin-info-name">${FULL_NAME}</div>
                    <div class="admin-info-role">${IS_SUB_ADMIN ? 'Sub Administrator' : 'Administrator'}</div>
                </div>
            </div>
        </div>`;

    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.innerHTML = sidebarHTML;

    // Topbar name
    const nameEl = document.getElementById("adminNameTop");
    if (nameEl) nameEl.innerText = FULL_NAME;

    // Sub admin notice
    const notice = document.getElementById("subAdminNotice");
    if (notice) notice.style.display = IS_SUB_ADMIN ? "block" : "none";

    // Mobile brand
    const mobileBrand = document.getElementById("mobileBrand");
    if (mobileBrand) mobileBrand.innerHTML = `Jobs<span style="color:#14b8a6;">Hunt</span>`;
}

// ── Shared sidebar CSS injected once ──
const sidebarCSS = `
<style id="shared-sidebar-css">
:root { --navy:#0b2239; --teal:#0d9488; --sidebar-w:240px; }
.sidebar { width:var(--sidebar-w); background:var(--navy); position:fixed; top:0; left:0; height:100vh; z-index:200; overflow-y:auto; display:flex; flex-direction:column; transition:left .3s; }
.sidebar-brand { padding:20px 20px 14px; border-bottom:1px solid rgba(255,255,255,0.08); }
.sidebar-brand h5 { color:white; font-weight:700; font-size:18px; margin:0; }
.sidebar-brand h5 span { color:#14b8a6; }
.role-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700; letter-spacing:0.5px; margin-top:6px; }
.role-badge.admin { background:#1d4ed8; color:white; }
.role-badge.subadmin { background:#d97706; color:white; }
.sidebar-nav { padding:12px 0; flex:1; }
.sidebar-item { display:flex; align-items:center; gap:10px; padding:11px 20px; color:rgba(255,255,255,0.6); text-decoration:none; font-size:13.5px; transition:all .2s; cursor:pointer; border:none; background:none; width:100%; text-align:left; }
.sidebar-item:hover { background:rgba(255,255,255,0.07); color:white; }
.sidebar-item.active { background:rgba(13,148,136,0.2); color:#14b8a6; border-left:3px solid #14b8a6; }
.sidebar-item.locked { opacity:0.4; cursor:not-allowed; pointer-events:none; }
.sidebar-item i { font-size:16px; width:18px; }
.sidebar-divider { height:1px; background:rgba(255,255,255,0.06); margin:8px 0; }
.sidebar-section-label { padding:8px 20px 4px; font-size:10px; font-weight:700; color:rgba(255,255,255,0.3); letter-spacing:1px; text-transform:uppercase; }
.sidebar-footer { padding:14px 20px; border-top:1px solid rgba(255,255,255,0.08); }
.admin-info { display:flex; align-items:center; gap:10px; }
.admin-avatar { width:36px; height:36px; border-radius:50%; background:var(--teal); color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; flex-shrink:0; }
.admin-info-text { flex:1; min-width:0; }
.admin-info-name { color:white; font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.admin-info-role { color:rgba(255,255,255,0.4); font-size:11px; }
.main-content { margin-left:var(--sidebar-w); min-height:100vh; }
.topbar { background:white; border-bottom:1px solid #e5e7eb; padding:14px 28px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
.topbar-left h4 { font-size:18px; font-weight:700; color:#0f172a; margin:0; }
.topbar-left small { color:#64748b; font-size:12px; }
.topbar-right { display:flex; align-items:center; gap:12px; }
.topbar-btn { background:none; border:1px solid #e5e7eb; border-radius:8px; padding:7px 14px; font-size:13px; color:#374151; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .2s; }
.topbar-btn:hover { background:#f8fafc; border-color:var(--navy); }
.content { padding:24px 28px; }
.mobile-topbar { display:none; background:var(--navy); padding:12px 16px; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:200; }
.mobile-menu-btn { background:none; border:none; color:white; font-size:24px; cursor:pointer; }
.mobile-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:150; }
.mobile-overlay.show { display:block; }
.spinner-overlay { display:none; position:fixed; inset:0; background:rgba(255,255,255,0.7); z-index:9999; justify-content:center; align-items:center; }
.spinner-overlay.show { display:flex; }
.stat-card { background:white; border-radius:14px; padding:20px; border:1px solid #e5e7eb; transition:all .2s; }
.stat-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.08); }
.stat-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
.stat-icon { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; }
.stat-value { font-size:30px; font-weight:700; color:#0f172a; line-height:1; }
.stat-label { font-size:12.5px; color:#64748b; margin-bottom:4px; }
.stat-sub { font-size:12px; margin-top:6px; }
.table-card { background:white; border-radius:14px; border:1px solid #e5e7eb; overflow:hidden; }
.table-card-header { padding:16px 20px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; }
.table-card-title { font-size:14px; font-weight:600; color:#0f172a; }
.chart-card { background:white; border-radius:14px; border:1px solid #e5e7eb; padding:20px; }
@media(max-width:768px) {
  .sidebar { left:-260px; }
  .sidebar.open { left:0; }
  .main-content { margin-left:0; }
  .mobile-topbar { display:flex; }
  .topbar { display:none; }
  .content { padding:16px; }
}
</style>`;

// Inject CSS if not already present
if (!document.getElementById("shared-sidebar-css")) {
    document.head.insertAdjacentHTML("beforeend", sidebarCSS);
}

// ── Shared Mobile sidebar functions ──
function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("mobileOverlay").classList.add("show");
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("mobileOverlay").classList.remove("show");
}

function logout() { adminLogout(); }

// ── Shared Profile Modal Functions ──
async function openProfileModal() {
    const modal = document.getElementById("profileModal");
    if (!modal) return;

    ["editProfileSuccess","editProfileError","changePwSuccess","changePwError"]
        .forEach(id => { const el = document.getElementById(id); if (el) el.classList.add("d-none"); });
    ["p_currentPw","p_newPw","p_confirmPw"]
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });

    switchProfileTab("editProfile", modal.querySelector("#profileTabs .nav-link"));
    new bootstrap.Modal(modal).show();

    try {
        const res = await fetchWithRefresh(`${API_BASE_URL}/auth/me`);
        const data = await res.json();
        const name = data.fullName || data.username || "Admin";
        const initials = name.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase();
        document.getElementById("profileDisplayName").innerText = name;
        document.getElementById("profileDisplayEmail").innerText = data.username || "";
        document.getElementById("profileDisplayRole").innerText = data.role || "ADMIN";
        const av = document.getElementById("profileAvatarModal");
        if (av) av.innerText = initials;
        document.getElementById("p_fullname").value = data.fullName || "";
        document.getElementById("p_username").value = data.username || "";
        document.getElementById("p_email").value = data.username || "";
        document.getElementById("p_phone").value = data.phone || "";
        localStorage.setItem("fullName", name);
    } catch(e) { console.error(e); }
}

function switchProfileTab(name, link) {
    ["tab_editProfile","tab_changePassword"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    const tab = document.getElementById("tab_" + name);
    if (tab) tab.style.display = "block";
    document.querySelectorAll("#profileTabs .nav-link").forEach(l => l.classList.remove("active"));
    if (link) link.classList.add("active");
}

async function saveProfile() {
    const fullname = document.getElementById("p_fullname").value.trim();
    const username = document.getElementById("p_username").value.trim();
    const phone = document.getElementById("p_phone").value.trim();
    const successEl = document.getElementById("editProfileSuccess");
    const errorEl = document.getElementById("editProfileError");
    successEl.classList.add("d-none");
    errorEl.classList.add("d-none");
    document.getElementById("saveProfileText").innerText = "Saving...";
    document.getElementById("saveProfileSpinner").classList.remove("d-none");
    try {
        const res = await fetchWithRefresh(`${API_BASE_URL}/auth/update-profile`, {
            method: "PUT",
            body: JSON.stringify({ fullname, username, phone: phone ? Number(phone) : null })
        });
        if (!res.ok) throw new Error("Failed");
        successEl.classList.remove("d-none");
        const displayName = fullname || username;
        document.getElementById("profileDisplayName").innerText = displayName;
        const nameTop = document.getElementById("adminNameTop");
        if (nameTop) nameTop.innerText = displayName;
        localStorage.setItem("fullName", displayName);
        renderAdminSidebar(window._activePage || "dashboard");
    } catch(e) {
        errorEl.innerText = e.message || "Failed to update.";
        errorEl.classList.remove("d-none");
    } finally {
        document.getElementById("saveProfileText").innerText = "Save Changes";
        document.getElementById("saveProfileSpinner").classList.add("d-none");
    }
}

async function changePassword() {
    const currentPw = document.getElementById("p_currentPw").value.trim();
    const newPw = document.getElementById("p_newPw").value.trim();
    const confirmPw = document.getElementById("p_confirmPw").value.trim();
    const successEl = document.getElementById("changePwSuccess");
    const errorEl = document.getElementById("changePwError");
    successEl.classList.add("d-none");
    errorEl.classList.add("d-none");
    if (!currentPw || !newPw || !confirmPw) { errorEl.innerText = "Please fill all fields."; errorEl.classList.remove("d-none"); return; }
    if (newPw !== confirmPw) { errorEl.innerText = "Passwords do not match."; errorEl.classList.remove("d-none"); return; }
    if (newPw.length < 6) { errorEl.innerText = "Min 6 characters."; errorEl.classList.remove("d-none"); return; }
    document.getElementById("changePwText").innerText = "Changing...";
    document.getElementById("changePwSpinner").classList.remove("d-none");
    try {
        const res = await fetchWithRefresh(`${API_BASE_URL}/auth/change-password`, {
            method: "POST",
            body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Failed"); }
        successEl.classList.remove("d-none");
        ["p_currentPw","p_newPw","p_confirmPw"].forEach(id => document.getElementById(id).value = "");
    } catch(e) {
        errorEl.innerText = e.message || "Failed.";
        errorEl.classList.remove("d-none");
    } finally {
        document.getElementById("changePwText").innerText = "Change Password";
        document.getElementById("changePwSpinner").classList.add("d-none");
    }
}

function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    input.type = input.type === "password" ? "text" : "password";
    btn.innerHTML = input.type === "password" ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
}