// ======================================================
// AHMED AI - ADMIN DASHBOARD
// ======================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    getCountFromServer,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ======================================================
// ELEMENTS
// ======================================================

const authLoading =
    document.getElementById("authLoading");

const adminApp =
    document.getElementById("adminApp");

const adminName =
    document.getElementById("adminName");

const adminEmail =
    document.getElementById("adminEmail");

const adminAvatar =
    document.getElementById("adminAvatar");

const pageTitle =
    document.getElementById("pageTitle");

const pageSubtitle =
    document.getElementById("pageSubtitle");

const logoutBtn =
    document.getElementById("logoutBtn");

const backToSiteBtn =
    document.getElementById("backToSiteBtn");

const usersTableBody =
    document.getElementById("usersTableBody");

const usersEmpty =
    document.getElementById("usersEmpty");

const userSearch =
    document.getElementById("userSearch");

const refreshUsersBtn =
    document.getElementById("refreshUsersBtn");


// ======================================================
// USER PROFILE ELEMENTS
// ======================================================

const userProfileModal =
    document.getElementById("userProfileModal");

const userProfileOverlay =
    document.getElementById("userProfileOverlay");

const closeUserProfileBtn =
    document.getElementById("closeUserProfileBtn");

const closeUserProfileBtnBottom =
    document.getElementById(
        "closeUserProfileBtnBottom"
    );

const profileAvatar =
    document.getElementById("profileAvatar");

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const profileRole =
    document.getElementById("profileRole");

const profileStatus =
    document.getElementById("profileStatus");

const profileDetailName =
    document.getElementById("profileDetailName");

const profileDetailEmail =
    document.getElementById("profileDetailEmail");

const profileDetailRole =
    document.getElementById("profileDetailRole");

const profileDetailStatus =
    document.getElementById("profileDetailStatus");

const profileDetailUid =
    document.getElementById("profileDetailUid");

const profileCreatedAt =
    document.getElementById("profileCreatedAt");

const profileChatCount =
    document.getElementById("profileChatCount");


// ======================================================
// GLOBAL DATA
// ======================================================

let allUsers = [];

let currentAdmin = null;


// ======================================================
// AUTH CHECK
// ======================================================

onAuthStateChanged(auth, async (user) => {

    // ------------------------------------------
    // NO USER
    // ------------------------------------------

    if (!user) {

        window.location.replace("login.html");

        return;
    }


    try {

        // ------------------------------------------
        // GET ADMIN DATA
        // ------------------------------------------

        const userRef =
            doc(db, "users", user.uid);

        const userSnapshot =
            await getDoc(userRef);


        // ------------------------------------------
        // USER DOCUMENT NOT FOUND
        // ------------------------------------------

        if (!userSnapshot.exists()) {

            alert(
                "لا توجد بيانات لهذا الحساب في النظام."
            );

            await signOut(auth);

            window.location.replace("login.html");

            return;
        }


        const userData =
            userSnapshot.data();


        // ------------------------------------------
        // CHECK ROLE
        // ------------------------------------------

        if (userData.role !== "admin") {

            alert(
                "ليس لديك صلاحية الدخول إلى لوحة التحكم."
            );

            window.location.replace("index.html");

            return;
        }


        // ------------------------------------------
        // SAVE ADMIN
        // ------------------------------------------

        currentAdmin = {
            ...userData,
            uid: user.uid
        };


        // ------------------------------------------
        // SHOW ADMIN DATA
        // ------------------------------------------

        adminName.textContent =
            userData.name || "Ahmed Samir";

        adminEmail.textContent =
            userData.email || user.email || "";

        adminAvatar.textContent =
            getInitial(
                userData.name || user.email || "A"
            );


        // ------------------------------------------
        // SHOW APP
        // ------------------------------------------

        authLoading.style.display = "none";

        adminApp.style.display = "flex";


        // ------------------------------------------
        // LOAD DASHBOARD
        // ------------------------------------------

        await loadStatistics();

        await loadUsers();


    } catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        alert(
            "حدث خطأ أثناء التحقق من صلاحيات الأدمن."
        );

        window.location.replace("login.html");
    }

});


