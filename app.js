/* =========================================================
   GEO AI - Main Application
   ========================================================= */

"use strict";


/* =========================================================
   CONFIG
   ========================================================= */

// رابط Ahmed AI Worker
const AI_API_URL =
    "https://shy-reciahmed-ai-apipe-7386.123456789012345678o01234567898.workers.dev/api/chat";


/* =========================================================
   VISION CONFIG
   ========================================================= */

// رابط GEO AI Vision Worker
const AI_VISION_API_URL =
    "https://shy-reciahmed-ai-apipe-7386.123456789012345678o01234567898.workers.dev/api/vision";


/* =========================================================
   FIREBASE STATE
   ========================================================= */

let firebaseAuth = null;
let firebaseDB = null;
let currentUser = null;

let firebaseReady = false;


/* =========================================================
   COURSE STATE
   ========================================================= */

let courses = [];

let coursesLoaded = false;

let coursesLoading = false;

let editingCourseId = null;

let currentCourseCategory = "all";

let currentUserIsAdmin = false;


/* =========================================================
   FIREBASE INITIALIZATION
   ========================================================= */

async function initializeFirebaseForChat() {

    try {

        const firebaseModule =
            await import("./firebase.js");

        firebaseAuth =
            firebaseModule.auth;

        firebaseDB =
            firebaseModule.db;


        const authModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js"
            );


        authModule.onAuthStateChanged(
            firebaseAuth,
            async (user) => {

                currentUser = user || null;

                firebaseReady =
                    !!currentUser;


                if (currentUser) {

                    console.log(
                        "Ahmed AI Firebase user:",
                        currentUser.email
                    );


                    await loadCurrentUserRole();


                    if (
                        document.getElementById(
                            "coursesSection"
                        )
                    ) {

                        await loadCourses();

                    }

                } else {

                    console.log(
                        "Ahmed AI: no authenticated user."
                    );


                    currentUserIsAdmin =
                        false;


                    updateCourseAdminUI();

                }

            }
        );


    } catch (error) {

        console.error(
            "Firebase initialization error:",
            error
        );

        firebaseReady = false;

    }

}


/* =========================================================
   LOAD CURRENT USER ROLE
   ========================================================= */

async function loadCurrentUserRole() {

    currentUserIsAdmin =
        false;


    if (
        !currentUser ||
        !firebaseDB
    ) {

        updateCourseAdminUI();

        return;

    }


    try {

        const firestoreModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
            );


        const {
            doc,
            getDoc
        } = firestoreModule;


        const userRef =
            doc(
                firebaseDB,
                "users",
                currentUser.uid
            );


        const userSnapshot =
            await getDoc(
                userRef
            );


        if (
            userSnapshot.exists()
        ) {

            const userData =
                userSnapshot.data();


            currentUserIsAdmin =
                userData.role === "admin";

        }


        console.log(
            "GEO AI current user admin:",
            currentUserIsAdmin
        );


        updateCourseAdminUI();


    } catch (error) {

        console.error(
            "User role loading error:",
            error
        );


        currentUserIsAdmin =
            false;


        updateCourseAdminUI();

    }

}


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);


function showNotification(message, icon = "✓") {

    const notification =
        $("notification");

    const text =
        $("notificationText");

    const notificationIcon =
        $("notificationIcon");


    if (!notification) return;


    if (text) {
        text.textContent = message;
    }


    if (notificationIcon) {
        notificationIcon.textContent = icon;
    }


    notification.classList.add("show");


    clearTimeout(
        window.notificationTimer
    );


    window.notificationTimer =
        setTimeout(() => {

            notification.classList.remove(
                "show"
            );

        }, 2500);

}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;

}


function scrollChatToBottom() {

    const chat =
        $("chatMessages");


    if (chat) {

        chat.scrollTop =
            chat.scrollHeight;

    }

}


/* =========================================================
   APP STATE
   ========================================================= */

let state = {

    currentSection: "home",

    darkMode:
        localStorage.getItem(
            "ahmed_ai_dark"
        ) === "true",

    saveChats:
        localStorage.getItem(
            "ahmed_ai_save_chats"
        ) !== "false",

    currentChat: [],

    selectedLanguage:
        localStorage.getItem(
            "ahmed_ai_language"
        ) || "ar",

    selectedCodingLanguage:
        "Python",

    selectedFile:
        null,

    /*
       الصورة الحالية التي اختارها المستخدم
       لا يتم تخزينها في LocalStorage
       لأنها قد تكون كبيرة الحجم.
    */

    selectedImage:
        null,

    selectedImageData:
        null,

    selectedImageName:
        null

};


/* =========================================================
   PAGE INFORMATION
   ========================================================= */

const pageInfo = {

    home: {
        title: "الرئيسية",
        subtitle: "مساعدك الذكي للمذاكرة والعمل"
    },

    chat: {
        title: "AI Chat",
        subtitle: "تحدث مع Ahmed AI"
    },

    study: {
        title: "المذاكرة",
        subtitle: "مدرسك الشخصي"
    },

    gis: {
        title: "مساعد GIS",
        subtitle:
            "GIS • Remote Sensing • Surveying"
    },

    coding: {
        title: "البرمجة",
        subtitle:
            "Python • ArcPy • JavaScript • SQL"
    },

    files: {
        title: "ملفاتي",
        subtitle:
            "إدارة ملفات المذاكرة"
    },

    tests: {
        title: "الاختبارات",
        subtitle:
            "اختبر معلوماتك"
    },

    courses: {
        title: "الكورسات والدورات",
        subtitle:
            "كورسات ودورات GIS والمساحة والاستشعار عن بعد والبرمجة"
    },

    settings: {
        title: "الإعدادات",
        subtitle:
            "إعدادات Ahmed AI"
    }

};


/* =========================================================
   NAVIGATION
   ========================================================= */

