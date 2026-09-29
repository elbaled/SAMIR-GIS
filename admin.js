// ==========================================
// Ahmed AI - Admin Dashboard
// ==========================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getCountFromServer
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ==========================================
// عناصر الصفحة
// ==========================================

const usersCount = document.getElementById("usersCount");
const chatsCount = document.getElementById("chatsCount");
const contentCount = document.getElementById("contentCount");
const testsCount = document.getElementById("testsCount");

const logoutBtn = document.getElementById("logoutBtn");


// ==========================================
// التحقق من تسجيل الدخول وصلاحية Admin
// ==========================================

onAuthStateChanged(auth, async (user) => {

    // لو مفيش مستخدم مسجل دخول
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    try {

        // جلب بيانات المستخدم من Firestore
        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const userSnap = await getDoc(userRef);


        // لو بيانات المستخدم غير موجودة
        if (!userSnap.exists()) {

            alert("ليس لديك صلاحية دخول لوحة التحكم.");

            await signOut(auth);

            window.location.href = "login.html";

            return;
        }


        // بيانات المستخدم
        const userData = userSnap.data();


        // التحقق من role
        if (userData.role !== "admin") {

            alert("هذه الصفحة مخصصة للأدمن فقط.");

            window.location.href = "index.html";

            return;
        }


        // ======================================
        // تم التحقق من الأدمن
        // ======================================

        console.log("Ahmed AI Admin authenticated 👑");


        // تحميل الإحصائيات
        await loadStatistics();


    } catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        alert(
            "حدث خطأ أثناء التحقق من صلاحيات الأدمن."
        );

        window.location.href = "index.html";
    }

});


// ==========================================
// تحميل الإحصائيات
// ==========================================

async function loadStatistics() {

    try {

        // عدد المستخدمين
        const usersSnapshot =
            await getCountFromServer(
                collection(db, "users")
            );

        usersCount.textContent =
            usersSnapshot.data().count;


        // عدد المحادثات
        const chatsSnapshot =
            await getCountFromServer(
                collection(db, "chats")
            );

        chatsCount.textContent =
            chatsSnapshot.data().count;


        // عدد المحتوى
        const contentSnapshot =
            await getCountFromServer(
                collection(db, "content")
            );

        contentCount.textContent =
            contentSnapshot.data().count;


        // عدد الاختبارات
        const testsSnapshot =
            await getCountFromServer(
                collection(db, "tests")
            );

        testsCount.textContent =
            testsSnapshot.data().count;


    } catch (error) {

        console.warn(
            "Statistics are not available yet:",
            error
        );

        // لو الـCollections لسه مش موجودة
        usersCount.textContent = "—";
        chatsCount.textContent = "—";
        contentCount.textContent = "—";
        testsCount.textContent = "—";
    }
}


// ==========================================
// تسجيل الخروج
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "index.html";

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
