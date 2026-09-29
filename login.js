// ==========================================
// Ahmed AI - Login System
// ==========================================

import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ==========================================
// Elements
// ==========================================

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginBtn =
    document.getElementById("loginBtn");

const loginBtnText =
    document.getElementById("loginBtnText");

const loginLoader =
    document.getElementById("loginLoader");

const loginMessage =
    document.getElementById("loginMessage");

const togglePassword =
    document.getElementById("togglePassword");


// ==========================================
// Show Message
// ==========================================

function showMessage(message, type = "error") {

    loginMessage.textContent = message;

    loginMessage.className =
        "login-message " + type;

}


// ==========================================
// Loading
// ==========================================

function setLoading(isLoading) {

    if (isLoading) {

        loginBtn.disabled = true;

        loginBtn.classList.add("loading");

    } else {

        loginBtn.disabled = false;

        loginBtn.classList.remove("loading");

    }

}


// ==========================================
// Password Visibility
// ==========================================

togglePassword.addEventListener(
    "click",
    () => {

        if (
            passwordInput.type ===
            "password"
        ) {

            passwordInput.type =
                "text";

            togglePassword.textContent =
                "🙈";

            togglePassword.setAttribute(
                "aria-label",
                "إخفاء كلمة المرور"
            );

        } else {

            passwordInput.type =
                "password";

            togglePassword.textContent =
                "👁️";

            togglePassword.setAttribute(
                "aria-label",
                "إظهار كلمة المرور"
            );

        }

    }
);


// ==========================================
// Login
// ==========================================

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        // ------------------------------
        // Validation
        // ------------------------------

        if (!email) {

            showMessage(
                "من فضلك أدخل البريد الإلكتروني."
            );

            emailInput.focus();

            return;
        }


        if (!password) {

            showMessage(
                "من فضلك أدخل كلمة المرور."
            );

            passwordInput.focus();

            return;
        }


        setLoading(true);

        showMessage("", "success");


        try {

            // --------------------------
            // Firebase Login
            // --------------------------

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            console.log(
                "User logged in:",
                user.uid
            );


            // --------------------------
            // Get User Data
            // --------------------------

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnap =
                await getDoc(userRef);


            // --------------------------
            // User document doesn't exist
            // --------------------------

            if (!userSnap.exists()) {

                showMessage(
                    "تم تسجيل الدخول، لكن لم يتم العثور على بيانات الحساب.",
                    "error"
                );

                setLoading(false);

                return;
            }


            const userData =
                userSnap.data();


            // --------------------------
            // Admin
            // --------------------------

            if (
                userData.role ===
                "admin"
            ) {

                showMessage(
                    "تم تسجيل الدخول بنجاح 👑 جاري فتح لوحة التحكم...",
                    "success"
                );


                setTimeout(
                    () => {

                        window.location.href =
                            "admin.html";

                    },
                    700
                );


                return;
            }


            // --------------------------
            // Normal User
            // --------------------------

            showMessage(
                "تم تسجيل الدخول بنجاح ✅",
                "success"
            );


            setTimeout(
                () => {

                    window.location.href =
                        "index.html";

                },
                700
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            // --------------------------
            // Firebase Errors
            // --------------------------

            let message =
                "حدث خطأ أثناء تسجيل الدخول.";


            switch (error.code) {

                case
                    "auth/invalid-credential":

                    message =
                        "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

                    break;


                case
                    "auth/invalid-email":

                    message =
                        "البريد الإلكتروني غير صحيح.";

                    break;


                case
                    "auth/user-disabled":

                    message =
                        "هذا الحساب تم تعطيله.";

                    break;


                case
                    "auth/too-many-requests":

                    message =
                        "تمت محاولات كثيرة. حاول مرة أخرى لاحقًا.";

                    break;


                case
                    "auth/network-request-failed":

                    message =
                        "تأكد من اتصال الإنترنت.";

                    break;


                default:

                    message =
                        "تعذر تسجيل الدخول. تأكد من البيانات وحاول مرة أخرى.";

            }


            showMessage(
                message,
                "error"
            );

            setLoading(false);

        }

    }
);


// ==========================================
// Check Existing Login
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            return;
        }


        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnap =
                await getDoc(userRef);


            if (!userSnap.exists()) {

                return;
            }


            const userData =
                userSnap.data();


            // Admin already logged in

            if (
                userData.role ===
                "admin"
            ) {

                window.location.href =
                    "admin.html";

            }

        } catch (error) {

            console.error(
                "Auth check error:",
                error
            );

        }

    }
);