function openSection(sectionName) {

    const section =
        $(sectionName + "Section");


    if (!section) return;


    document
        .querySelectorAll(".page-section")
        .forEach((item) => {

            item.classList.remove(
                "active"
            );

        });


    section.classList.add(
        "active"
    );


    document
        .querySelectorAll(
            ".menu-item[data-section]"
        )
        .forEach((item) => {

            item.classList.toggle(
                "active",
                item.dataset.section ===
                sectionName
            );

        });


    state.currentSection =
        sectionName;


    const info =
        pageInfo[sectionName];


    if (info) {

        if ($("pageTitle")) {

            $("pageTitle").textContent =
                info.title;

        }


        if ($("pageSubtitle")) {

            $("pageSubtitle").textContent =
                info.subtitle;

        }

    }


    if (
        sectionName === "courses"
    ) {

        loadCourses();

    }


    closeMobileSidebar();


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   SIDEBAR
   ========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            ".menu-item[data-section]"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;

                    openSection(
                        section
                    );

                }
            );

        });


    document
        .querySelectorAll(
            ".quick-card[data-action]"
        )
        .forEach((card) => {

            card.addEventListener(
                "click",
                () => {

                    openSection(
                        card.dataset.action
                    );

                }
            );

        });


    const newChatBtn =
        $("newChatBtn");


    if (newChatBtn) {

        newChatBtn.addEventListener(
            "click",
            () => {

                newChat();

                openSection(
                    "chat"
                );

            }
        );

    }


    const mobileMenuBtn =
        $("mobileMenuBtn");


    if (mobileMenuBtn) {

        mobileMenuBtn.addEventListener(
            "click",
            () => {

                const sidebar =
                    $("sidebar");


                if (sidebar) {

                    sidebar.classList.toggle(
                        "open"
                    );

                }

            }
        );

    }

}


function closeMobileSidebar() {

    const sidebar =
        $("sidebar");


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }

}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {

    if (state.darkMode) {

        document.body.classList.add(
            "dark"
        );

    } else {

        document.body.classList.remove(
            "dark"
        );

    }


    const toggle =
        $("darkModeToggle");


    if (toggle) {

        toggle.checked =
            state.darkMode;

    }

}


function setupTheme() {

    applyTheme();


    const themeBtn =
        $("themeBtn");


    if (themeBtn) {

        themeBtn.addEventListener(
            "click",
            () => {

                state.darkMode =
                    !state.darkMode;


                localStorage.setItem(
                    "ahmed_ai_dark",
                    state.darkMode
                );


                applyTheme();

            }
        );

    }


    const darkModeToggle =
        $("darkModeToggle");


    if (darkModeToggle) {

        darkModeToggle.checked =
            state.darkMode;


        darkModeToggle.addEventListener(
            "change",
            () => {

                state.darkMode =
                    darkModeToggle.checked;


                localStorage.setItem(
                    "ahmed_ai_dark",
                    state.darkMode
                );


                applyTheme();

            }
        );

    }

}


/* =========================================================
   CHAT STORAGE - LOCAL
   ========================================================= */

function saveCurrentChat() {

    if (!state.saveChats) return;


    localStorage.setItem(

        "ahmed_ai_current_chat",

        JSON.stringify(
            state.currentChat
        )

    );

}


function loadCurrentChat() {

    if (!state.saveChats) return;


    try {

        const saved =
            localStorage.getItem(
                "ahmed_ai_current_chat"
            );


        if (!saved) return;


        const messages =
            JSON.parse(saved);


        if (!Array.isArray(messages)) {
            return;
        }


        state.currentChat =
            messages;


        renderSavedChat();


    } catch (error) {

        console.error(
            "Chat load error:",
            error
        );

    }

}


function renderSavedChat() {

    const container =
        $("chatMessages");


    if (!container) return;


    if (!state.currentChat.length) {
        return;
    }


    container.innerHTML = "";


    state.currentChat.forEach(
        (message) => {

            addMessageToUI(

                message.role,

                message.content,

                false

            );

        }
    );


    scrollChatToBottom();

}


/* =========================================================
   FIREBASE CHAT SAVE
   ========================================================= */

async function saveChatToFirebase(
    userMessage,
    aiResponse
) {

    if (!currentUser) {

        console.log(
            "Chat not saved to Firebase: no user."
        );

        return;

    }


    if (!firebaseDB) {

        console.log(
            "Chat not saved: Firebase DB not ready."
        );

        return;

    }


    try {

        const firestoreModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
            );


        const {
            collection,
            addDoc,
            serverTimestamp
        } = firestoreModule;


        const chatData = {

            uid:
                currentUser.uid,

            email:
                currentUser.email || "",

            name:
                currentUser.displayName ||
                "مستخدم",

            message:
                userMessage,

            response:
                aiResponse,

            createdAt:
                serverTimestamp(),

            createdAtClient:
                new Date().toISOString()

        };


        const chatRef =
            await addDoc(

                collection(
                    firebaseDB,
                    "chats"
                ),

                chatData

            );


        console.log(
            "Chat saved successfully:",
            chatRef.id
        );


    } catch (error) {

        console.error(
            "Firestore chat save error:",
            error
        );

    }

}


/* =========================================================
   NEW CHAT
   ========================================================= */

function newChat() {

    state.currentChat = [];


    state.selectedImage =
        null;

    state.selectedImageData =
        null;

    state.selectedImageName =
        null;


    localStorage.removeItem(
        "ahmed_ai_current_chat"
    );


    const chatMessages =
        $("chatMessages");


    if (chatMessages) {

        chatMessages.innerHTML = `

            <div class="empty-chat">

                <div class="empty-icon">
                    🤖
                </div>

                <h2>
                    Ahmed AI
                </h2>

                <p>
                    أنا جاهز أساعدك في المذاكرة
                    وGIS والبرمجة.
                </p>

                <div class="suggestions">

                    <button>
                        اشرحلي ArcGIS Pro
                    </button>

                    <button>
                        علمني Python
                    </button>

                    <button>
                        اشرحلي Remote Sensing
                    </button>

                </div>

            </div>

        `;


        setupSuggestionButtons();

    }


    showNotification(
        "تم إنشاء محادثة جديدة",
        "✓"
    );

}


/* =========================================================
   CHAT UI
   ========================================================= */

function addMessageToUI(
    role,
    content,
    save = true
) {

    const container =
        $("chatMessages");


    if (!container) return null;


    const empty =
        container.querySelector(
            ".empty-chat"
        );


    if (empty) {

        empty.remove();

    }


    const message =
        document.createElement(
            "div"
        );


    message.className =
        role === "user"
            ? "message user-message"
            : "message ai-message";


    message.innerHTML = `

        <div class="message-avatar">
            ${role === "user" ? "أ" : "🤖"}
        </div>

        <div class="message-content">
            ${escapeHTML(content)}
        </div>

    `;


    container.appendChild(
        message
    );


    scrollChatToBottom();


    if (save) {

        state.currentChat.push({

            role,

            content

        });


        saveCurrentChat();

    }


    return message;

}


/* =========================================================
   VISION IMAGE MESSAGE UI
   ========================================================= */