// ======================================================
// GET INITIAL
// ======================================================

function getInitial(value) {

    if (!value) {
        return "A";
    }

    return value
        .trim()
        .charAt(0)
        .toUpperCase();
}


// ======================================================
// NAVIGATION
// ======================================================

const navItems =
    document.querySelectorAll(".admin-nav-item");

const sections =
    document.querySelectorAll(".admin-section");


navItems.forEach((button) => {

    button.addEventListener("click", () => {

        const sectionName =
            button.dataset.section;

        openSection(sectionName);

    });

});


// ======================================================
// OPEN SECTION
// ======================================================

function openSection(sectionName) {

    // ------------------------------------------
    // REMOVE ACTIVE FROM NAV
    // ------------------------------------------

    navItems.forEach((item) => {

        item.classList.remove("active");

    });


    // ------------------------------------------
    // ACTIVATE CURRENT NAV
    // ------------------------------------------

    const activeNav =
        document.querySelector(
            `.admin-nav-item[data-section="${sectionName}"]`
        );

    if (activeNav) {

        activeNav.classList.add("active");

    }


    // ------------------------------------------
    // HIDE ALL SECTIONS
    // ------------------------------------------

    sections.forEach((section) => {

        section.classList.remove("active");

    });


    // ------------------------------------------
    // SHOW CURRENT SECTION
    // ------------------------------------------

    const currentSection =
        document.getElementById(
            `section-${sectionName}`
        );

    if (currentSection) {

        currentSection.classList.add("active");

    }


    // ------------------------------------------
    // PAGE TITLE
    // ------------------------------------------

    const titles = {

        dashboard: [
            "لوحة التحكم",
            "إدارة منصة Ahmed AI"
        ],

        users: [
            "المستخدمين",
            "إدارة المستخدمين المسجلين"
        ],

        chats: [
            "المحادثات",
            "متابعة محادثات المستخدمين"
        ],

        content: [
            "المحتوى",
            "إدارة المحتوى التعليمي"
        ],

        tests: [
            "الاختبارات",
            "إدارة الاختبارات"
        ],

        statistics: [
            "الإحصائيات",
            "إحصائيات منصة Ahmed AI"
        ]

    };


    const selected =
        titles[sectionName] ||
        titles.dashboard;


    pageTitle.textContent =
        selected[0];

    pageSubtitle.textContent =
        selected[1];


    // ------------------------------------------
    // LOAD USERS WHEN OPENING USERS
    // ------------------------------------------

    if (sectionName === "users") {

        loadUsers();

    }


    // ------------------------------------------
    // LOAD STATISTICS
    // ------------------------------------------

    if (sectionName === "statistics") {

        loadStatistics();

    }

}


// ======================================================
// QUICK ACTIONS
// ======================================================

const quickActions =
    document.querySelectorAll(
        "[data-open-section]"
    );


quickActions.forEach((button) => {

    button.addEventListener("click", () => {

        const section =
            button.dataset.openSection;

        openSection(section);

    });

});


// ======================================================
// LOAD STATISTICS
// ======================================================

