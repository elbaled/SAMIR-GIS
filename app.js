/* =========================================================
   GEO AI - Main Application
   ========================================================= */

"use strict";


/* =========================================================
   CONFIG
   ========================================================= */

const AI_API_URL =
    "https://shy-reciahmed-ai-apipe-7386.123456789012345678o01234567898.workers.dev/api/chat";


const AI_VISION_API_URL =
    "https://shy-reciahmed-ai-apipe-7386.123456789012345678o01234567898.workers.dev/api/vision";


/* =========================================================
   FILE PARSING CONFIG
   ========================================================= */

const MAX_FILE_TEXT =
    60000;


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

                currentUser =
                    user || null;

                firebaseReady =
                    !!currentUser;

                if (currentUser) {

                    console.log(
                        "GEO AI Firebase user:",
                        currentUser.email
                    );

                } else {

                    console.log(
                        "GEO AI: no authenticated user."
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

const $ = (id) =>
    document.getElementById(id);


function showNotification(
    message,
    icon = "✓"
) {

    const notification =
        $("notification");

    const text =
        $("notificationText");

    const notificationIcon =
        $("notificationIcon");


    if (!notification) return;


    if (text) {

        text.textContent =
            message;

    }


    if (notificationIcon) {

        notificationIcon.textContent =
            icon;

    }


    notification.classList.add(
        "show"
    );


    clearTimeout(
        window.notificationTimer
    );


    window.notificationTimer =
        setTimeout(
            () => {

                notification.classList.remove(
                    "show"
                );

            },
            2500
        );

}


function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(text ?? "");

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
   FILE HELPERS
   ========================================================= */

function getFileExtension(fileName) {

    return String(fileName || "")
        .split(".")
        .pop()
        .toLowerCase();

}


function truncateFileText(text) {

    text =
        String(text || "")
            .replace(/\u0000/g, "")
            .trim();


    if (
        text.length <=
        MAX_FILE_TEXT
    ) {

        return text;

    }


    return (

        text.slice(
            0,
            MAX_FILE_TEXT
        )

        +

        "\n\n[تم اختصار جزء من الملف بسبب كبر حجمه.]"

    );

}


/* =========================================================
   LOAD EXTERNAL SCRIPT
   ========================================================= */

function loadExternalScript(
    src,
    globalName
) {

    return new Promise(
        (resolve, reject) => {

            if (
                globalName &&
                window[globalName]
            ) {

                resolve(
                    window[globalName]
                );

                return;

            }


            const existing =
                document.querySelector(
                    `script[src="${src}"]`
                );


            if (existing) {

                existing.addEventListener(
                    "load",
                    () => {

                        resolve(
                            globalName
                                ? window[globalName]
                                : true
                        );

                    }
                );


                existing.addEventListener(
                    "error",
                    () => {

                        reject(
                            new Error(
                                "تعذر تحميل مكتبة قراءة الملفات."
                            )
                        );

                    }
                );


                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                src;

            script.async =
                true;


            script.onload =
                () => {

                    if (
                        globalName &&
                        !window[globalName]
                    ) {

                        reject(
                            new Error(
                                "تم تحميل المكتبة ولكن لم يتم العثور عليها."
                            )
                        );

                        return;

                    }


                    resolve(
                        globalName
                            ? window[globalName]
                            : true
                    );

                };


            script.onerror =
                () => {

                    reject(
                        new Error(
                            "تعذر تحميل مكتبة قراءة الملفات."
                        )
                    );

                };


            document.head.appendChild(
                script
            );

        }
    );

}


/* =========================================================
   READ TXT
   ========================================================= */

function readTXTFile(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => {

                    try {

                        const text =
                            String(
                                reader.result ||
                                ""
                            );


                        resolve(
                            truncateFileText(
                                text
                            )
                        );

                    } catch (error) {

                        reject(error);

                    }

                };


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "تعذر قراءة ملف TXT."
                        )
                    );

                };


            reader.readAsText(
                file,
                "UTF-8"
            );

        }
    );

}


/* =========================================================
   READ DOCX
   ========================================================= */

async function readDOCXFile(file) {

    await loadExternalScript(
        "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js",
        "mammoth"
    );


    if (
        !window.mammoth
    ) {

        throw new Error(
            "مكتبة قراءة DOCX غير متاحة."
        );

    }


    const arrayBuffer =
        await file.arrayBuffer();


    const result =
        await window.mammoth.extractRawText({
            arrayBuffer:
                arrayBuffer
        });


    const text =
        result?.value || "";


    if (!text.trim()) {

        throw new Error(
            "لم يتم العثور على نص قابل للقراءة داخل ملف DOCX."
        );

    }


    return truncateFileText(
        text
    );

}