function addImageMessageToUI(
    imageData,
    imageName = "الصورة"
) {

    const container =
        $("chatMessages");


    if (!container) return null;


    const empty =
        container.querySelector(
            ".empty-chat"
        );


    if (empty) {

        empty.remove();

    }


    const message =
        document.createElement(
            "div"
        );


    message.className =
        "message user-message vision-image-message";


    message.innerHTML = `

        <div class="message-avatar">
            أ
        </div>

        <div class="message-content">

            <div
                class="vision-image-wrapper"
                style="
                    max-width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                "
            >

                <img
                    src="${imageData}"
                    alt="${escapeHTML(imageName)}"
                    style="
                        max-width: 100%;
                        max-height: 420px;
                        object-fit: contain;
                        border-radius: 14px;
                        display: block;
                    "
                >

                <small
                    style="
                        opacity: 0.75;
                        display: block;
                    "
                >
                    📷 ${escapeHTML(imageName)}
                </small>

            </div>

        </div>

    `;


    container.appendChild(
        message
    );


    scrollChatToBottom();


    return message;

}


/* =========================================================
   VISION IMAGE PREVIEW
   ========================================================= */

function prepareSelectedImage(
    file
) {

    return new Promise(
        (resolve, reject) => {

            if (!file) {

                reject(
                    new Error(
                        "لم يتم اختيار صورة."
                    )
                );

                return;

            }


            if (
                !file.type ||
                !file.type.startsWith(
                    "image/"
                )
            ) {

                reject(
                    new Error(
                        "الملف المحدد ليس صورة."
                    )
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload = () => {

                const result =
                    reader.result;


                if (
                    typeof result !==
                    "string"
                ) {

                    reject(
                        new Error(
                            "تعذر قراءة الصورة."
                        )
                    );

                    return;

                }


                resolve(result);

            };


            reader.onerror = () => {

                reject(
                    new Error(
                        "حدث خطأ أثناء قراءة الصورة."
                    )
                );

            };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   SET SELECTED IMAGE
   ========================================================= */

async function setSelectedImage(
    file
) {

    if (!file) return;


    try {

        const imageData =
            await prepareSelectedImage(
                file
            );


        state.selectedImage =
            file;

        state.selectedImageData =
            imageData;

        state.selectedImageName =
            file.name;


        openSection(
            "chat"
        );


        addImageMessageToUI(

            imageData,

            file.name

        );


        showNotification(

            `تم تجهيز الصورة: ${file.name}`,

            "📷"

        );


        const chatInput =
            $("chatInput");


        if (chatInput) {

            setTimeout(
                () => {

                    chatInput.focus();

                },
                100
            );

        }


    } catch (error) {

        console.error(
            "Image preparation error:",
            error
        );


        showNotification(

            error.message ||
            "تعذر تجهيز الصورة",

            "!"

        );

    }

}


/* =========================================================
   CLEAR SELECTED IMAGE
   ========================================================= */

function clearSelectedImage() {

    state.selectedImage =
        null;

    state.selectedImageData =
        null;

    state.selectedImageName =
        null;


    const homeImageInput =
        $("homeImageInput");


    const chatImageInput =
        $("chatImageInput");


    if (homeImageInput) {

        homeImageInput.value =
            "";

    }


    if (chatImageInput) {

        chatImageInput.value =
            "";

    }

}


/* =========================================================
   AI REQUEST
   ========================================================= */

async function askAI(message) {

    const response =
        await fetch(

            AI_API_URL,

            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        message:
                            message

                    })

            }

        );


    let data;


    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            "السيرفر لم يرجع بيانات صحيحة."
        );

    }


    if (!response.ok) {

        throw new Error(

            data?.error ||

            "حدث خطأ في الاتصال بالسيرفر."

        );

    }


    if (!data.success) {

        throw new Error(

            data?.error ||

            "تعذر الحصول على إجابة."

        );

    }


    return (

        data.response ||

        data.answer ||

        data.text ||

        ""

    );

}


/* =========================================================
   VISION REQUEST
   ========================================================= */

async function askVision(
    message,
    imageData
) {

    if (!imageData) {

        throw new Error(
            "لم يتم تجهيز الصورة."
        );

    }


    const response =
        await fetch(

            AI_VISION_API_URL,

            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        message:
                            message ||
                            "حلل هذه الصورة بالتفصيل واشرح لي ما الذي يظهر فيها.",

                        image:
                            imageData

                    })

            }

        );


    let data;


    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            "سيرفر Vision لم يرجع بيانات صحيحة."
        );

    }


    if (!response.ok) {

        throw new Error(

            data?.error ||

            "حدث خطأ أثناء الاتصال بخدمة Vision."

        );

    }


    if (!data.success) {

        throw new Error(

            data?.error ||

            "تعذر تحليل الصورة."

        );

    }


    return (

        data.response ||

        data.answer ||

        data.text ||

        ""

    );

}


/* =========================================================
   SEND CHAT
   ========================================================= */

async function sendChatMessage(text) {

    text =
        String(
            text || ""
        ).trim();


    const hasImage =
        !!state.selectedImageData;


    if (
        !text &&
        !hasImage
    ) {

        return;

    }


    const input =
        $("chatInput");


    if (input) {

        input.value = "";

    }


    if (
        hasImage &&
        !text
    ) {

        text =
            "حلل هذه الصورة بالتفصيل واشرح لي ما الذي يظهر فيها.";

    }


    if (text) {

        addMessageToUI(

            "user",

            text

        );

    }


    const loadingMessage =
        addMessageToUI(

            "assistant",

            hasImage
                ? "🖼️ جاري تحليل الصورة..."
                : "🤖 جاري التفكير...",

            false

        );


    const imageDataToSend =
        state.selectedImageData;


    const imageNameToSend =
        state.selectedImageName;


    try {

        let answer;


        if (hasImage) {

            answer =
                await askVision(

                    text,

                    imageDataToSend

                );

        }

        else {

            answer =
                await askAI(
                    text
                );

        }


        if (loadingMessage) {

            const content =
                loadingMessage.querySelector(
                    ".message-content"
                );


            if (content) {

                content.textContent =
                    answer ||
                    (
                        hasImage
                            ? "لم يصل تحليل للصورة."
                            : "لم تصل إجابة."
                    );

            }

        }


        state.currentChat.push({

            role:
                "assistant",

            content:
                answer ||
                (
                    hasImage
                        ? "لم يصل تحليل للصورة."
                        : "لم تصل إجابة."
                )

        });


        saveCurrentChat();


        scrollChatToBottom();


        await saveChatToFirebase(

            hasImage
                ? (
                    `📷 ${imageNameToSend || "صورة"}\n\n` +
                    text
                )
                : text,

            answer ||
            (
                hasImage
                    ? "لم يصل تحليل للصورة."
                    : "لم تصل إجابة."
            )

        );


        if (hasImage) {

            clearSelectedImage();

        }


    } catch (error) {

        console.error(
            "AI Error:",
            error
        );


        if (loadingMessage) {

            const content =
                loadingMessage.querySelector(
                    ".message-content"
                );


            if (content) {

                content.textContent =
                    "❌ " +
                    error.message;

            }

        }

    }

}