async function loadStatistics() {

    try {

        // ------------------------------------------
        // USERS
        // ------------------------------------------

        const usersSnapshot =
            await getCountFromServer(
                collection(db, "users")
            );

        const usersCount =
            usersSnapshot.data().count;


        // ------------------------------------------
        // CHATS
        // ------------------------------------------

        const chatsSnapshot =
            await getCountFromServer(
                collection(db, "chats")
            );

        const chatsCount =
            chatsSnapshot.data().count;


        // ------------------------------------------
        // CONTENT
        // ------------------------------------------

        const contentSnapshot =
            await getCountFromServer(
                collection(db, "content")
            );

        const contentCount =
            contentSnapshot.data().count;


        // ------------------------------------------
        // TESTS
        // ------------------------------------------

        const testsSnapshot =
            await getCountFromServer(
                collection(db, "tests")
            );

        const testsCount =
            testsSnapshot.data().count;


        // ------------------------------------------
        // UPDATE DASHBOARD
        // ------------------------------------------

        setText(
            "usersCount",
            usersCount
        );

        setText(
            "chatsCount",
            chatsCount
        );

        setText(
            "contentCount",
            contentCount
        );

        setText(
            "testsCount",
            testsCount
        );


        // ------------------------------------------
        // UPDATE STATISTICS PAGE
        // ------------------------------------------

        setText(
            "statisticsUsers",
            usersCount
        );

        setText(
            "statisticsChats",
            chatsCount
        );

        setText(
            "statisticsContent",
            contentCount
        );

        setText(
            "statisticsTests",
            testsCount
        );


    } catch (error) {

        console.error(
            "Statistics error:",
            error
        );


        // ------------------------------------------
        // FALLBACK
        // ------------------------------------------

        setText(
            "usersCount",
            "—"
        );

        setText(
            "chatsCount",
            "—"
        );

        setText(
            "contentCount",
            "—"
        );

        setText(
            "testsCount",
            "—"
        );


        setText(
            "statisticsUsers",
            "—"
        );

        setText(
            "statisticsChats",
            "—"
        );

        setText(
            "statisticsContent",
            "—"
        );

        setText(
            "statisticsTests",
            "—"
        );

    }

}


// ======================================================
// SET TEXT
// ======================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}


// ======================================================
// LOAD USERS
// ======================================================

async function loadUsers() {

    if (!usersTableBody) {
        return;
    }


    // ------------------------------------------
    // LOADING
    // ------------------------------------------

    usersTableBody.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="table-loading"
            >

                جاري تحميل المستخدمين...

            </td>

        </tr>

    `;


    usersEmpty.style.display = "none";


    try {

        // ------------------------------------------
        // GET USERS
        // ------------------------------------------

        const usersSnapshot =
            await getDocs(
                collection(db, "users")
            );


        allUsers = [];


        usersSnapshot.forEach((documentSnapshot) => {

            const data =
                documentSnapshot.data();


            allUsers.push({

                id:
                    documentSnapshot.id,

                ...data

            });

        });


        // ------------------------------------------
        // SORT USERS
        // ------------------------------------------

        allUsers.sort((a, b) => {

            const nameA =
                String(
                    a.name || a.email || ""
                ).toLowerCase();

            const nameB =
                String(
                    b.name || b.email || ""
                ).toLowerCase();

            return nameA.localeCompare(nameB);

        });


        // ------------------------------------------
        // DISPLAY
        // ------------------------------------------

        renderUsers(allUsers);


    } catch (error) {

        console.error(
            "Load users error:",
            error
        );


        usersTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="table-error"
                >

                    حدث خطأ أثناء تحميل المستخدمين.

                    <br>

                    تأكد من نشر Firestore Rules الجديدة.

                </td>

            </tr>

        `;

    }

}


// ======================================================
// RENDER USERS
// ======================================================