/* =========================================================
   READ PDF
   ========================================================= */

async function readPDFFile(file) {

    const pdfjsLib =
        await import(
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs"
        );


    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";


    const arrayBuffer =
        await file.arrayBuffer();


    const pdf =
        await pdfjsLib.getDocument({
            data:
                arrayBuffer
        }).promise;


    let fullText =
        "";


    for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
    ) {

        const page =
            await pdf.getPage(
                pageNumber
            );


        const textContent =
            await page.getTextContent();


        const pageText =
            textContent.items
                .map(
                    item =>
                        item.str || ""
                )
                .join(" ");


        fullText +=
            `\n\n--- الصفحة ${pageNumber} ---\n\n`;


        fullText +=
            pageText;


        /*
           لا نستمر في استخراج كمية ضخمة
           أكبر من الحد الذي سيرسله الموقع.
        */

        if (
            fullText.length >=
            MAX_FILE_TEXT
        ) {

            break;

        }

    }


    fullText =
        fullText.trim();


    if (!fullText) {

        throw new Error(
            "لم يتم العثور على نص داخل ملف PDF. إذا كان الملف عبارة عن صور ممسوحة ضوئياً، نحتاج OCR في مرحلة لاحقة."
        );

    }


    return truncateFileText(
        fullText
    );

}


/* =========================================================
   READ ANY SUPPORTED FILE
   ========================================================= */

async function extractFileText(file) {

    if (!file) {

        throw new Error(
            "لم يتم اختيار ملف."
        );

    }


    const extension =
        getFileExtension(
            file.name
        );


    /*
       TXT
    */

    if (
        extension === "txt"
    ) {

        return await readTXTFile(
            file
        );

    }


    /*
       PDF
    */

    if (
        extension === "pdf"
    ) {

        return await readPDFFile(
            file
        );

    }


    /*
       DOCX
    */

    if (
        extension === "docx"
    ) {

        return await readDOCXFile(
            file
        );

    }


    /*
       DOC القديم
    */

    if (
        extension === "doc"
    ) {

        throw new Error(
            "ملفات DOC القديمة غير مدعومة حالياً. استخدم DOCX أو PDF أو TXT."
        );

    }


    throw new Error(
        "نوع الملف غير مدعوم. استخدم PDF أو DOCX أو TXT."
    );

}


/* =========================================================
   APP STATE
   ========================================================= */

let state = {

    currentSection:
        "home",


    darkMode:
        localStorage.getItem(
            "geo_ai_dark"
        ) === "true" ||
        localStorage.getItem(
            "ahmed_ai_dark"
        ) === "true",


    saveChats:
        localStorage.getItem(
            "geo_ai_save_chats"
        ) !== "false" &&
        localStorage.getItem(
            "ahmed_ai_save_chats"
        ) !== "false",


    currentChat:
        [],


    selectedLanguage:
        localStorage.getItem(
            "geo_ai_language"
        ) ||
        localStorage.getItem(
            "ahmed_ai_language"
        ) ||
        "ar",


    selectedCodingLanguage:
        "Python",


    /*
       الملف الحالي
    */

    selectedFile:
        null,


    /*
       النص المستخرج من الملف
    */

    selectedFileText:
        "",


    selectedFileName:
        "",


    selectedFileType:
        "",


    /*
       الصورة الحالية
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
        title:
            "الرئيسية",

        subtitle:
            "مساعدك الذكي للمذاكرة والعمل"
    },


    chat: {
        title:
            "AI Chat",

        subtitle:
            "تحدث مع GEO AI"
    },


    study: {
        title:
            "المذاكرة",

        subtitle:
            "مدرسك الشخصي"
    },


    gis: {
        title:
            "مساعد GIS",

        subtitle:
            "GIS • Remote Sensing • Surveying"
    },


    coding: {
        title:
            "البرمجة",

        subtitle:
            "Python • ArcPy • JavaScript • SQL"
    },


    files: {
        title:
            "ملفاتي",

        subtitle:
            "إدارة ملفات المذاكرة"
    },


    tests: {
        title:
            "الاختبارات",

        subtitle:
            "اختبر معلوماتك"
    },


    settings: {
        title:
            "الإعدادات",

        subtitle:
            "إعدادات GEO AI"
    }

};


/* =========================================================
   NAVIGATION
   ========================================================= */

function openSection(
    sectionName
) {

    const section =
        $(sectionName + "Section");


    if (!section) return;


    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(
            (item) => {

                item.classList.remove(
                    "active"
                );

            }
        );


    section.classList.add(
        "active"
    );


    document
        .querySelectorAll(
            ".menu-item[data-section]"
        )
        .forEach(
            (item) => {

                item.classList.toggle(
                    "active",
                    item.dataset.section ===
                    sectionName
                );

            }
        );


    state.currentSection =
        sectionName;


    const info =
        pageInfo[
            sectionName
        ];


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
        top:
            0,
        behavior:
            "smooth"
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
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        openSection(
                            button.dataset.section
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".quick-card[data-action]"
        )
        .forEach(
            (card) => {

                card.addEventListener(
                    "click",
                    () => {

                        openSection(
                            card.dataset.action
                        );

                    }
                );

            }
        );


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
                    "geo_ai_dark",
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
                    "geo_ai_dark",
                    state.darkMode
                );


                applyTheme();

            }
        );

    }

}