/* =========================================================
   CHAT EVENTS
   ========================================================= */

function setupChat() {

    const sendButton =
        $("chatSendBtn");


    const input =
        $("chatInput");


    if (
        sendButton &&
        input
    ) {

        sendButton.addEventListener(
            "click",
            () => {

                sendChatMessage(
                    input.value
                );

            }
        );


        input.addEventListener(
            "keydown",
            (event) => {

                if (

                    event.key ===
                        "Enter" &&

                    !event.shiftKey

                ) {

                    event.preventDefault();


                    sendChatMessage(
                        input.value
                    );

                }

            }
        );

    }


    const homeSendButton =
        $("homeSendBtn");


    const homeInput =
        $("homeChatInput");


    if (
        homeSendButton &&
        homeInput
    ) {

        homeSendButton.addEventListener(
            "click",
            () => {

                const text =
                    homeInput.value.trim();


                if (
                    state.selectedImageData
                ) {

                    homeInput.value =
                        "";


                    openSection(
                        "chat"
                    );


                    sendChatMessage(
                        text
                    );


                    return;

                }


                if (!text) return;


                homeInput.value =
                    "";


                openSection(
                    "chat"
                );


                sendChatMessage(
                    text
                );

            }
        );


        homeInput.addEventListener(
            "keydown",
            (event) => {

                if (

                    event.key ===
                        "Enter" &&

                    !event.shiftKey

                ) {

                    event.preventDefault();


                    const text =
                        homeInput.value.trim();


                    if (
                        state.selectedImageData
                    ) {

                        homeInput.value =
                            "";


                        openSection(
                            "chat"
                        );


                        sendChatMessage(
                            text
                        );


                        return;

                    }


                    if (!text) return;


                    homeInput.value =
                        "";


                    openSection(
                        "chat"
                    );


                    sendChatMessage(
                        text
                    );

                }

            }
        );

    }


    setupSuggestionButtons();

}


/* =========================================================
   SUGGESTIONS
   ========================================================= */

function setupSuggestionButtons() {

    document
        .querySelectorAll(
            ".suggestions button"
        )
        .forEach((button) => {

            button.onclick = () => {

                const text =
                    button.textContent.trim();


                const input =
                    $("chatInput");


                if (input) {

                    input.value =
                        text;

                }


                openSection(
                    "chat"
                );


                sendChatMessage(
                    text
                );

            };

        });

}


/* =========================================================
   GIS
   ========================================================= */

function setupGIS() {

    document
        .querySelectorAll(
            ".subject-card"
        )
        .forEach((card) => {

            card.addEventListener(
                "click",
                () => {

                    const topic =
                        card.dataset.topic;


                    const input =
                        $("gisInput");


                    if (!input) return;


                    input.value =

                        `اشرحلي ${topic} بالتفصيل وبطريقة مناسبة لطالب GIS، مع أمثلة عملية.`;


                    input.focus();

                }
            );

        });


    const button =
        $("gisSendBtn");


    if (button) {

        button.addEventListener(
            "click",
            () => {

                const input =
                    $("gisInput");


                if (!input) return;


                const text =
                    input.value.trim();


                if (!text) {

                    showNotification(
                        "اكتب سؤالك أولاً",
                        "!"
                    );


                    return;

                }


                openSection(
                    "chat"
                );


                sendChatMessage(

                    `أنت مساعد متخصص في GIS والاستشعار عن بعد والمساحة.\n\n${text}`

                );

            }
        );

    }

}


/* =========================================================
   CODING
   ========================================================= */

function setupCoding() {

    document
        .querySelectorAll(
            ".language-card"
        )
        .forEach((card) => {

            card.addEventListener(
                "click",
                () => {

                    state.selectedCodingLanguage =
                        card.dataset.language ||
                        "Python";


                    document
                        .querySelectorAll(
                            ".language-card"
                        )
                        .forEach((item) => {

                            item.classList.remove(
                                "selected"
                            );

                        });


                    card.classList.add(
                        "selected"
                    );


                    const input =
                        $("codeInput");


                    if (input) {

                        input.placeholder =

                            `مثال: اكتبلي ${state.selectedCodingLanguage} code...`;


                        input.focus();

                    }

                }
            );

        });


    const button =
        $("codeSendBtn");


    if (button) {

        button.addEventListener(
            "click",
            async () => {

                const input =
                    $("codeInput");


                const output =
                    $("codeOutput");


                if (
                    !input ||
                    !output
                ) return;


                const request =
                    input.value.trim();


                if (!request) {

                    showNotification(
                        "اكتب المطلوب من AI أولاً",
                        "!"
                    );


                    return;

                }


                output.textContent =
                    "🤖 جاري إنشاء الكود...";


                try {

                    const answer =
                        await askAI(

                            `أنت مساعد برمجة متخصص.\n` +

                            `لغة البرمجة: ${state.selectedCodingLanguage}\n\n` +

                            `المطلوب:\n${request}\n\n` +

                            `اكتب كودًا عمليًا مع شرح مختصر.`

                        );


                    output.textContent =
                        answer ||
                        "لم يتم إنشاء الكود.";

                } catch (error) {

                    output.textContent =
                        "❌ " +
                        error.message;

                }

            }
        );

    }


    const copyButton =
        $("copyCodeBtn");


    if (copyButton) {

        copyButton.addEventListener(
            "click",
            async () => {

                const output =
                    $("codeOutput");


                if (!output) return;


                try {

                    await navigator
                        .clipboard
                        .writeText(
                            output.textContent
                        );


                    showNotification(
                        "تم نسخ الكود",
                        "✓"
                    );


                } catch {

                    showNotification(
                        "تعذر نسخ الكود",
                        "!"
                    );

                }

            }
        );

    }

}


/* =========================================================
   STUDY
   ========================================================= */

function setupStudy() {

    document
        .querySelectorAll(
            "[data-study-action]"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const action =
                        button.dataset.studyAction;


                    const prompts = {

                        explain:
                            "اشرحلي الدرس بطريقة بسيطة جدًا، ثم أعطني أمثلة وأسئلة للتأكد من الفهم.",

                        summary:
                            "لخص لي الموضوع في نقاط منظمة ومهمة للمذاكرة والامتحان.",

                        questions:
                            "أنشئ لي أسئلة تدريبية متنوعة عن الموضوع مع الإجابات.",

                        exam:
                            "اختبرني في الموضوع بأسئلة واحدة واحدة، وانتظر إجابتي قبل السؤال التالي."

                    };


                    openSection(
                        "chat"
                    );


                    const input =
                        $("chatInput");


                    if (input) {

                        input.value =
                            prompts[action] ||
                            "ساعدني في المذاكرة.";


                        input.focus();

                    }

                }
            );

        });

}