function renderUsers(users) {

    usersTableBody.innerHTML = "";


    // ------------------------------------------
    // EMPTY
    // ------------------------------------------

    if (!users.length) {

        usersEmpty.style.display =
            "block";

        return;
    }


    usersEmpty.style.display =
        "none";


    // ------------------------------------------
    // USERS
    // ------------------------------------------

    users.forEach((user, index) => {

        const row =
            document.createElement("tr");


        // ------------------------------------------
        // NAME
        // ------------------------------------------

        const name =
            user.name ||
            "بدون اسم";


        // ------------------------------------------
        // EMAIL
        // ------------------------------------------

        const email =
            user.email ||
            "—";


        // ------------------------------------------
        // ROLE
        // ------------------------------------------

        const role =
            user.role ||
            "user";


        // ------------------------------------------
        // UID
        // ------------------------------------------

        const uid =
            user.id ||
            "—";


        // ------------------------------------------
        // STATUS
        // ------------------------------------------

        const status =
            user.disabled === true
                ? "معطل"
                : "نشط";


        const statusClass =
            user.disabled === true
                ? "status-disabled"
                : "status-active";


        // ------------------------------------------
        // ROLE LABEL
        // ------------------------------------------

        const roleLabel =
            role === "admin"
                ? "👑 Admin"
                : "👤 User";


        // ------------------------------------------
        // CREATE CELLS
        // ------------------------------------------

        row.innerHTML = `

            <td>
                ${index + 1}
            </td>


            <td>

                <div class="user-cell">

                    <div class="user-table-avatar">

                        ${escapeHTML(
                            getInitial(name)
                        )}

                    </div>

                    <div>

                        <strong class="user-name">

                            ${escapeHTML(name)}

                        </strong>

                    </div>

                </div>

            </td>


            <td>

                <span class="user-email">

                    ${escapeHTML(email)}

                </span>

            </td>


            <td>

                <span
                    class="role-badge ${
                        role === "admin"
                            ? "admin"
                            : "user"
                    }"
                >

                    ${roleLabel}

                </span>

            </td>


            <td>

                <code class="uid-code">

                    ${escapeHTML(uid)}

                </code>

            </td>


            <td>

                <span
                    class="status-badge ${statusClass}"
                >

                    ${status}

                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="view-profile-btn"
                    data-user-id="${escapeHTML(uid)}"
                >

                    👤 الملف الشخصي

                </button>

            </td>

        `;


        usersTableBody.appendChild(row);

    });


    // ------------------------------------------
    // PROFILE BUTTONS
    // ------------------------------------------

    const profileButtons =
        usersTableBody.querySelectorAll(
            ".view-profile-btn"
        );


    profileButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const userId =
                    button.dataset.userId;

                const selectedUser =
                    allUsers.find(
                        (user) =>
                            user.id === userId
                    );


                if (!selectedUser) {

                    alert(
                        "لم يتم العثور على بيانات المستخدم."
                    );

                    return;
                }


                openUserProfile(
                    selectedUser
                );

            }
        );

    });

}


// ======================================================
// OPEN USER PROFILE
// ======================================================

async function openUserProfile(user) {

    if (!userProfileModal) {
        return;
    }


    // ------------------------------------------
    // BASIC DATA
    // ------------------------------------------

    const name =
        user.name ||
        "بدون اسم";


    const email =
        user.email ||
        "—";


    const role =
        user.role ||
        "user";


    const uid =
        user.id ||
        "—";


    const disabled =
        user.disabled === true;


    const status =
        disabled
            ? "معطل"
            : "نشط";


    // ------------------------------------------
    // AVATAR
    // ------------------------------------------

    profileAvatar.textContent =
        getInitial(
            name !== "بدون اسم"
                ? name
                : email
        );


    // ------------------------------------------
    // MAIN PROFILE
    // ------------------------------------------

    profileName.textContent =
        name;

    profileEmail.textContent =
        email;


    // ------------------------------------------
    // ROLE
    // ------------------------------------------

    if (role === "admin") {

        profileRole.textContent =
            "👑 Admin";

        profileRole.className =
            "profile-role-badge profile-role-admin";

    } else {

        profileRole.textContent =
            "👤 User";

        profileRole.className =
            "profile-role-badge profile-role-user";

    }


    // ------------------------------------------
    // STATUS
    // ------------------------------------------

    profileStatus.textContent =
        status;


    if (disabled) {

        profileStatus.className =
            "profile-status-badge profile-status-disabled";

    } else {

        profileStatus.className =
            "profile-status-badge profile-status-active";

    }


    // ------------------------------------------
    // DETAILS
    // ------------------------------------------

    profileDetailName.textContent =
        name;

    profileDetailEmail.textContent =
        email;

    profileDetailRole.textContent =
        role === "admin"
            ? "Administrator"
            : "User";

    profileDetailStatus.textContent =
        status;

    profileDetailUid.textContent =
        uid;


    // ------------------------------------------
    // CREATED AT
    // ------------------------------------------

    profileCreatedAt.textContent =
        formatCreatedAt(
            user.createdAt
        );


    // ------------------------------------------
    // CHAT COUNT
    // ------------------------------------------

    profileChatCount.textContent =
        "جاري الحساب...";


    // ------------------------------------------
    // SHOW MODAL
    // ------------------------------------------

    userProfileModal.style.display =
        "flex";


    document.body.classList.add(
        "profile-modal-open"
    );


    // ------------------------------------------
    // GET USER CHAT COUNT
    // ------------------------------------------

    try {

        const chatsQuery =
            query(
                collection(db, "chats"),
                where(
                    "uid",
                    "==",
                    uid
                )
            );


        const chatsSnapshot =
            await getCountFromServer(
                chatsQuery
            );


        const count =
            chatsSnapshot.data().count;


        profileChatCount.textContent =
            count;

    } catch (error) {

        console.error(
            "User chat count error:",
            error
        );


        profileChatCount.textContent =
            "غير متاح";

    }

}


