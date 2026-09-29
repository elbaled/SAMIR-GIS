// ======================================================
// AHMED AI - REGISTER
// ======================================================

import {
    auth,
    db
} from "./firebase.js";


import {
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ======================================================
// ELEMENTS
// ======================================================

const registerForm =
    document.getElementById("registerForm");

const nameInput =
    document.getElementById("name");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const passwordToggle =
    document.getElementById("passwordToggle");

const confirmPasswordToggle =
    document.getElementById("confirmPasswordToggle");

const registerBtn =
    document.getElementById("registerBtn");

const registerBtnText =
    document.getElementById("registerBtnText");

const registerLoader =
    document.getElementById("registerLoader");

const message =
    document.getElementById("message");


// ======================================================
// SHOW / HIDE PASSWORD
// ======================================================

function togglePassword(
    input,
    button
) {

    if (input.type === "password") {

        input.type = "text";

        button.textContent = "🙈";

    } else {

        input.type = "password";

        button.textContent = "👁️";

    }

}


passwordToggle.addEventListener(
    "click",
    () => {

        togglePassword(
            passwordInput,
            passwordToggle
        );

    }
);


confirmPasswordToggle.addEventListener(
    "click",
    () => {

        togglePassword(
            confirmPasswordInput,
            confirmPasswordToggle
        );

    }
);


// ======================================================
// MESSAGE
// ======================================================

function showMessage(
    text,
    type = "error"
) {

    message.textContent = text;

    message.className =
        `message ${type}`;

}


function clearMessage() {

    message.textContent = "";

    message.className =
        "message";

}


// ======================================================
// LOADING
// ======================================================

function setLoading(
    loading
) {

    registerBtn.disabled =
        loading;


    if (loading) {

        registerBtnText.textContent =
            "جاري إنشاء الحساب...";

        registerLoader.style.display =
            "inline-block";

    } else {

        registerBtnText.textContent =
            "إنشاء الحساب";

        registerLoader.style.display =
            "none";

    }

}


// ======================================================
// VALIDATE
// ======================================================

function validateForm() {

    const name =
        nameInput.value.trim();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    // ------------------------------------------
    // NAME
    // ------------------------------------------

    if (!name) {

        showMessage(
            "من فضلك اكتب اسمك."
        );

        nameInput.focus();

        return false;

    }


    if (name.length < 2) {

        showMessage(
            "الاسم يجب أن يحتوي على حرفين على الأقل."
        );

        nameInput.focus();

        return false;

    }


    // ------------------------------------------
    // EMAIL
    // ------------------------------------------

    if (!email) {

        showMessage(
            "من فضلك اكتب البريد الإلكتروني."
        );

        emailInput.focus();

        return false;

    }


    // ------------------------------------------
    // PASSWORD
    // ------------------------------------------

    if (!password) {

        showMessage(
            "من فضلك اكتب كلمة المرور."
        );

        passwordInput.focus();

        return false;

    }


    if (password.length < 6) {

        showMessage(
            "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل."
        );

        passwordInput.focus();

        return false;

    }


    // ------------------------------------------
    // CONFIRM PASSWORD
    // ------------------------------------------

    if (password !== confirmPassword) {

        showMessage(
            "كلمتا المرور غير متطابقتين."
        );

        confirmPasswordInput.focus();

        return false;

    }


    return true;

}


// ======================================================
// FIREBASE ERROR
// ======================================================

function getFirebaseErrorMessage(
    error
) {

    switch (error.code) {

        case "auth/email-already-in-use":

            return "هذا البريد الإلكتروني مسجل بالفعل. جرّب تسجيل الدخول.";

        case "auth/invalid-email":

            return "البريد الإلكتروني غير صحيح.";

        case "auth/weak-password":

            return "كلمة المرور ضعيفة. استخدم كلمة مرور أقوى.";

        case "auth/network-request-failed":

            return "تأكد من اتصالك بالإنترنت وحاول مرة أخرى.";

        case "auth/operation-not-allowed":

            return "تسجيل الحسابات بالبريد الإلكتروني غير مفعل في Firebase.";

        case "auth/too-many-requests":

            return "تم إجراء محاولات كثيرة. حاول مرة أخرى لاحقًا.";

        default:

            return (
                error.message ||
                "حدث خطأ أثناء إنشاء الحساب."
            );

    }

}


// ======================================================
// REGISTER
// ======================================================

registerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        clearMessage();


        // ------------------------------------------
        // VALIDATION
        // ------------------------------------------

        if (!validateForm()) {

            return;

        }


        const name =
            nameInput.value.trim();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        setLoading(true);


        try {

            // ------------------------------------------
            // CREATE FIREBASE ACCOUNT
            // ------------------------------------------

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            // ------------------------------------------
            // UPDATE DISPLAY NAME
            // ------------------------------------------

            await updateProfile(
                user,
                {
                    displayName: name
                }
            );


            // ------------------------------------------
            // CREATE FIRESTORE USER DOCUMENT
            // ------------------------------------------

            await setDoc(
                doc(
                    db,
                    "users",
                    user.uid
                ),
                {
                    name: name,

                    email: email,

                    role: "user",

                    createdAt:
                        new Date().toISOString()
                }
            );


            // ------------------------------------------
            // SUCCESS
            // ------------------------------------------

            showMessage(
                "تم إنشاء حسابك بنجاح! جاري فتح Ahmed AI...",
                "success"
            );


            // ------------------------------------------
            // REDIRECT
            // ------------------------------------------

            setTimeout(
                () => {

                    window.location.replace(
                        "index.html"
                    );

                },
                1200
            );


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );


            showMessage(
                getFirebaseErrorMessage(error)
            );


            setLoading(false);

        }

    }
);


// ======================================================
// IF ALREADY LOGGED IN
// ======================================================

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


            const userSnapshot =
                await getDoc(userRef);


            if (
                userSnapshot.exists()
            ) {

                const userData =
                    userSnapshot.data();


                // ------------------------------------------
                // ADMIN
                // ------------------------------------------

                if (
                    userData.role === "admin"
                ) {

                    window.location.replace(
                        "admin.html"
                    );

                    return;

                }


                // ------------------------------------------
                // NORMAL USER
                // ------------------------------------------

                window.location.replace(
                    "index.html"
                );

            }

        } catch (error) {

            console.error(
                "Auth state error:",
                error
            );

        }

    }
);