/* =========================================================
   FILES
   ========================================================= */

function setupFiles() {

    const inputs = [

        $("mainFileInput"),

        $("studyFileInput"),

        $("homeFileInput"),

        $("chatFileInput")

    ];


    inputs.forEach(
        (input) => {

            if (!input) return;


            input.addEventListener(
                "change",
                () => {

                    const file =
                        input.files?.[0];


                    if (!file) return;


                    state.selectedFile =
                        file;


                    addFileToList(
                        file
                    );


                    showNotification(

                        `تم اختيار الملف: ${file.name}`,

                        "✓"

                    );

                }
            );

        }
    );

}


function addFileToList(file) {

    const list =
        $("filesList");


    if (!list) return;


    const empty =
        list.querySelector(
            ".empty-files"
        );


    if (empty) {

        empty.remove();

    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "file-item";


    item.innerHTML = `

        <div class="file-icon">
            📄
        </div>

        <div class="file-info">

            <strong>
                ${escapeHTML(file.name)}
            </strong>

            <small>
                ${formatFileSize(file.size)}
            </small>

        </div>

    `;


    list.appendChild(
        item
    );

}


function formatFileSize(bytes) {

    if (!bytes) {
        return "0 KB";
    }


    const units = [

        "B",

        "KB",

        "MB",

        "GB"

    ];


    const index =
        Math.floor(

            Math.log(bytes) /
            Math.log(1024)

        );


    return (

        (

            bytes /

            Math.pow(
                1024,
                index
            )

        ).toFixed(1)

        +

        " "

        +

        units[index]

    );

}


/* =========================================================
   TESTS
   ========================================================= */

function setupTests() {

    const button =
        $("createTestBtn");


    if (!button) return;


    button.addEventListener(
        "click",
        async () => {

            const subject =
                $("testSubject")?.value ||
                "GIS";


            const count =
                $("testCount")?.value ||
                "5";


            const container =
                $("testContainer");


            if (!container) return;


            container.innerHTML = `

                <div class="test-loading">

                    🤖 جاري إنشاء اختبار
                    ${subject}...

                </div>

            `;


            try {

                const answer =
                    await askAI(

                        `أنشئ اختبارًا تعليميًا في مادة ${subject}.\n` +

                        `عدد الأسئلة: ${count}.\n` +

                        `اجعل الأسئلة مناسبة لطالب جامعي، ` +

                        `واكتب الاختيارات والإجابة الصحيحة.`

                    );


                container.innerHTML = `

                    <div class="test-result">

                        <h2>
                            📝 اختبار ${escapeHTML(subject)}
                        </h2>

                        <div class="test-content">
                            ${escapeHTML(answer)}
                        </div>

                    </div>

                `;

            } catch (error) {

                container.innerHTML = `

                    <div class="test-error">

                        ❌ ${escapeHTML(error.message)}

                    </div>

                `;

            }

        }
    );

}


/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {

    const saveToggle =
        $("saveChatsToggle");


    if (saveToggle) {

        saveToggle.checked =
            state.saveChats;


        saveToggle.addEventListener(
            "change",
            () => {

                state.saveChats =
                    saveToggle.checked;


                localStorage.setItem(

                    "ahmed_ai_save_chats",

                    state.saveChats

                );


                showNotification(

                    state.saveChats

                        ? "تم تفعيل حفظ المحادثات"

                        : "تم إيقاف حفظ المحادثات",

                    "✓"

                );

            }
        );

    }


    const languageSelect =
        $("languageSelect");


    if (languageSelect) {

        languageSelect.value =
            state.selectedLanguage;


        languageSelect.addEventListener(
            "change",
            () => {

                state.selectedLanguage =
                    languageSelect.value;


                localStorage.setItem(

                    "ahmed_ai_language",

                    state.selectedLanguage

                );


                showNotification(
                    "تم حفظ اللغة",
                    "✓"
                );

            }
        );

    }

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function setupNotifications() {

    const button =
        $("notificationBtn");


    if (button) {

        button.addEventListener(
            "click",
            () => {

                showNotification(

                    "لا توجد إشعارات جديدة",

                    "🔔"

                );

            }
        );

    }

}


/* =========================================================
   WEB SEARCH
   ========================================================= */

function setupWebSearch() {

    const button =
        $("webSearchBtn");


    if (!button) return;


    button.addEventListener(
        "click",
        () => {

            showNotification(

                "البحث على الإنترنت سنفعّله في المرحلة التالية",

                "🌐"

            );

        }
    );

}


/* =========================================================
   IMAGE INPUT
   ========================================================= */

function setupImages() {

    const inputs = [

        $("homeImageInput"),

        $("chatImageInput")

    ];


    inputs.forEach(
        (input) => {

            if (!input) return;


            input.addEventListener(
                "change",
                async () => {

                    const file =
                        input.files?.[0];


                    if (!file) return;


                    if (
                        !file.type ||
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        showNotification(

                            "الملف المحدد ليس صورة",

                            "!"

                        );


                        input.value =
                            "";


                        return;

                    }


                    await setSelectedImage(
                        file
                    );

                }
            );

        }
    );

}


/* =========================================================
   KEYBOARD SHORTCUT
   ========================================================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        (event) => {

            if (

                (event.ctrlKey ||
                 event.metaKey) &&

                event.key.toLowerCase() ===
                    "k"

            ) {

                event.preventDefault();


                openSection(
                    "chat"
                );


                $("chatInput")?.focus();

            }

        }
    );

}


/* =========================================================
   COURSES
   ========================================================= */


/* =========================================================
   COURSE CATEGORY NAME
   ========================================================= */

function getCourseCategoryName(category) {

    const categories = {

        surveying:
            "مساحة",

        gis:
            "GIS",

        remote_sensing:
            "استشعار عن بعد",

        programming:
            "برمجة"

    };


    return (
        categories[category] ||
        "أخرى"
    );

}


/* =========================================================
   COURSE TYPE NAME
   ========================================================= */

function getCourseTypeName(type) {

    if (
        type === "free"
    ) {

        return "مجاني";

    }


    if (
        type === "paid"
    ) {

        return "مدفوع";

    }


    return "دورة";

}


/* =========================================================
   SAFE COURSE URL
   ========================================================= */

function isValidCourseURL(url) {

    try {

        const parsed =
            new URL(
                String(url || "").trim()
            );


        return (

            parsed.protocol ===
                "http:" ||

            parsed.protocol ===
                "https:"

        );

    } catch {

        return false;

    }

}


/* =========================================================
   LOAD COURSES
   ========================================================= */

async function loadCourses() {

    if (coursesLoading) {
        return;
    }


    if (!firebaseDB) {

        console.log(
            "Courses cannot load: Firebase DB not ready."
        );

        return;

    }


    const grid =
        $("coursesGrid");


    const loading =
        $("coursesLoading");


    const empty =
        $("coursesEmpty");


    if (!grid) {
        return;
    }


    coursesLoading =
        true;


    coursesLoaded =
        false;


    if (loading) {

        loading.style.display =
            "block";

    }


    if (empty) {

        empty.style.display =
            "none";

    }


    try {

        const firestoreModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
            );


        const {
            collection,
            getDocs,
            query,
            orderBy
        } = firestoreModule;


        let snapshot;


        try {

            const coursesQuery =
                query(

                    collection(
                        firebaseDB,
                        "courses"
                    ),

                    orderBy(
                        "createdAt",
                        "desc"
                    )

                );


            snapshot =
                await getDocs(
                    coursesQuery
                );

        } catch (orderedError) {

            console.warn(
                "Courses ordered query failed. Loading without order:",
                orderedError
            );


            snapshot =
                await getDocs(

                    collection(
                        firebaseDB,
                        "courses"
                    )

                );

        }


        courses = [];


        snapshot.forEach(
            (documentSnapshot) => {

                courses.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        courses.sort(
            (a, b) => {

                const dateA =
                    getCourseDateValue(
                        a
                    );


                const dateB =
                    getCourseDateValue(
                        b
                    );


                return dateB - dateA;

            }
        );


        coursesLoaded =
            true;


        renderCourses();


    } catch (error) {

        console.error(
            "Courses loading error:",
            error
        );


        grid.innerHTML = `

            <div class="courses-error">

                <div>
                    ❌
                </div>

                <strong>
                    تعذر تحميل الكورسات
                </strong>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "حدث خطأ غير معروف."
                    )}
                </p>

                <button
                    type="button"
                    class="primary-btn"
                    id="retryCoursesBtn"
                >
                    إعادة المحاولة
                </button>

            </div>

        `;


        const retry =
            $("retryCoursesBtn");


        if (retry) {

            retry.addEventListener(
                "click",
                () => {

                    loadCourses();

                }
            );

        }

    } finally {

        coursesLoading =
            false;


        if (loading) {

            loading.style.display =
                "none";

        }

    }

}


/* =========================================================
   COURSE DATE VALUE
   ========================================================= */

function getCourseDateValue(course) {

    if (!course) {
        return 0;
    }


    if (
        course.createdAt &&
        typeof course.createdAt.toMillis ===
            "function"
    ) {

        return course.createdAt.toMillis();

    }


    if (
        course.updatedAt &&
        typeof course.updatedAt.toMillis ===
            "function"
    ) {

        return course.updatedAt.toMillis();

    }


    if (
        course.createdAtClient
    ) {

        const value =
            new Date(
                course.createdAtClient
            ).getTime();


        if (!Number.isNaN(value)) {

            return value;

        }

    }


    return 0;

}


/* =========================================================
   RENDER COURSES
   ========================================================= */

function renderCourses() {

    const grid =
        $("coursesGrid");


    const empty =
        $("coursesEmpty");


    if (!grid) {
        return;
    }


    let filteredCourses =
        courses;


    if (
        currentCourseCategory !==
        "all"
    ) {

        filteredCourses =
            courses.filter(
                (course) => {

                    return (
                        course.category ===
                        currentCourseCategory
                    );

                }
            );

    }


    if (
        !filteredCourses.length
    ) {

        grid.innerHTML = "";


        if (empty) {

            empty.style.display =
                "block";

        }


        return;

    }


    if (empty) {

        empty.style.display =
            "none";

    }


    grid.innerHTML =
        filteredCourses
            .map(
                (course) =>
                    createCourseCard(
                        course
                    )
            )
            .join("");


    setupCourseCardEvents();

}


/* =========================================================
   CREATE COURSE CARD
   ========================================================= */

function createCourseCard(course) {

    const title =
        escapeHTML(
            course.title ||
            "بدون عنوان"
        );


    const category =
        escapeHTML(
            getCourseCategoryName(
                course.category
            )
        );


    const instructor =
        escapeHTML(
            course.instructor ||
            "غير محدد"
        );


    const platform =
        escapeHTML(
            course.platform ||
            "غير محدد"
        );


    const description =
        escapeHTML(
            course.description ||
            "لا يوجد وصف للكورس."
        );


    const type =
        escapeHTML(
            getCourseTypeName(
                course.type
            )
        );


    const imageUrl =
        isValidCourseURL(
            course.imageUrl
        )
            ? course.imageUrl
            : "";


    const courseUrl =
        isValidCourseURL(
            course.url
        )
            ? course.url
            : "";


    const imageHTML =
        imageUrl

            ? `

                <div class="course-card-image">

                    <img
                        src="${escapeHTML(imageUrl)}"
                        alt="${title}"
                        loading="lazy"
                    >

                </div>

            `

            : `

                <div class="course-card-image course-placeholder">

                    <span>
                        🎓
                    </span>

                </div>

            `;


    const adminHTML =
        currentUserIsAdmin

            ? `

                <div class="course-admin-actions">

                    <button
                        type="button"
                        class="course-edit-btn"
                        data-course-id="${escapeHTML(course.id)}"
                    >
                        ✏️ تعديل
                    </button>

                    <button
                        type="button"
                        class="course-delete-btn"
                        data-course-id="${escapeHTML(course.id)}"
                    >
                        🗑️ حذف
                    </button>

                </div>

            `

            : "";


    const openButtonHTML =
        courseUrl

            ? `

                <a
                    class="course-open-btn"
                    href="${escapeHTML(courseUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    فتح الكورس
                    ↗
                </a>

            `

            : `

                <button
                    type="button"
                    class="course-open-btn disabled"
                    disabled
                >
                    الرابط غير متاح
                </button>

            `;


    return `

        <article
            class="course-card"
            data-course-id="${escapeHTML(course.id)}"
        >

            ${imageHTML}

            <div class="course-card-body">

                <div class="course-card-top">

                    <span class="course-category">
                        ${category}
                    </span>

                    <span class="course-type">
                        ${type}
                    </span>

                </div>


                <h3 class="course-title">
                    ${title}
                </h3>


                <p class="course-description">
                    ${description}
                </p>


                <div class="course-meta">

                    <div>
                        👨‍🏫
                        <span>
                            ${instructor}
                        </span>
                    </div>

                    <div>
                        🌐
                        <span>
                            ${platform}
                        </span>
                    </div>

                </div>


                <div class="course-card-footer">

                    ${openButtonHTML}

                </div>


                ${adminHTML}

            </div>

        </article>

    `;

}


/* =========================================================
   COURSE CARD EVENTS
   ========================================================= */

function setupCourseCardEvents() {

    document
        .querySelectorAll(
            ".course-edit-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        if (
                            !currentUserIsAdmin
                        ) {

                            showNotification(
                                "ليس لديك صلاحية تعديل الكورسات",
                                "!"
                            );


                            return;

                        }


                        const courseId =
                            button.dataset.courseId;


                        openCourseModal(
                            courseId
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".course-delete-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        if (
                            !currentUserIsAdmin
                        ) {

                            showNotification(
                                "ليس لديك صلاحية حذف الكورسات",
                                "!"
                            );


                            return;

                        }


                        const courseId =
                            button.dataset.courseId;


                        await deleteCourse(
                            courseId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   COURSE ADMIN UI
   ========================================================= */

function updateCourseAdminUI() {

    const addButton =
        $("addCourseBtn");


    if (addButton) {

        addButton.style.display =
            currentUserIsAdmin
                ? ""
                : "none";

    }


    const adminLabels =
        document.querySelectorAll(
            ".course-admin-only"
        );


    adminLabels.forEach(
        (element) => {

            element.style.display =
                currentUserIsAdmin
                    ? ""
                    : "none";

        }
    );


    if (
        coursesLoaded
    ) {

        renderCourses();

    }

}


/* =========================================================
   COURSE FILTERS
   ========================================================= */

function setupCourseFilters() {

    document
        .querySelectorAll(
            ".course-filter-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        currentCourseCategory =
                            button.dataset.category ||
                            "all";


                        document
                            .querySelectorAll(
                                ".course-filter-btn"
                            )
                            .forEach(
                                (item) => {

                                    item.classList.toggle(

                                        "active",

                                        item ===
                                        button

                                    );

                                }
                            );


                        renderCourses();

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".course-filter button"
        )
        .forEach(
            (button) => {

                if (
                    button.classList.contains(
                        "course-filter-btn"
                    )
                ) {

                    return;

                }


                button.addEventListener(
                    "click",
                    () => {

                        currentCourseCategory =
                            button.dataset.category ||
                            "all";


                        document
                            .querySelectorAll(
                                ".course-filter button"
                            )
                            .forEach(
                                (item) => {

                                    item.classList.toggle(
                                        "active",
                                        item === button
                                    );

                                }
                            );


                        renderCourses();

                    }
                );

            }
        );

}


/* =========================================================
   COURSE MODAL
   ========================================================= */

function openCourseModal(
    courseId = null
) {

    if (
        !currentUserIsAdmin
    ) {

        showNotification(
            "إضافة وتعديل الكورسات متاحة للإدمن فقط",
            "!"
        );


        return;

    }


    const modal =
        $("courseModal");


    if (!modal) {

        showNotification(
            "نافذة إضافة الكورس غير موجودة في index.html",
            "!"
        );


        return;

    }


    editingCourseId =
        courseId;


    const form =
        $("courseForm");


    if (form) {

        form.reset();

    }


    const titleInput =
        $("courseTitleInput");


    const categoryInput =
        $("courseCategoryInput");


    const typeInput =
        $("courseTypeInput");


    const instructorInput =
        $("courseInstructorInput");


    const platformInput =
        $("coursePlatformInput");


    const urlInput =
        $("courseUrlInput");


    const imageInput =
        $("courseImageInput");


    const descriptionInput =
        $("courseDescriptionInput");


    const submitButton =
        $("courseFormSubmit");


    if (courseId) {

        const course =
            courses.find(
                (item) =>
                    item.id ===
                    courseId
            );


        if (!course) {

            showNotification(
                "الكورس المطلوب غير موجود",
                "!"
            );


            editingCourseId =
                null;


            return;

        }


        if (titleInput) {

            titleInput.value =
                course.title || "";

        }


        if (categoryInput) {

            categoryInput.value =
                course.category ||
                "gis";

        }


        if (typeInput) {

            typeInput.value =
                course.type ||
                "free";

        }


        if (instructorInput) {

            instructorInput.value =
                course.instructor ||
                "";

        }


        if (platformInput) {

            platformInput.value =
                course.platform ||
                "";

        }


        if (urlInput) {

            urlInput.value =
                course.url ||
                "";

        }


        if (imageInput) {

            imageInput.value =
                course.imageUrl ||
                "";

        }


        if (descriptionInput) {

            descriptionInput.value =
                course.description ||
                "";

        }


        if (submitButton) {

            submitButton.textContent =
                "حفظ التعديلات";

        }

    } else {

        if (categoryInput) {

            categoryInput.value =
                "gis";

        }


        if (typeInput) {

            typeInput.value =
                "free";

        }


        if (submitButton) {

            submitButton.textContent =
                "إضافة الكورس";

        }

    }


    modal.classList.add(
        "active"
    );


    modal.style.display =
        "flex";


    document.body.style.overflow =
        "hidden";


    setTimeout(
        () => {

            if (titleInput) {

                titleInput.focus();

            }

        },
        100
    );

}


/* =========================================================
   CLOSE COURSE MODAL
   ========================================================= */

function closeCourseModal() {

    const modal =
        $("courseModal");


    if (modal) {

        modal.classList.remove(
            "active"
        );


        modal.style.display =
            "none";

    }


    editingCourseId =
        null;


    document.body.style.overflow =
        "";

}


/* =========================================================
   COURSE FORM EVENTS
   ========================================================= */

function setupCourseModal() {

    const addButton =
        $("addCourseBtn");


    if (addButton) {

        addButton.addEventListener(
            "click",
            () => {

                openCourseModal();

            }
        );

    }


    const closeButton =
        $("courseModalClose");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                closeCourseModal();

            }
        );

    }


    const overlay =
        $("courseModalOverlay");


    if (overlay) {

        overlay.addEventListener(
            "click",
            () => {

                closeCourseModal();

            }
        );

    }


    const cancelButton =
        $("courseFormCancel");


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => {

                closeCourseModal();

            }
        );

    }


    const form =
        $("courseForm");


    if (form) {

        form.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                await saveCourseFromForm();

            }
        );

    }


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape"
            ) {

                const modal =
                    $("courseModal");


                if (
                    modal &&
                    (
                        modal.classList.contains(
                            "active"
                        ) ||
                        modal.style.display ===
                            "flex"
                    )
                ) {

                    closeCourseModal();

                }

            }

        }
    );

}