// ======================================================
// FORMAT CREATED AT
// ======================================================

function formatCreatedAt(value) {

    if (!value) {

        return "غير متوفر";

    }


    try {

        // ------------------------------------------
        // FIREBASE TIMESTAMP
        // ------------------------------------------

        if (
            typeof value === "object" &&
            typeof value.toDate === "function"
        ) {

            return value
                .toDate()
                .toLocaleString(
                    "ar-EG",
                    {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        }


        // ------------------------------------------
        // STRING / DATE
        // ------------------------------------------

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);

        }


        return date.toLocaleString(
            "ar-EG",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch (error) {

        return "غير متوفر";

    }

}


// ======================================================
// CLOSE USER PROFILE
// ======================================================

function closeUserProfile() {

    if (!userProfileModal) {
        return;
    }


    userProfileModal.style.display =
        "none";


    document.body.classList.remove(
        "profile-modal-open"
    );

}


if (closeUserProfileBtn) {

    closeUserProfileBtn.addEventListener(
        "click",
        closeUserProfile
    );

}


if (closeUserProfileBtnBottom) {

    closeUserProfileBtnBottom.addEventListener(
        "click",
        closeUserProfile
    );

}


if (userProfileOverlay) {

    userProfileOverlay.addEventListener(
        "click",
        closeUserProfile
    );

}


// ======================================================
// ESCAPE KEY - CLOSE PROFILE
// ======================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            userProfileModal &&
            userProfileModal.style.display === "flex"
        ) {

            closeUserProfile();

        }

    }
);


// ======================================================
// SEARCH USERS
// ======================================================

if (userSearch) {

    userSearch.addEventListener(
        "input",
        () => {

            const search =
                userSearch.value
                    .trim()
                    .toLowerCase();


            if (!search) {

                renderUsers(allUsers);

                return;
            }


            const filtered =
                allUsers.filter((user) => {

                    const name =
                        String(
                            user.name || ""
                        ).toLowerCase();


                    const email =
                        String(
                            user.email || ""
                        ).toLowerCase();


                    const uid =
                        String(
                            user.id || ""
                        ).toLowerCase();


                    return (
                        name.includes(search) ||
                        email.includes(search) ||
                        uid.includes(search)
                    );

                });


            renderUsers(filtered);

        }
    );

}


// ======================================================
// REFRESH USERS
// ======================================================

if (refreshUsersBtn) {

    refreshUsersBtn.addEventListener(
        "click",
        async () => {

            refreshUsersBtn.disabled = true;

            refreshUsersBtn.textContent =
                "⏳ جاري التحديث...";


            await loadUsers();


            refreshUsersBtn.disabled = false;

            refreshUsersBtn.textContent =
                "🔄 تحديث";

        }
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ======================================================
// BACK TO MAIN SITE
// ======================================================

if (backToSiteBtn) {

    backToSiteBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "index.html";

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "هل تريد تسجيل الخروج من لوحة التحكم؟"
                );


            if (!confirmed) {
                return;
            }


            try {

                await signOut(auth);

                window.location.replace(
                    "login.html"
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "حدث خطأ أثناء تسجيل الخروج."
                );

            }

        }
    );

                                      }
