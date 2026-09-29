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
            (user) => {

                currentUser = user || null;

                firebaseReady =
                    !!currentUser;

                if (currentUser) {

                    console.log(
                        "Ahmed AI Firebase user:",
                        currentUser.email
                    );

                } else {

                    console.log(
                        "Ahmed AI: no authenticated user."
                    );

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
        text;

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

/*
   يحفظ سؤال المستخدم + إجابة Ahmed AI
   في:

   Firestore
   └── chats
       ├── uid
       ├── email
       ├── name
       ├── message
       ├── response
       ├── createdAt
       └── createdAtClient
*/

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

        /*
           مهم:
           لو Firebase فشل، لا نوقف Ahmed AI.
           الرد سيظل ظاهرًا للمستخدم.
        */

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

/*
   عرض الصورة داخل المحادثة.

   هذه الوظيفة لا ترسل الصورة إلى السيرفر.
   وظيفتها فقط إظهار الصورة للمستخدم
   داخل المحادثة قبل التحليل.
*/

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

/*
   عرض الصورة المحددة وتجهيزها للإرسال.
*/

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

/*
   حفظ الصورة الحالية في State
   وعرضها داخل المحادثة.
*/

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


        /*
           الانتقال إلى المحادثة
           حتى يرى المستخدم الصورة.
        */

        openSection(
            "chat"
        );


        /*
           عرض الصورة داخل المحادثة
        */

        addImageMessageToUI(

            imageData,

            file.name

        );


        showNotification(

            `تم تجهيز الصورة: ${file.name}`,

            "📷"

        );


        /*
           وضع المؤشر في خانة السؤال
        */

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


    /*
       تفريغ حقول الصور
       حتى يمكن اختيار نفس الصورة
       مرة أخرى إذا أراد المستخدم.
    */

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

/*
   إرسال الصورة + سؤال المستخدم
   إلى Cloudflare Worker Vision.
*/

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


    /*
       معرفة هل هناك صورة معلقة
    */

    const hasImage =
        !!state.selectedImageData;


    /*
       إذا لم يوجد نص ولا صورة
    */

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


    /*
       إذا كانت هناك صورة
       ولم يكتب المستخدم سؤالًا
       نستخدم سؤالًا افتراضيًا.
    */

    if (
        hasImage &&
        !text
    ) {

        text =
            "حلل هذه الصورة بالتفصيل واشرح لي ما الذي يظهر فيها.";

    }


    /*
       إضافة سؤال المستخدم
       فقط إذا كتب نصًا.
    */

    if (text) {

        addMessageToUI(

            "user",

            text

        );

    }


    /*
       رسالة التحميل
    */

    const loadingMessage =
        addMessageToUI(

            "assistant",

            hasImage
                ? "🖼️ جاري تحليل الصورة..."
                : "🤖 جاري التفكير...",

            false

        );


    /*
       حفظ نسخة من الصورة
       قبل تنفيذ الطلب.
    */

    const imageDataToSend =
        state.selectedImageData;


    /*
       اسم الصورة الحالي
    */

    const imageNameToSend =
        state.selectedImageName;


    try {

        let answer;


        /*
           =========================================
           VISION
           =========================================
        */

        if (hasImage) {

            answer =
                await askVision(

                    text,

                    imageDataToSend

                );

        }

        /*
           =========================================
           CHAT
           =========================================
        */

        else {

            /*
               طلب الرد من Worker
            */

            answer =
                await askAI(
                    text
                );

        }


        /*
           تحديث رسالة التحميل
        */

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


        /*
           حفظ رد AI محليًا
        */

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


        /*
           =========================================
           حفظ المحادثة في Firebase
           =========================================

           بالنسبة للـVision:
           نحفظ السؤال والرد فقط.
           الصورة نفسها لا يتم تخزينها في Firestore
           هنا حتى لا نضع Data URL كبيرة داخل قاعدة
           البيانات.
        */

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


        /*
           بعد انتهاء التحليل
           نلغي الصورة المعلقة.
        */

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


                /*
                   لو توجد صورة مختارة
                   ننتقل للمحادثة ونرسلها
                   مع السؤال.
                */

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


                    /*
                       لو توجد صورة مختارة
                    */

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


                    /*
                       التأكد أن الملف صورة
                    */

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


                    /*
                       تجهيز الصورة
                    */

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
   INITIALIZE
   ========================================================= */

function init() {

    console.log(
        "Ahmed AI initialized successfully."
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
   AHMED AI INTRODUCTION
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