/* =========================================================
   GET COURSE FORM DATA
   ========================================================= */

function getCourseFormData() {

    const title =
        $("courseTitleInput")?.value.trim() ||
        "";


    const category =
        $("courseCategoryInput")?.value ||
        "gis";


    const type =
        $("courseTypeInput")?.value ||
        "free";


    const instructor =
        $("courseInstructorInput")?.value.trim() ||
        "";


    const platform =
        $("coursePlatformInput")?.value.trim() ||
        "";


    const url =
        $("courseUrlInput")?.value.trim() ||
        "";


    const imageUrl =
        $("courseImageInput")?.value.trim() ||
        "";


    const description =
        $("courseDescriptionInput")?.value.trim() ||
        "";


    return {

        title,

        category,

        type,

        instructor,

        platform,

        url,

        imageUrl,

        description

    };

}


/* =========================================================
   SAVE COURSE
   ========================================================= */

async function saveCourseFromForm() {

    if (
        !currentUser
    ) {

        showNotification(
            "يجب تسجيل الدخول أولاً",
            "!"
        );


        return;

    }


    if (
        !currentUserIsAdmin
    ) {

        showNotification(
            "إضافة الكورسات للإدمن فقط",
            "!"
        );


        return;

    }


    if (!firebaseDB) {

        showNotification(
            "Firebase غير جاهز",
            "!"
        );


        return;

    }


    const data =
        getCourseFormData();


    if (!data.title) {

        showNotification(
            "اكتب اسم الكورس أولاً",
            "!"
        );


        return;

    }


    if (!data.url) {

        showNotification(
            "أضف رابط الكورس",
            "!"
        );


        return;

    }


    if (
        !isValidCourseURL(
            data.url
        )
    ) {

        showNotification(
            "رابط الكورس غير صحيح. استخدم http أو https",
            "!"
        );


        return;

    }


    if (
        data.imageUrl &&
        !isValidCourseURL(
            data.imageUrl
        )
    ) {

        showNotification(
            "رابط صورة الكورس غير صحيح",
            "!"
        );


        return;

    }


    const submitButton =
        $("courseFormSubmit");


    const oldButtonText =
        submitButton?.textContent ||
        "";


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.textContent =
            editingCourseId
                ? "جاري الحفظ..."
                : "جاري الإضافة...";

    }


    try {

        const firestoreModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
            );


        const {
            collection,
            addDoc,
            doc,
            updateDoc,
            serverTimestamp
        } = firestoreModule;


        if (
            editingCourseId
        ) {

            const courseRef =
                doc(
                    firebaseDB,
                    "courses",
                    editingCourseId
                );


            await updateDoc(
                courseRef,
                {

                    ...data,

                    updatedAt:
                        serverTimestamp(),

                    updatedAtClient:
                        new Date().toISOString(),

                    updatedBy:
                        currentUser.uid

                }
            );


            showNotification(
                "تم تعديل الكورس بنجاح",
                "✓"
            );

        } else {

            await addDoc(

                collection(
                    firebaseDB,
                    "courses"
                ),

                {

                    ...data,

                    createdBy:
                        currentUser.uid,

                    createdByEmail:
                        currentUser.email ||
                        "",

                    createdAt:
                        serverTimestamp(),

                    createdAtClient:
                        new Date().toISOString(),

                    updatedAt:
                        serverTimestamp()

                }

            );


            showNotification(
                "تم إضافة الكورس بنجاح",
                "✓"
            );

        }


        closeCourseModal();


        await loadCourses();


    } catch (error) {

        console.error(
            "Course save error:",
            error
        );


        showNotification(

            error.message ||
            "حدث خطأ أثناء حفظ الكورس",

            "!"

        );

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.textContent =
                oldButtonText ||
                (
                    editingCourseId
                        ? "حفظ التعديلات"
                        : "إضافة الكورس"
                );

        }

    }

}