/* =========================================================
   CHAT STORAGE
   ========================================================= */

function saveCurrentChat() {

    if (!state.saveChats) return;


    localStorage.setItem(
        "geo_ai_current_chat",
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
                "geo_ai_current_chat"
            ) ||
            localStorage.getItem(
                "ahmed_ai_current_chat"
            );


        if (!saved) return;


        const messages =
            JSON.parse(
                saved
            );


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


    if (
        !state.currentChat.length
    ) {

        return;

    }


    container.innerHTML =
        "";


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

        return;

    }


    if (!firebaseDB) {

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


        await addDoc(
            collection(
                firebaseDB,
                "chats"
            ),
            chatData
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

    state.currentChat =
        [];


    state.selectedImage =
        null;

    state.selectedImageData =
        null;

    state.selectedImageName =
        null;


    localStorage.removeItem(
        "geo_ai_current_chat"
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
                    GEO AI
                </h2>

                <p>
                    أنا جاهز أساعدك في المذاكرة
                    وGIS والاستشعار عن بعد والمساحة
                    والبرمجة.
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
   IMAGE MESSAGE UI
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
                    max-width:100%;
                    display:flex;
                    flex-direction:column;
                    gap:8px;
                "
            >

                <img
                    src="${imageData}"
                    alt="${escapeHTML(imageName)}"
                    style="
                        max-width:100%;
                        max-height:420px;
                        object-fit:contain;
                        border-radius:14px;
                        display:block;
                    "
                >

                <small
                    style="
                        opacity:0.75;
                        display:block;
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
   IMAGE PREPARATION
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


            reader.onload =
                () => {

                    if (
                        typeof reader.result !==
                        "string"
                    ) {

                        reject(
                            new Error(
                                "تعذر قراءة الصورة."
                            )
                        );

                        return;

                    }


                    resolve(
                        reader.result
                    );

                };


            reader.onerror =
                () => {

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


        $("chatInput")?.focus();


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

async function askAI(
    message,
    options = {}
) {

    const fileText =
        options.fileText ||
        state.selectedFileText ||
        "";


    const fileName =
        options.fileName ||
        state.selectedFileName ||
        "";


    const fileType =
        options.fileType ||
        state.selectedFileType ||
        "";


    /*
       إرسال آخر رسائل المحادثة
       حتى يفهم AI السياق.
    */

    const context =
        state.currentChat
            .slice(-20)
            .map(
                item => ({
                    role:
                        item.role === "assistant"
                            ? "assistant"
                            : "user",

                    content:
                        String(
                            item.content || ""
                        ).slice(
                            0,
                            12000
                        )
                })
            );


    const body = {

        message:
            String(
                message || ""
            ).trim(),

        context:

            context.length
                ? context
                : undefined,

        fileText:
            fileText
                ? truncateFileText(
                    fileText
                )
                : undefined,

        fileName:
            fileName ||
            undefined,

        fileType:
            fileType ||
            undefined

    };


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
                    JSON.stringify(
                        body
                    )
            }
        );


    let data;


    try {

        data =
            await response.json();

    } catch {

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

    } catch {

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

async function sendChatMessage(
    text,
    options = {}
) {

    text =
        String(
            text || ""
        ).trim();


    const hasImage =
        !!state.selectedImageData;


    const hasFile =
        !!state.selectedFileText;


    /*
       لا توجد رسالة ولا صورة
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

        input.value =
            "";

    }


    /*
       السؤال الافتراضي للصورة
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
                : hasFile
                    ? "📚 جاري قراءة المحاضرة والتفكير..."
                    : "🤖 جاري التفكير...",

            false
        );


    const imageDataToSend =
        state.selectedImageData;


    const imageNameToSend =
        state.selectedImageName;


    const fileTextToSend =
        options.fileText ||
        state.selectedFileText ||
        "";


    const fileNameToSend =
        options.fileName ||
        state.selectedFileName ||
        "";


    const fileTypeToSend =
        options.fileType ||
        state.selectedFileType ||
        "";


    try {

        let answer;


        /*
           ============================
           VISION
           ============================
        */

        if (hasImage) {

            answer =
                await askVision(
                    text,
                    imageDataToSend
                );

        }


        /*
           ============================
           FILE + CHAT
           ============================
        */

        else {

            answer =
                await askAI(
                    text,
                    {
                        fileText:
                            fileTextToSend,

                        fileName:
                            fileNameToSend,

                        fileType:
                            fileTypeToSend
                    }
                );

        }


        const finalAnswer =
            answer ||
            (
                hasImage
                    ? "لم يصل تحليل للصورة."
                    : "لم تصل إجابة."
            );


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
                    finalAnswer;

            }

        }


        /*
           حفظ الرد محلياً
        */

        state.currentChat.push({

            role:
                "assistant",

            content:
                finalAnswer

        });


        saveCurrentChat();


        scrollChatToBottom();


        /*
           حفظ Firebase
        */

        await saveChatToFirebase(

            hasImage
                ? (
                    `📷 ${
                        imageNameToSend ||
                        "صورة"
                    }\n\n${text}`
                )
                : hasFile
                    ? (
                        `📄 ${
                            fileNameToSend ||
                            "ملف"
                        }\n\n${text}`
                    )
                    : text,

            finalAnswer

        );


        /*
           مسح الصورة بعد التحليل
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
                    event.key === "Enter" &&
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
                    event.key === "Enter" &&
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
        .forEach(
            (button) => {

                button.onclick =
                    () => {

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

            }
        );

}


/* =========================================================
   GIS
   ========================================================= */

function setupGIS() {

    document
        .querySelectorAll(
            ".subject-card"
        )
        .forEach(
            (card) => {

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

            }
        );


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
        .forEach(
            (card) => {

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
                            .forEach(
                                (item) => {

                                    item.classList.remove(
                                        "selected"
                                    );

                                }
                            );


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

            }
        );


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
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.studyAction;


                        const prompts = {

                            explain:
                                "اشرحلي محتوى المحاضرة بالتفصيل وبطريقة بسيطة، ثم أعطني أمثلة وأسئلة للتأكد من الفهم.",

                            summary:
                                "لخص لي محتوى المحاضرة في نقاط منظمة ومهمة للمذاكرة والامتحان.",

                            questions:
                                "استخرج من محتوى المحاضرة أسئلة تدريبية متنوعة مع الإجابات.",

                            exam:
                                "أنشئ اختباراً من محتوى المحاضرة، واسألني سؤالاً واحداً في كل مرة وانتظر إجابتي قبل السؤال التالي."

                        };


                        openSection(
                            "chat"
                        );


                        const input =
                            $("chatInput");


                        if (input) {

                            input.value =
                                prompts[action] ||
                                "ساعدني في المذاكرة من محتوى المحاضرة.";


                            input.focus();

                        }


                        showNotification(
                            state.selectedFileText
                                ? `سيتم استخدام الملف: ${state.selectedFileName}`
                                : "ارفع محاضرة أولاً لاستخدام محتواها",
                            state.selectedFileText
                                ? "📚"
                                : "!"
                        );

                    }
                );

            }
        );

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
                async () => {

                    const file =
                        input.files?.[0];


                    if (!file) return;


                    await handleSelectedFile(
                        file
                    );

                }
            );

        }
    );

}