/* =========================================================
   DELETE COURSE
   ========================================================= */

async function deleteCourse(
    courseId
) {

    if (
        !currentUserIsAdmin
    ) {

        showNotification(
            "حذف الكورسات للإدمن فقط",
            "!"
        );


        return;

    }


    if (!firebaseDB) {

        showNotification(
            "Firebase غير جاهز",
            "!"
        );


        return;

    }


    const course =
        courses.find(
            (item) =>
                item.id ===
                courseId
        );


    const courseName =
        course?.title ||
        "هذا الكورس";


    const confirmed =
        window.confirm(
            `هل أنت متأكد من حذف "${courseName}"؟`
        );


    if (!confirmed) {
        return;
    }


    try {

        const firestoreModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
            );


        const {
            doc,
            deleteDoc
        } = firestoreModule;


        await deleteDoc(

            doc(
                firebaseDB,
                "courses",
                courseId
            )

        );


        showNotification(
            "تم حذف الكورس",
            "✓"
        );


        await loadCourses();


    } catch (error) {

        console.error(
            "Course delete error:",
            error
        );


        showNotification(

            error.message ||
            "حدث خطأ أثناء حذف الكورس",

            "!"

        );

    }

}


/* =========================================================
   COURSE INITIALIZATION
   ========================================================= */