/* =========================================================
   HANDLE SELECTED FILE
   ========================================================= */

async function handleSelectedFile(
    file
) {

    try {

        state.selectedFile =
            file;

        state.selectedFileText =
            "";

        state.selectedFileName =
            file.name;

        state.selectedFileType =
            file.type ||
            getFileExtension(
                file.name
            );


        addFileToList(
            file,
            "⏳ جاري القراءة..."
        );


        showNotification(
            `جاري قراءة ${file.name}...`,
            "📚"
        );


        const text =
            await extractFileText(
                file
            );


        if (!text.trim()) {

            throw new Error(
                "لم يتم استخراج نص من الملف."
            );

        }


        state.selectedFileText =
            text;


        /*
           ننتقل للمحادثة
           لو الملف تم اختياره من
           Chat أو Home أو Study.
        */

        showNotification(
            `تمت قراءة الملف بنجاح: ${file.name}`,
            "✓"
        );


        /*
           تحديث حالة الملف في القائمة
        */

        updateLatestFileStatus(
            "✓ تمت القراءة"
        );


        /*
           الانتقال تلقائياً إلى Chat
        */

        openSection(
            "chat"
        );


        /*
           إظهار رسالة للمستخدم
        */

        addMessageToUI(
            "assistant",
            `📚 تم تحميل الملف "${file.name}" بنجاح.\n\nأقدر الآن أساعدك في:\n- تلخيصه\n- شرحه\n- استخراج التعريفات\n- إنشاء أسئلة\n- إنشاء اختبار\n- الإجابة عن أسئلتك من محتواه`
        );


        /*
           تجهيز مربع الكتابة
        */

        const input =
            $("chatInput");


        if (input) {

            input.placeholder =
                `اسأل GEO AI عن "${file.name}"...`;

            input.focus();

        }


    } catch (error) {

        console.error(
            "File reading error:",
            error
        );


        state.selectedFileText =
            "";


        updateLatestFileStatus(
            "❌ فشلت القراءة"
        );


        showNotification(
            error.message ||
            "تعذر قراءة الملف.",
            "!"
        );

    }

}


/* =========================================================
   ADD FILE TO LIST
   ========================================================= */

function addFileToList(
    file,
    status = "📄 جاهز"
) {

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


    item.dataset.fileName =
        file.name;


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
                •
                ${escapeHTML(status)}
            </small>

        </div>

    `;


    list.appendChild(
        item
    );

}


/* =========================================================
   UPDATE LATEST FILE STATUS
   ========================================================= */

function updateLatestFileStatus(
    status
) {

    const list =
        $("filesList");


    if (!list) return;


    const items =
        list.querySelectorAll(
            ".file-item"
        );


    if (!items.length) return;


    const last =
        items[
            items.length - 1
        ];


    const small =
        last.querySelector(
            "small"
        );


    if (!small) return;


    const fileName =
        last.dataset.fileName ||
        "";


    const file =
        state.selectedFile;


    small.textContent =
        `${file ? formatFileSize(file.size) : ""} • ${status}`;

}


/* =========================================================
   FORMAT FILE SIZE
   ========================================================= */

function formatFileSize(
    bytes
) {

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
        Math.min(
            Math.floor(
                Math.log(bytes) /
                Math.log(1024)
            ),
            units.length - 1
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
                    ${escapeHTML(subject)}...

                </div>

            `;


            try {

                let prompt;


                if (
                    state.selectedFileText
                ) {

                    prompt =

                        `أنشئ اختبارًا من محتوى الملف المرفوع.\n\n` +

                        `اسم الملف: ${state.selectedFileName}\n` +

                        `عدد الأسئلة: ${count}\n\n` +

                        `المطلوب:\n` +

                        `اجعل الأسئلة مناسبة لطالب جامعي، ` +

                        `واستخدم محتوى الملف أساساً للأسئلة. ` +

                        `اكتب الاختيارات والإجابة الصحيحة.\n\n` +

                        `إذا لم تكن المعلومة موجودة في النص المرسل، لا تخترعها.`;

                } else {

                    prompt =

                        `أنشئ اختبارًا تعليميًا في مادة ${subject}.\n` +

                        `عدد الأسئلة: ${count}.\n` +

                        `اجعل الأسئلة مناسبة لطالب جامعي، ` +

                        `واكتب الاختيارات والإجابة الصحيحة.`;

                }


                const answer =
                    await askAI(
                        prompt
                    );


                container.innerHTML = `

                    <div class="test-result">

                        <h2>
                            📝 اختبار
                            ${escapeHTML(subject)}
                        </h2>

                        <div class="test-content">
                            ${escapeHTML(answer)}
                        </div>

                    </div>

                `;

            } catch (error) {

                container.innerHTML = `

                    <div class="test-error">

                        ❌
                        ${escapeHTML(error.message)}

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
                    "geo_ai_save_chats",
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
                    "geo_ai_language",
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
   KEYBOARD
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
        "GEO AI initialized successfully."
    );


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