function setupCourses() {

    setupCourseFilters();

    setupCourseModal();

    updateCourseAdminUI();


    if (
        $("coursesSection")
    ) {

        loadCourses();

    }

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function init() {

    console.log(
        "GEO AI initialized successfully."
    );


    /*
       تشغيل Firebase
    */

    initializeFirebaseForChat();


    setupNavigation();

    setupTheme();

    setupChat();

    setupGIS();

    setupCoding();

    setupStudy();

    setupFiles();

    setupTests();

    setupSettings();

    setupNotifications();

    setupWebSearch();

    setupImages();

    setupKeyboard();

    setupCourses();

    loadCurrentChat();

    openSection(
        "home"
    );

}


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();

}


/* =========================================================
   GEO AI INTRODUCTION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const introScreen =
            document.getElementById(
                "introScreen"
            );


        const startAI =
            document.getElementById(
                "startAI"
            );


        if (!introScreen) return;


        /*
           الدخول عند الضغط على الزر
        */

        if (startAI) {

            startAI.addEventListener(
                "click",
                () => {

                    introScreen.classList.add(
                        "hide"
                    );


                    setTimeout(
                        () => {

                            introScreen.remove();

                        },
                        800
                    );

                }
            );

        }


        /*
           الانتقال تلقائياً بعد 3 ثوانٍ
        */

        setTimeout(
            () => {

                if (
                    !introScreen.classList.contains(
                        "hide"
                    )
                ) {

                    introScreen.classList.add(
                        "hide"
                    );


                    setTimeout(
                        () => {

                            introScreen.remove();

                        },
                        800
                    );

                }

            },
            3000
        );

    }
);