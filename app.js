/* =========================================================
   GEO AI - Main Application
   Complete Fixed Version
   Compatible with latest index.html
   ========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const AI_API_URL =
    "https://shy-reciahmed-ai-apipe-7386.123456789012345678o01234567898.workers.dev/api/chat";

const VISION_API_URL =
    "https://shy-reciahmed-ai-apipe-7386.123456789012345678o01234567898.workers.dev/api/vision";


/* =========================================================
   FIREBASE
========================================================= */

let firebaseAuth = null;
let firebaseDb = null;
let firebaseModules = null;

let currentFirebaseUser = null;
let currentUserRole = "user";


async function initializeFirebase() {

    try {

        const firebaseAppModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js"
            );

        const firebaseAuthModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js"
            );

        const firebaseFirestoreModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
            );


        firebaseModules = {

            ...firebaseAppModule,
            ...firebaseAuthModule,
            ...firebaseFirestoreModule

        };


        const firebaseConfig = {

            apiKey:
                "AIzaSyDL9xUDi2pm66m5Ow85c0feZs4btaoPgEo",

            authDomain:
                "ahmed-c5cdf.firebaseapp.com",

            projectId:
                "ahmed-c5cdf",

            storageBucket:
                "ahmed-c5cdf.firebasestorage.app",

            messagingSenderId:
                "4671644989",

            appId:
                "1:4671644989:web:886b792cae0d95a58c9154",

            measurementId:
                "G-ST0VNS98E7"

        };


        const app =
            firebaseAppModule.getApps().length
                ? firebaseAppModule.getApp()
                : firebaseAppModule.initializeApp(
                    firebaseConfig
                );


        firebaseAuth =
            firebaseAuthModule.getAuth(
                app
            );


        firebaseDb =
            firebaseFirestoreModule.getFirestore(
                app
            );


        currentFirebaseUser =
            firebaseAuth.currentUser || null;


        return true;

    } catch (error) {

        console.error(
            "Firebase initialization error:",
            error
        );

        return false;

    }

}


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentSection = "home";

let selectedCodingLanguage = "Python";

let selectedCourseCategory = "all";

let editingCourseId = null;

let coursesCache = [];

let currentChatImage = null;
let currentChatFile = null;

let currentHomeImage = null;
let currentHomeFile = null;

let currentStudyFile = null;
let currentMainFile = null;

let isSendingMessage = false;
let isGeneratingCode = false;
let isGeneratingTest = false;

let currentTestData = null;
let currentTestAnswers = {};

let currentConversationId = null;


/* =========================================================
   PAGE INFORMATION
========================================================= */

const pageInfo = {

    home: {
        title: "الرئيسية",
        subtitle:
            "مساعدك الذكي للمذاكرة والعمل"
    },

    chat: {
        title: "AI Chat",
        subtitle:
            "تحدث مع GEO AI في أي موضوع"
    },

    study: {
        title: "المذاكرة",
        subtitle:
            "شرح وتلخيص وأسئلة واختبارات"
    },

    gis: {
        title: "مساعد GIS",
        subtitle:
            "GIS • Remote Sensing • Surveying"
    },

    coding: {
        title: "مساعد البرمجة",
        subtitle:
            "Python • ArcPy • JavaScript • SQL"
    },

    files: {
        title: "ملفاتي",
        subtitle:
            "ملفاتك المستخدمة في المذاكرة"
    },

    tests: {
        title: "الاختبارات",
        subtitle:
            "اختبر معلوماتك وطوّر مستواك"
    },

    courses: {
        title: "الكورسات والدورات",
        subtitle:
            "مساحة • GIS • استشعار عن بعد • برمجة"
    },

    settings: {
        title: "الإعدادات",
        subtitle:
            "تحكم في إعدادات GEO AI"
    }

};


/* =========================================================
   DOM HELPERS
========================================================= */

function $(selector) {

    return document.querySelector(
        selector
    );

}


function $$(selector) {

    return document.querySelectorAll(
        selector
    );

}


function getElement(id) {

    return document.getElementById(
        id
    );

}


/* =========================================================
   NOTIFICATION
========================================================= */

function showNotification(
    message,
    type = "success"
) {

    const notification =
        getElement(
            "notification"
        );

    const notificationText =
        getElement(
            "notificationText"
        );

    const notificationIcon =
        getElement(
            "notificationIcon"
        );


    if (!notification) {
        return;
    }


    if (notificationText) {

        notificationText.textContent =
            message;

    }


    if (notificationIcon) {

        if (type === "error") {

            notificationIcon.textContent =
                "✕";

        } else if (type === "warning") {

            notificationIcon.textContent =
                "!";

        } else {

            notificationIcon.textContent =
                "✓";

        }

    }


    notification.classList.remove(
        "show",
        "error",
        "warning"
    );


    if (type === "error") {

        notification.classList.add(
            "error"
        );

    }


    if (type === "warning") {

        notification.classList.add(
            "warning"
        );

    }


    void notification.offsetWidth;


    notification.classList.add(
        "show"
    );


    clearTimeout(
        window.geoNotificationTimer
    );


    window.geoNotificationTimer =
        setTimeout(
            () => {

                notification.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}


/* =========================================================
   URL VALIDATION
========================================================= */

function isValidHttpUrl(
    value
) {

    try {

        const url =
            new URL(
                value
            );


        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );

    } catch (error) {

        return false;

    }

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }


    try {

        let date;


        if (
            value &&
            typeof value.toDate ===
                "function"
        ) {

            date =
                value.toDate();

        } else if (
            value instanceof Date
        ) {

            date =
                value;

        } else {

            date =
                new Date(
                    value
                );

        }


        if (
            !date ||
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        return date.toLocaleDateString(
            "ar-EG",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );

    } catch (error) {

        return "";

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function navigateTo(
    sectionName
) {

    if (
        !pageInfo[
            sectionName
        ]
    ) {

        return;

    }


    currentSection =
        sectionName;


    const sections =
        $$(".page-section");


    sections.forEach(
        section => {

            section.classList.remove(
                "active"
            );

        }
    );


    const targetSection =
        getElement(
            sectionName +
            "Section"
        );


    if (targetSection) {

        targetSection.classList.add(
            "active"
        );

    }


    const menuItems =
        $$(".menu-item[data-section]");


    menuItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.section ===
                    sectionName
            );

        }
    );


    const pageTitle =
        getElement(
            "pageTitle"
        );


    const pageSubtitle =
        getElement(
            "pageSubtitle"
        );


    if (pageTitle) {

        pageTitle.textContent =
            pageInfo[
                sectionName
            ].title;

    }


    if (pageSubtitle) {

        pageSubtitle.textContent =
            pageInfo[
                sectionName
            ].subtitle;

    }


    closeMobileSidebar();


    if (
        sectionName ===
        "courses"
    ) {

        loadCourses();

    }


    if (
        sectionName ===
        "files"
    ) {

        loadLocalFiles();

    }


    if (
        sectionName ===
        "chat"
    ) {

        prepareChatForNavigation();

    }

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupNavigation() {

    const menuItems =
        $$(".menu-item[data-section]");


    menuItems.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    navigateTo(
                        item.dataset.section
                    );

                }
            );

        }
    );


    const quickCards =
        $$(".quick-card[data-action]");


    quickCards.forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    navigateTo(
                        card.dataset.action
                    );

                }
            );

        }
    );


    const mobileMenuBtn =
        getElement(
            "mobileMenuBtn"
        );


    if (mobileMenuBtn) {

        mobileMenuBtn.addEventListener(
            "click",
            toggleMobileSidebar
        );

    }


    document.addEventListener(
        "click",
        event => {

            const sidebar =
                getElement(
                    "sidebar"
                );


            if (!sidebar) {
                return;
            }


            if (
                window.innerWidth > 900
            ) {

                return;

            }


            if (
                sidebar.classList.contains(
                    "open"
                ) &&
                !sidebar.contains(
                    event.target
                ) &&
                !event.target.closest(
                    "#mobileMenuBtn"
                )
            ) {

                closeMobileSidebar();

            }

        }
    );

}


function toggleMobileSidebar() {

    const sidebar =
        getElement(
            "sidebar"
        );


    if (!sidebar) {
        return;
    }


    sidebar.classList.toggle(
        "open"
    );

}


function closeMobileSidebar() {

    const sidebar =
        getElement(
            "sidebar"
        );


    if (!sidebar) {
        return;
    }


    sidebar.classList.remove(
        "open"
    );

}


/* =========================================================
   THEME
========================================================= */

function setupTheme() {

    const themeBtn =
        getElement(
            "themeBtn"
        );

    const darkModeToggle =
        getElement(
            "darkModeToggle"
        );


    const savedTheme =
        localStorage.getItem(
            "geo_ai_theme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

    }


    updateThemeButton();


    if (themeBtn) {

        themeBtn.addEventListener(
            "click",
            toggleTheme
        );

    }


    if (darkModeToggle) {

        darkModeToggle.checked =
            document.body.classList.contains(
                "dark-mode"
            );


        darkModeToggle.addEventListener(
            "change",
            () => {

                setTheme(
                    darkModeToggle.checked
                        ? "dark"
                        : "light"
                );

            }
        );

    }

}


function toggleTheme() {

    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    setTheme(
        isDark
            ? "light"
            : "dark"
    );

}


function setTheme(
    theme
) {

    const isDark =
        theme === "dark";


    document.body.classList.toggle(
        "dark-mode",
        isDark
    );


    localStorage.setItem(
        "geo_ai_theme",
        isDark
            ? "dark"
            : "light"
    );


    const darkModeToggle =
        getElement(
            "darkModeToggle"
        );


    if (darkModeToggle) {

        darkModeToggle.checked =
            isDark;

    }


    updateThemeButton();

}


function updateThemeButton() {

    const themeBtn =
        getElement(
            "themeBtn"
        );


    if (!themeBtn) {
        return;
    }


    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    themeBtn.textContent =
        isDark
            ? "☀️"
            : "🌙";


    themeBtn.title =
        isDark
            ? "الوضع الفاتح"
            : "الوضع الليلي";

}


/* =========================================================
   NEW CHAT
========================================================= */

function setupNewChat() {

    const newChatBtn =
        getElement(
            "newChatBtn"
        );


    if (newChatBtn) {

        newChatBtn.addEventListener(
            "click",
            newChat
        );

    }

}


function newChat() {

    currentChatImage =
        null;

    currentChatFile =
        null;

    currentHomeImage =
        null;

    currentHomeFile =
        null;


    currentConversationId =
        createConversationId();


    const inputs = [

        "chatInput",
        "homeChatInput"

    ];


    inputs.forEach(
        id => {

            const input =
                getElement(id);


            if (input) {

                input.value =
                    "";

            }

        }
    );


    const fileInputs = [

        "chatImageInput",
        "chatFileInput",
        "homeImageInput",
        "homeFileInput"

    ];


    fileInputs.forEach(
        id => {

            const input =
                getElement(id);


            if (input) {

                input.value =
                    "";

            }

        }
    );


    resetChatMessages();


    localStorage.removeItem(
        "geo_ai_current_chat"
    );


    navigateTo(
        "chat"
    );


    showNotification(
        "تم إنشاء محادثة جديدة"
    );

}


function createConversationId() {

    return (
        "chat_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(
                2,
                9
            )
    );

}


function resetChatMessages() {

    const chatMessages =
        getElement(
            "chatMessages"
        );


    if (!chatMessages) {
        return;
    }


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
                وGIS والبرمجة.
            </p>

            <div class="suggestions">

                <button type="button">
                    اشرحلي ArcGIS Pro
                </button>

                <button type="button">
                    علمني Python
                </button>

                <button type="button">
                    اشرحلي Remote Sensing
                </button>

            </div>

        </div>

    `;


    setupSuggestionButtons();

}


/* =========================================================
   SUGGESTIONS
========================================================= */

function setupSuggestionButtons() {

    const suggestions =
        $$(".suggestions button");


    suggestions.forEach(
        button => {

            if (
                button.dataset.geoBound ===
                "true"
            ) {

                return;

            }


            button.dataset.geoBound =
                "true";


            button.addEventListener(
                "click",
                () => {

                    const chatInput =
                        getElement(
                            "chatInput"
                        );


                    if (chatInput) {

                        chatInput.value =
                            button.textContent.trim();


                        chatInput.focus();

                    }

                }
            );

        }
    );

}


/* =========================================================
   TEXTAREA ENTER
========================================================= */

function setupTextareaEnter() {

    const textareas =
        $$(
            "#chatInput, #homeChatInput, #gisInput, #codeInput"
        );


    textareas.forEach(
        textarea => {

            textarea.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();


                        if (
                            textarea.id ===
                            "chatInput"
                        ) {

                            sendChatMessage();

                        } else if (
                            textarea.id ===
                            "homeChatInput"
                        ) {

                            sendHomeMessage();

                        } else if (
                            textarea.id ===
                            "gisInput"
                        ) {

                            sendGISMessage();

                        } else if (
                            textarea.id ===
                            "codeInput"
                        ) {

                            generateCode();

                        }

                    }

                }
            );

        }
    );

}


/* =========================================================
   FILE READER
========================================================= */

async function readTextFile(
    file
) {

    if (!file) {
        return "";
    }


    const name =
        file.name.toLowerCase();


    if (
        name.endsWith(".txt")
    ) {

        return await file.text();

    }


    return "";

}


/* =========================================================
   AI REQUEST
========================================================= */

async function callAI(
    message,
    options = {}
) {

    const payload = {

        message:
            message || "",

        prompt:
            message || "",

        conversationId:
            currentConversationId,

        mode:
            options.mode ||
            "general",

        language:
            localStorage.getItem(
                "geo_ai_language"
            ) ||
            "ar",

        webSearch:
            Boolean(
                options.webSearch ??
                isWebSearchEnabled()
            ),

        context:
            options.context ||
            "",

        fileName:
            options.fileName ||
            "",

        fileContent:
            options.fileContent ||
            "",

        image:
            options.image ||
            null

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
                        payload
                    )

            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        throw new Error(
            errorText ||
            `HTTP ${response.status}`
        );

    }


    const data =
        await response.json();


    return extractAIText(
        data
    );

}


/* =========================================================
   AI RESPONSE EXTRACTION
========================================================= */

function extractAIText(
    data
) {

    if (!data) {
        return "";
    }


    if (
        typeof data ===
        "string"
    ) {

        return data;

    }


    const possibleFields = [

        data.answer,
        data.response,
        data.message,
        data.reply,
        data.text,
        data.content,
        data.result,
        data.output

    ];


    for (
        const value of
        possibleFields
    ) {

        if (
            typeof value ===
                "string" &&
            value.trim()
        ) {

            return value;

        }

    }


    if (
        data.choices &&
        Array.isArray(
            data.choices
        ) &&
        data.choices.length
    ) {

        const choice =
            data.choices[0];


        if (
            choice.message &&
            typeof choice.message.content ===
                "string"
        ) {

            return choice.message.content;

        }


        if (
            typeof choice.text ===
                "string"
        ) {

            return choice.text;

        }

    }


    return JSON.stringify(
        data,
        null,
        2
    );

}


/* =========================================================
   MARKDOWN / CODE FORMAT
========================================================= */

function formatAIResponse(
    text
) {

    if (!text) {
        return "";
    }


    let value =
        escapeHTML(
            text
        );


    value =
        value.replace(
            /```([a-zA-Z0-9_+#.-]*)\n([\s\S]*?)```/g,
            (
                match,
                language,
                code
            ) => {

                const lang =
                    language ||
                    "code";


                const encodedCode =
                    encodeURIComponent(
                        code
                    );


                return `

                    <div class="geo-code-block">

                        <div class="geo-code-header">

                            <span>
                                ${escapeHTML(
                                    lang
                                )}
                            </span>

                            <button
                                type="button"
                                class="geo-copy-btn"
                                data-code="${encodedCode}">

                                📋 نسخ الكود

                            </button>

                        </div>

                        <pre><code>${code}</code></pre>

                    </div>

                `;

            }
        );


    value =
        value.replace(
            /`([^`]+)`/g,
            "<code class=\"inline-code\">$1</code>"
        );


    value =
        value.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );


    value =
        value.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );


    value =
        value.replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        );


    value =
        value.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    value =
        value.replace(
            /\*(.*?)\*/g,
            "<em>$1</em>"
        );


    value =
        value.replace(
            /^[-•] (.*)$/gm,
            "<li>$1</li>"
        );


    value =
        value.replace(
            /(<li>.*?<\/li>)/gs,
            "<ul>$1</ul>"
        );


    value =
        value.replace(
            /\n/g,
            "<br>"
        );


    return value;

}


/* =========================================================
   MESSAGE BUBBLES
========================================================= */

function addUserMessage(
    message
) {

    const chatMessages =
        getElement(
            "chatMessages"
        );


    if (!chatMessages) {
        return;
    }


    removeEmptyChat();


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        "chat-message user-message";


    messageElement.innerHTML = `

        <div class="message-avatar">
            👤
        </div>

        <div class="message-content">

            <div class="message-role">
                أنت
            </div>

            <div class="message-text">
                ${escapeHTML(
                    message
                )}
            </div>

        </div>

    `;


    chatMessages.appendChild(
        messageElement
    );


    scrollChatToBottom();

}


function addAIMessage(
    message
) {

    const chatMessages =
        getElement(
            "chatMessages"
        );


    if (!chatMessages) {
        return;
    }


    removeEmptyChat();


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        "chat-message ai-message";


    messageElement.innerHTML = `

        <div class="message-avatar">
            🤖
        </div>

        <div class="message-content">

            <div class="message-role">
                GEO AI
            </div>

            <div class="message-text">
                ${formatAIResponse(
                    message
                )}
            </div>

        </div>

    `;


    chatMessages.appendChild(
        messageElement
    );


    attachCodeCopyButtons(
        messageElement
    );


    scrollChatToBottom();

}


function addLoadingMessage() {

    const chatMessages =
        getElement(
            "chatMessages"
        );


    if (!chatMessages) {
        return null;
    }


    removeEmptyChat();


    const id =
        "ai-loading-" +
        Date.now();


    const element =
        document.createElement(
            "div"
        );


    element.id =
        id;


    element.className =
        "chat-message ai-message";


    element.innerHTML = `

        <div class="message-avatar">
            🤖
        </div>

        <div class="message-content">

            <div class="message-role">
                GEO AI
            </div>

            <div class="message-text">

                <span class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>

            </div>

        </div>

    `;


    chatMessages.appendChild(
        element
    );


    scrollChatToBottom();


    return id;

}


function removeLoadingMessage(
    id
) {

    if (!id) {
        return;
    }


    const element =
        getElement(id);


    if (element) {

        element.remove();

    }

}


/* =========================================================
   CODE COPY
========================================================= */

function attachCodeCopyButtons(
    container
) {

    if (!container) {
        return;
    }


    const buttons =
        container.querySelectorAll(
            ".geo-copy-btn"
        );


    buttons.forEach(
        button => {

            if (
                button.dataset.bound ===
                "true"
            ) {

                return;

            }


            button.dataset.bound =
                "true";


            button.addEventListener(
                "click",
                async () => {

                    try {

                        const encoded =
                            button.dataset.code ||
                            "";


                        const code =
                            decodeURIComponent(
                                encoded
                            );


                        await copyText(
                            code
                        );


                        button.textContent =
                            "✓ تم النسخ";


                        setTimeout(
                            () => {

                                button.textContent =
                                    "📋 نسخ الكود";

                            },
                            1500
                        );

                    } catch (error) {

                        showNotification(
                            "تعذر نسخ الكود",
                            "error"
                        );

                    }

                }
            );

        }
    );

}


async function copyText(
    text
) {

    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {

        await navigator.clipboard.writeText(
            text
        );

        return;

    }


    const textarea =
        document.createElement(
            "textarea"
        );


    textarea.value =
        text;


    textarea.style.position =
        "fixed";


    textarea.style.opacity =
        "0";


    document.body.appendChild(
        textarea
    );


    textarea.select();


    document.execCommand(
        "copy"
    );


    textarea.remove();

}


/* =========================================================
   CHAT
========================================================= */

function setupChat() {

    const chatSendBtn =
        getElement(
            "chatSendBtn"
        );

    const homeSendBtn =
        getElement(
            "homeSendBtn"
        );

    const gisSendBtn =
        getElement(
            "gisSendBtn"
        );

    const codeSendBtn =
        getElement(
            "codeSendBtn"
        );


    if (chatSendBtn) {

        chatSendBtn.addEventListener(
            "click",
            sendChatMessage
        );

    }


    if (homeSendBtn) {

        homeSendBtn.addEventListener(
            "click",
            sendHomeMessage
        );

    }


    if (gisSendBtn) {

        gisSendBtn.addEventListener(
            "click",
            sendGISMessage
        );

    }


    if (codeSendBtn) {

        codeSendBtn.addEventListener(
            "click",
            generateCode
        );

    }


    setupChatFileInputs();

}


/* =========================================================
   CHAT FILE INPUTS
========================================================= */

function setupChatFileInputs() {

    const inputs = {

        chatImageInput:
            "currentChatImage",

        chatFileInput:
            "currentChatFile",

        homeImageInput:
            "currentHomeImage",

        homeFileInput:
            "currentHomeFile"

    };


    Object.entries(
        inputs
    ).forEach(
        (
            [
                id,
                stateName
            ]
        ) => {

            const input =
                getElement(
                    id
                );


            if (!input) {
                return;
            }


            input.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files[0] ||
                        null;


                    if (
                        stateName ===
                        "currentChatImage"
                    ) {

                        currentChatImage =
                            file;

                    }


                    if (
                        stateName ===
                        "currentChatFile"
                    ) {

                        currentChatFile =
                            file;

                    }


                    if (
                        stateName ===
                        "currentHomeImage"
                    ) {

                        currentHomeImage =
                            file;

                    }


                    if (
                        stateName ===
                        "currentHomeFile"
                    ) {

                        currentHomeFile =
                            file;

                    }


                    if (file) {

                        showNotification(
                            "تم اختيار الملف: " +
                            file.name
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   CHAT SEND
========================================================= */

async function sendChatMessage() {

    if (isSendingMessage) {
        return;
    }


    const input =
        getElement(
            "chatInput"
        );


    if (!input) {
        return;
    }


    const message =
        input.value.trim();


    if (
        !message &&
        !currentChatImage &&
        !currentChatFile
    ) {

        showNotification(
            "اكتب رسالة أولاً",
            "warning"
        );


        return;

    }


    isSendingMessage =
        true;


    input.value =
        "";


    let fileContent =
        "";


    if (currentChatFile) {

        fileContent =
            await readTextFile(
                currentChatFile
            );

    }


    const imageData =
        currentChatImage
            ? await fileToDataURL(
                currentChatImage
            )
            : null;


    const finalMessage =
        message ||
        (
            currentChatImage
                ? "حلل الصورة المرفقة."
                : "حلل الملف المرفق."
        );


    addUserMessage(
        finalMessage
    );


    const loadingId =
        addLoadingMessage();


    try {

        const answer =
            await callAI(
                finalMessage,
                {

                    mode:
                        "general",

                    image:
                        imageData,

                    fileName:
                        currentChatFile
                            ? currentChatFile.name
                            : "",

                    fileContent:
                        fileContent

                }
            );


        removeLoadingMessage(
            loadingId
        );


        addAIMessage(
            answer ||
            "لم أستطع الحصول على إجابة."
        );


        saveChatLocally(
            finalMessage,
            answer
        );


        await saveConversationMessage(
            finalMessage,
            answer
        );


        currentChatImage =
            null;

        currentChatFile =
            null;

    } catch (error) {

        console.error(
            "Chat error:",
            error
        );


        removeLoadingMessage(
            loadingId
        );


        addAIMessage(
            "حدث خطأ أثناء الاتصال بـ GEO AI.\n\n" +
            "تأكد من اتصال الإنترنت ثم حاول مرة أخرى."
        );


        showNotification(
            "حدث خطأ في الاتصال",
            "error"
        );

    } finally {

        isSendingMessage =
            false;

    }

}


/* =========================================================
   HOME SEND
========================================================= */

async function sendHomeMessage() {

    const input =
        getElement(
            "homeChatInput"
        );


    if (!input) {
        return;
    }


    const message =
        input.value.trim();


    if (
        !message &&
        !currentHomeImage &&
        !currentHomeFile
    ) {

        showNotification(
            "اكتب سؤالك أولاً",
            "warning"
        );


        return;

    }


    navigateTo(
        "chat"
    );


    const chatInput =
        getElement(
            "chatInput"
        );


    if (chatInput) {

        chatInput.value =
            message;

    }


    currentChatImage =
        currentHomeImage;


    currentChatFile =
        currentHomeFile;


    currentHomeImage =
        null;


    currentHomeFile =
        null;


    input.value =
        "";


    await sendChatMessage();

}


/* =========================================================
   FILE TO DATA URL
========================================================= */

function fileToDataURL(
    file
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (!file) {

                resolve(
                    null
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                () => {

                    resolve(
                        reader.result
                    );

                };


            reader.onerror =
                () => {

                    reject(
                        reader.error
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   GIS
========================================================= */

function setupGIS() {

    const subjectCards =
        $$(".subject-card");


    subjectCards.forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const topic =
                        card.dataset.topic ||
                        card.textContent.trim();


                    const input =
                        getElement(
                            "gisInput"
                        );


                    if (input) {

                        input.value =
                            "اشرحلي " +
                            topic +
                            " بالتفصيل وبطريقة عملية للمبتدئ.";


                        input.focus();

                    }

                }
            );

        }
    );

}


async function sendGISMessage() {

    const input =
        getElement(
            "gisInput"
        );


    if (!input) {
        return;
    }


    const message =
        input.value.trim();


    if (!message) {

        showNotification(
            "اكتب سؤالك في GIS أولاً",
            "warning"
        );


        return;

    }


    input.value =
        "";


    navigateTo(
        "chat"
    );


    const chatInput =
        getElement(
            "chatInput"
        );


    if (chatInput) {

        chatInput.value =
            message;

    }


    await sendChatMessage();

}


/* =========================================================
   CODING
========================================================= */

function setupCoding() {

    const languageCards =
        $$(".language-card");


    languageCards.forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    selectedCodingLanguage =
                        card.dataset.language ||
                        "Python";


                    languageCards.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    card.classList.add(
                        "active"
                    );


                    const input =
                        getElement(
                            "codeInput"
                        );


                    if (input) {

                        input.placeholder =
                            "مثال: اكتبلي كود " +
                            selectedCodingLanguage +
                            " ...";


                        input.focus();

                    }

                }
            );

        }
    );


    const copyCodeBtn =
        getElement(
            "copyCodeBtn"
        );


    if (copyCodeBtn) {

        copyCodeBtn.addEventListener(
            "click",
            copyGeneratedCode
        );

    }


    if (languageCards.length) {

        languageCards[0].classList.add(
            "active"
        );

    }

}


/* =========================================================
   GENERATE CODE
========================================================= */

async function generateCode() {

    if (isGeneratingCode) {
        return;
    }


    const input =
        getElement(
            "codeInput"
        );


    if (!input) {
        return;
    }


    const request =
        input.value.trim();


    if (!request) {

        showNotification(
            "اكتب المطلوب من الكود أولاً",
            "warning"
        );


        return;

    }


    isGeneratingCode =
        true;


    const output =
        getElement(
            "codeOutput"
        );


    if (output) {

        output.innerHTML =
            "جاري إنشاء الكود...";

    }


    try {

        const prompt = `

أنت مساعد برمجة محترف داخل GEO AI.

لغة البرمجة المطلوبة:
${selectedCodingLanguage}

طلب المستخدم:
${request}

المطلوب:

1. أعطني الكود جاهزًا للنسخ.
2. ضع الكود داخل code block.
3. اكتب اسم اللغة بعد علامات ``` مباشرة.
4. لا تضع شرحًا داخل صندوق الكود.
5. بعد الكود اكتب شرحًا مختصرًا وواضحًا.
6. إذا كان الطلب متعلقًا بـ GIS فاستخدم ArcPy عند الحاجة.
7. لا تختصر الكود المطلوب.
8. إذا كان هناك أكثر من ملف أو أكثر من جزء للكود، افصلهم في code blocks واضحة.

`;


        const answer =
            await callAI(
                prompt,
                {

                    mode:
                        "coding",

                    context:
                        "Programming assistant. Focus on clean copy-ready code."

                }
            );


        if (output) {

            output.innerHTML =
                formatAIResponse(
                    answer
                );


            attachCodeCopyButtons(
                output
            );

        }

    } catch (error) {

        console.error(
            "Code generation error:",
            error
        );


        if (output) {

            output.textContent =
                "حدث خطأ أثناء إنشاء الكود.";

        }


        showNotification(
            "حدث خطأ أثناء إنشاء الكود",
            "error"
        );

    } finally {

        isGeneratingCode =
            false;

    }

}


/* =========================================================
   COPY GENERATED CODE
========================================================= */

async function copyGeneratedCode() {

    const output =
        getElement(
            "codeOutput"
        );


    if (!output) {
        return;
    }


    const codeBlocks =
        output.querySelectorAll(
            "pre code"
        );


    if (codeBlocks.length) {

        let allCode =
            "";


        codeBlocks.forEach(
            block => {

                allCode +=
                    block.textContent +
                    "\n\n";

            }
        );


        await copyText(
            allCode.trim()
        );


        showNotification(
            "تم نسخ الكود"
        );


        return;

    }


    await copyText(
        output.innerText
    );


    showNotification(
        "تم النسخ"
    );

}


/* =========================================================
   STUDY
========================================================= */

function setupStudy() {

    const studyButtons =
        $$(
            "[data-study-action]"
        );


    studyButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    handleStudyAction(
                        button.dataset.studyAction
                    );

                }
            );

        }
    );


    const studyFileInput =
        getElement(
            "studyFileInput"
        );


    if (studyFileInput) {

        studyFileInput.addEventListener(
            "change",
            event => {

                currentStudyFile =
                    event.target.files[0] ||
                    null;


                if (
                    currentStudyFile
                ) {

                    showNotification(
                        "تم اختيار ملف المذاكرة"
                    );


                    navigateTo(
                        "chat"
                    );


                    const chatInput =
                        getElement(
                            "chatInput"
                        );


                    if (chatInput) {

                        chatInput.value =
                            "حلل الملف المرفق واشرح محتواه لي بطريقة بسيطة.";

                    }


                    currentChatFile =
                        currentStudyFile;


                    sendChatMessage();

                }

            }
        );

    }

}


function handleStudyAction(
    action
) {

    const prompts = {

        explain:
            "اشرح لي الموضوع أو المحاضرة التي سأرسلها بالتفصيل وبطريقة بسيطة ومنظمة.",

        summary:
            "لخص لي المحتوى الذي سأرسله في نقاط واضحة ومنظمة مع أهم المصطلحات.",

        questions:
            "أنشئ لي أسئلة تدريبية متنوعة من المحتوى الذي سأرسله مع الإجابات.",

        exam:
            "أنشئ لي اختبارًا تدريبيًا من المحتوى الذي سأرسله."

    };


    navigateTo(
        "chat"
    );


    const chatInput =
        getElement(
            "chatInput"
        );


    if (chatInput) {

        chatInput.value =
            prompts[action] ||
            "ساعدني في مذاكرة هذا الموضوع.";


        chatInput.focus();

    }

}


/* =========================================================
   TESTS
========================================================= */

function setupTests() {

    const createTestBtn =
        getElement(
            "createTestBtn"
        );


    if (createTestBtn) {

        createTestBtn.addEventListener(
            "click",
            createTest
        );

    }

}


async function createTest() {

    if (isGeneratingTest) {
        return;
    }


    const subjectElement =
        getElement(
            "testSubject"
        );


    const countElement =
        getElement(
            "testCount"
        );


    const container =
        getElement(
            "testContainer"
        );


    if (
        !subjectElement ||
        !countElement ||
        !container
    ) {

        return;

    }


    const subject =
        subjectElement.value;


    const count =
        Number(
            countElement.value
        );


    if (!subject) {

        showNotification(
            "اكتب اسم المادة أولاً",
            "warning"
        );


        return;

    }


    isGeneratingTest =
        true;


    container.innerHTML = `

        <div class="test-loading">

            📝 جاري إنشاء الاختبار...

        </div>

    `;


    try {

        const prompt = `

أنشئ اختبارًا تدريبيًا باللغة العربية.

المادة:
${subject}

عدد الأسئلة:
${count}

أريد الاختبار بهذا الشكل:

QUESTION 1:
السؤال

A) اختيار
B) اختيار
C) اختيار
D) اختيار

ANSWER:
الحرف الصحيح

ثم السؤال التالي.

اجعل الأسئلة مناسبة لطالب جامعي مبتدئ إلى متوسط.

`;


        const answer =
            await callAI(
                prompt,
                {
                    mode:
                        "test"
                }
            );


        currentTestData =
            parseGeneratedTest(
                answer
            );


        if (
            currentTestData.length
        ) {

            renderTest(
                currentTestData
            );

        } else {

            container.innerHTML = `

                <div class="test-result">

                    ${formatAIResponse(
                        answer
                    )}

                </div>

            `;

        }

    } catch (error) {

        console.error(
            "Test error:",
            error
        );


        container.innerHTML = `

            <div class="test-error">

                حدث خطأ أثناء إنشاء الاختبار.

            </div>

        `;


        showNotification(
            "تعذر إنشاء الاختبار",
            "error"
        );

    } finally {

        isGeneratingTest =
            false;

    }

}


/* =========================================================
   PARSE TEST
========================================================= */

function parseGeneratedTest(
    text
) {

    if (!text) {
        return [];
    }


    const blocks =
        text.split(
            /QUESTION\s*\d+\s*:/i
        );


    const questions =
        [];


    blocks.forEach(
        block => {

            const clean =
                block.trim();


            if (!clean) {
                return;
            }


            const answerMatch =
                clean.match(
                    /ANSWER\s*:\s*([ABCD])/i
                );


            const answer =
                answerMatch
                    ? answerMatch[1].toUpperCase()
                    : "";


            const beforeAnswer =
                answerMatch
                    ? clean.substring(
                        0,
                        answerMatch.index
                    )
                    : clean;


            const options =
                [];


            const optionRegex =
                /([ABCD])\)\s*(.+)/gi;


            let match;


            while (
                (
                    match =
                        optionRegex.exec(
                            beforeAnswer
                        )
                ) !== null
            ) {

                options.push({

                    letter:
                        match[1].toUpperCase(),

                    text:
                        match[2].trim()

                });

            }


            const questionText =
                beforeAnswer
                    .replace(
                        /([ABCD])\)\s*(.+)/gi,
                        ""
                    )
                    .trim();


            if (
                questionText &&
                options.length >= 2
            ) {

                questions.push({

                    question:
                        questionText,

                    options:
                        options,

                    answer:
                        answer

                });

            }

        }
    );


    return questions;

}


/* =========================================================
   RENDER TEST
========================================================= */

function renderTest(
    questions
) {

    const container =
        getElement(
            "testContainer"
        );


    if (!container) {
        return;
    }


    currentTestAnswers =
        {};


    container.innerHTML =
        "";


    questions.forEach(
        (
            question,
            index
        ) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "test-question";


            let optionsHTML =
                "";


            question.options.forEach(
                option => {

                    optionsHTML += `

                        <label class="test-option">

                            <input
                                type="radio"
                                name="question-${index}"
                                value="${escapeHTML(
                                    option.letter
                                )}"
                                data-question="${index}">

                            <span>

                                <strong>
                                    ${escapeHTML(
                                        option.letter
                                    )})
                                </strong>

                                ${escapeHTML(
                                    option.text
                                )}

                            </span>

                        </label>

                    `;

                }
            );


            card.innerHTML = `

                <div class="test-question-number">

                    السؤال ${index + 1}

                </div>

                <h3>

                    ${escapeHTML(
                        question.question
                    )}

                </h3>

                <div class="test-options">

                    ${optionsHTML}

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );


    const submit =
        document.createElement(
            "button"
        );


    submit.type =
        "button";


    submit.className =
        "primary-btn";


    submit.textContent =
        "تصحيح الاختبار";


    submit.addEventListener(
        "click",
        () => {

            gradeTest(
                questions
            );

        }
    );


    container.appendChild(
        submit
    );

}


/* =========================================================
   GRADE TEST
========================================================= */

function gradeTest(
    questions
) {

    let score =
        0;

    let answered =
        0;


    questions.forEach(
        (
            question,
            index
        ) => {

            const selected =
                document.querySelector(
                    `input[name="question-${index}"]:checked`
                );


            if (!selected) {
                return;
            }


            answered++;


            if (
                selected.value ===
                question.answer
            ) {

                score++;

            }

        }
    );


    const percentage =
        questions.length
            ? Math.round(
                (
                    score /
                    questions.length
                ) *
                100
            )
            : 0;


    const result =
        document.createElement(
            "div"
        );


    result.className =
        "test-score";


    result.innerHTML = `

        <h2>
            النتيجة
        </h2>

        <p>

            حصلت على

            <strong>
                ${score}
            </strong>

            من

            <strong>
                ${questions.length}
            </strong>

        </p>

        <p>

            الإجابات التي تم حلها:
            ${answered}

        </p>

        <strong>
            ${percentage}%
        </strong>

    `;


    const container =
        getElement(
            "testContainer"
        );


    if (container) {

        container.appendChild(
            result
        );

    }

}


/* =========================================================
   FILES
========================================================= */

function setupFiles() {

    const mainFileInput =
        getElement(
            "mainFileInput"
        );


    if (mainFileInput) {

        mainFileInput.addEventListener(
            "change",
            event => {

                const file =
                    event.target.files[0];


                currentMainFile =
                    file ||
                    null;


                if (file) {

                    saveLocalFileInfo(
                        file
                    );


                    showNotification(
                        "تمت إضافة الملف"
                    );


                    loadLocalFiles();

                }

            }
        );

    }

}


function saveLocalFileInfo(
    file
) {

    const existing =
        getLocalFiles();


    existing.push({

        name:
            file.name,

        size:
            file.size,

        type:
            file.type,

        date:
            new Date().toISOString()

    });


    localStorage.setItem(
        "geo_ai_files",
        JSON.stringify(
            existing
        )
    );

}


function getLocalFiles() {

    try {

        const value =
            localStorage.getItem(
                "geo_ai_files"
            );


        if (!value) {
            return [];
        }


        const parsed =
            JSON.parse(
                value
            );


        return Array.isArray(
            parsed
        )
            ? parsed
            : [];

    } catch (error) {

        return [];

    }

}


function loadLocalFiles() {

    const container =
        getElement(
            "filesList"
        );


    if (!container) {
        return;
    }


    const files =
        getLocalFiles();


    if (!files.length) {

        container.innerHTML = `

            <div class="empty-files">

                📂

                <p>
                    لا توجد ملفات حتى الآن
                </p>

            </div>

        `;


        return;

    }


    container.innerHTML =
        files.map(
            (
                file,
                index
            ) => `

                <div class="file-item">

                    <div class="file-icon">
                        📄
                    </div>

                    <div class="file-info">

                        <strong>
                            ${escapeHTML(
                                file.name
                            )}
                        </strong>

                        <small>

                            ${formatFileSize(
                                file.size
                            )}

                            •

                            ${formatDate(
                                file.date
                            )}

                        </small>

                    </div>

                    <button
                        type="button"
                        class="file-delete-btn"
                        data-file-index="${index}">

                        🗑️

                    </button>

                </div>

            `
        )
        .join("");


    const deleteButtons =
        container.querySelectorAll(
            ".file-delete-btn"
        );


    deleteButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    deleteLocalFile(
                        Number(
                            button.dataset.fileIndex
                        )
                    );

                }
            );

        }
    );

}


function deleteLocalFile(
    index
) {

    const files =
        getLocalFiles();


    if (
        index < 0 ||
        index >= files.length
    ) {

        return;

    }


    files.splice(
        index,
        1
    );


    localStorage.setItem(
        "geo_ai_files",
        JSON.stringify(
            files
        )
    );


    loadLocalFiles();


    showNotification(
        "تم حذف الملف"
    );

}


function formatFileSize(
    bytes
) {

    if (!bytes) {
        return "0 KB";
    }


    if (
        bytes < 1024
    ) {

        return (
            bytes +
            " B"
        );

    }


    if (
        bytes <
        1024 * 1024
    ) {

        return (
            bytes /
            1024
        ).toFixed(1) +
        " KB";

    }


    return (
        bytes /
        (
            1024 *
            1024
        )
    ).toFixed(1) +
    " MB";

}


/* =========================================================
   COURSES
========================================================= */

const COURSE_CATEGORIES = {

    surveying: {

        label:
            "المساحة",

        icon:
            "📐"

    },

    gis: {

        label:
            "GIS",

        icon:
            "🗺️"

    },

    remote_sensing: {

        label:
            "الاستشعار عن بعد",

        icon:
            "🛰️"

    },

    programming: {

        label:
            "البرمجة",

        icon:
            "💻"

    }

};


/* =========================================================
   COURSE SETUP
========================================================= */

function setupCourses() {

    const addCourseBtn =
        getElement(
            "addCourseBtn"
        );


    if (addCourseBtn) {

        addCourseBtn.addEventListener(
            "click",
            () => {

                if (
                    currentUserRole !==
                    "admin"
                ) {

                    showNotification(
                        "هذه العملية متاحة للمدير فقط",
                        "error"
                    );


                    return;

                }


                openCourseModal();

            }
        );

    }


    const filters =
        $$(".course-filter");


    filters.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectedCourseCategory =
                        button.dataset.category ||
                        "all";


                    filters.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    renderCourses();

                }
            );

        }
    );


    const closeButton =
        getElement(
            "courseModalClose"
        );


    const cancelButton =
        getElement(
            "courseFormCancel"
        );


    const overlay =
        getElement(
            "courseModalOverlay"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeCourseModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeCourseModal
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeCourseModal
        );

    }


    const courseForm =
        getElement(
            "courseForm"
        );


    if (courseForm) {

        courseForm.addEventListener(
            "submit",
            saveCourse
        );

    }


    updateAdminCourseUI();

}


/* =========================================================
   ADMIN UI
========================================================= */

function updateAdminCourseUI() {

    const addCourseBtn =
        getElement(
            "addCourseBtn"
        );


    if (!addCourseBtn) {
        return;
    }


    const isAdmin =
        currentUserRole ===
        "admin";


    addCourseBtn.style.display =
        isAdmin
            ? "inline-flex"
            : "none";


    const adminActions =
        $$(".course-admin-actions");


    adminActions.forEach(
        element => {

            element.style.display =
                isAdmin
                    ? ""
                    : "none";

        }
    );

}


/* =========================================================
   LOAD COURSES
========================================================= */

async function loadCourses() {

    const loading =
        getElement(
            "coursesLoading"
        );


    if (loading) {

        loading.style.display =
            "block";

    }


    try {

        if (
            !firebaseDb ||
            !firebaseModules
        ) {

            await initializeFirebase();

        }


        if (
            !firebaseDb ||
            !firebaseModules
        ) {

            throw new Error(
                "Firebase unavailable"
            );

        }


        const {
            collection,
            getDocs,
            query,
            orderBy
        } =
            firebaseModules;


        let snapshot;


        try {

            const coursesQuery =
                query(
                    collection(
                        firebaseDb,
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

        } catch (orderError) {

            console.warn(
                "Course order query failed:",
                orderError
            );


            snapshot =
                await getDocs(
                    collection(
                        firebaseDb,
                        "courses"
                    )
                );

        }


        coursesCache =
            snapshot.docs.map(
                document => ({

                    id:
                        document.id,

                    ...document.data()

                })
            );


        renderCourses();

    } catch (error) {

        console.error(
            "Load courses error:",
            error
        );


        coursesCache =
            [];


        renderCourses();


        if (
            error &&
            error.code ===
                "permission-denied"
        ) {

            showNotification(
                "ليس لديك صلاحية قراءة الكورسات",
                "error"
            );

        }

    } finally {

        if (loading) {

            loading.style.display =
                "none";

        }

    }

}


/* =========================================================
   RENDER COURSES
========================================================= */

function renderCourses() {

    const grid =
        getElement(
            "coursesGrid"
        );


    const empty =
        getElement(
            "coursesEmpty"
        );


    if (!grid) {
        return;
    }


    let filtered =
        coursesCache.slice();


    if (
        selectedCourseCategory !==
        "all"
    ) {

        filtered =
            filtered.filter(
                course =>
                    course.category ===
                    selectedCourseCategory
            );

    }


    if (!filtered.length) {

        grid.innerHTML =
            "";


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
        filtered
            .map(
                course =>
                    createCourseCard(
                        course
                    )
            )
            .join("");


    attachCourseCardEvents();


    updateAdminCourseUI();

}


/* =========================================================
   COURSE CARD
========================================================= */

function createCourseCard(
    course
) {

    const category =
        COURSE_CATEGORIES[
            course.category
        ] || {

            label:
                "دورة",

            icon:
                "🎓"

        };


    const image =
        isValidHttpUrl(
            course.imageUrl
        )
            ? course.imageUrl
            : "";


    const title =
        escapeHTML(
            course.title ||
            "دورة بدون اسم"
        );


    const instructor =
        escapeHTML(
            course.instructor ||
            "غير محدد"
        );


    const platform =
        escapeHTML(
            course.platform ||
            "منصة تعليمية"
        );


    const description =
        escapeHTML(
            course.description ||
            "لا يوجد وصف لهذه الدورة."
        );


    const type =
        course.type ===
        "paid"
            ? "مدفوعة"
            : "مجانية";


    const typeClass =
        course.type ===
        "paid"
            ? "paid"
            : "free";


    const date =
        formatDate(
            course.createdAt
        );


    const imageHTML =
        image
            ? `

                <div class="course-image">

                    <img
                        src="${escapeHTML(
                            image
                        )}"
                        alt="${title}"
                        loading="lazy"
                        onerror="this.parentElement.classList.add('course-image-fallback'); this.style.display='none';">

                    <span class="course-image-icon">
                        ${category.icon}
                    </span>

                </div>

            `
            : `

                <div class="course-image course-image-fallback">

                    <span class="course-image-icon">
                        ${category.icon}
                    </span>

                </div>

            `;


    const adminActions =
        currentUserRole ===
        "admin"
            ? `

                <div class="course-admin-actions">

                    <button
                        type="button"
                        class="course-edit-btn"
                        data-course-action="edit"
                        data-course-id="${escapeHTML(
                            course.id
                        )}">

                        ✏️ تعديل

                    </button>

                    <button
                        type="button"
                        class="course-delete-btn"
                        data-course-action="delete"
                        data-course-id="${escapeHTML(
                            course.id
                        )}">

                        🗑️ حذف

                    </button>

                </div>

            `
            : "";


    const validCourseUrl =
        isValidHttpUrl(
            course.url
        );


    return `

        <article
            class="course-card"
            data-course-id="${escapeHTML(
                course.id
            )}">

            ${imageHTML}

            <div class="course-card-body">

                <div class="course-card-top">

                    <span class="course-category">

                        ${category.icon}

                        ${escapeHTML(
                            category.label
                        )}

                    </span>

                    <span class="course-type ${typeClass}">

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

                    <span>
                        👨‍🏫
                        ${instructor}
                    </span>

                    <span>
                        🌐
                        ${platform}
                    </span>

                </div>


                ${
                    date
                        ? `

                            <div class="course-date">

                                📅 ${date}

                            </div>

                        `
                        : ""
                }


                <div class="course-card-bottom">

                    ${
                        validCourseUrl
                            ? `

                                <a
                                    class="course-open-btn"
                                    href="${escapeHTML(
                                        course.url
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer">

                                    فتح الدورة

                                    <span>
                                        ↗
                                    </span>

                                </a>

                            `
                            : `

                                <span class="course-open-btn disabled">

                                    الرابط غير متاح

                                </span>

                            `
                    }

                </div>


                ${adminActions}

            </div>

        </article>

    `;

}


/* =========================================================
   COURSE CARD EVENTS
========================================================= */

function attachCourseCardEvents() {

    const editButtons =
        $$(
            '[data-course-action="edit"]'
        );


    editButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    editCourse(
                        button.dataset.courseId
                    );

                }
            );

        }
    );


    const deleteButtons =
        $$(
            '[data-course-action="delete"]'
        );


    deleteButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    deleteCourse(
                        button.dataset.courseId
                    );

                }
            );

        }
    );

}


/* =========================================================
   COURSE MODAL
========================================================= */

function openCourseModal(
    course = null
) {

    if (
        currentUserRole !==
        "admin"
    ) {

        showNotification(
            "هذه العملية متاحة للمدير فقط",
            "error"
        );


        return;

    }


    const modal =
        getElement(
            "courseModal"
        );


    if (!modal) {
        return;
    }


    editingCourseId =
        course
            ? course.id
            : null;


    const title =
        getElement(
            "courseModalTitle"
        );


    const form =
        getElement(
            "courseForm"
        );


    if (form) {

        form.reset();

    }


    if (title) {

        title.textContent =
            course
                ? "تعديل الدورة"
                : "إضافة دورة جديدة";

    }


    if (course) {

        setInputValue(
            "courseTitleInput",
            course.title
        );


        setInputValue(
            "courseCategoryInput",
            course.category ||
            "surveying"
        );


        setInputValue(
            "courseTypeInput",
            course.type ||
            "free"
        );


        setInputValue(
            "courseInstructorInput",
            course.instructor ||
            ""
        );


        setInputValue(
            "coursePlatformInput",
            course.platform ||
            ""
        );


        setInputValue(
            "courseUrlInput",
            course.url ||
            ""
        );


        setInputValue(
            "courseImageInput",
            course.imageUrl ||
            ""
        );


        setInputValue(
            "courseDescriptionInput",
            course.description ||
            ""
        );

    }


    modal.classList.remove(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";


    const titleInput =
        getElement(
            "courseTitleInput"
        );


    if (titleInput) {

        setTimeout(
            () => {

                titleInput.focus();

            },
            100
        );

    }

}


function closeCourseModal() {

    const modal =
        getElement(
            "courseModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.style.overflow =
        "";


    editingCourseId =
        null;


    const form =
        getElement(
            "courseForm"
        );


    if (form) {

        form.reset();

    }


    const title =
        getElement(
            "courseModalTitle"
        );


    if (title) {

        title.textContent =
            "إضافة دورة جديدة";

    }

}


/* =========================================================
   SET INPUT VALUE
========================================================= */

function setInputValue(
    id,
    value
) {

    const element =
        getElement(
            id
        );


    if (!element) {
        return;
    }


    element.value =
        value === null ||
        value === undefined
            ? ""
            : value;

}


/* =========================================================
   EDIT COURSE
========================================================= */

function editCourse(
    courseId
) {

    if (
        currentUserRole !==
        "admin"
    ) {

        showNotification(
            "هذه العملية متاحة للمدير فقط",
            "error"
        );


        return;

    }


    const course =
        coursesCache.find(
            item =>
                item.id ===
                courseId
        );


    if (!course) {

        showNotification(
            "لم يتم العثور على الدورة",
            "error"
        );


        return;

    }


    openCourseModal(
        course
    );

}


/* =========================================================
   DELETE COURSE
========================================================= */

async function deleteCourse(
    courseId
) {

    if (
        currentUserRole !==
        "admin"
    ) {

        showNotification(
            "هذه العملية متاحة للمدير فقط",
            "error"
        );


        return;

    }


    if (
        !firebaseDb ||
        !firebaseModules
    ) {

        showNotification(
            "Firebase غير متصل",
            "error"
        );


        return;

    }


    const course =
        coursesCache.find(
            item =>
                item.id ===
                courseId
        );


    if (!course) {

        showNotification(
            "الدورة غير موجودة",
            "error"
        );


        return;

    }


    const confirmed =
        window.confirm(
            `هل أنت متأكد من حذف دورة "${course.title || "هذه الدورة"}"؟`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            doc,
            deleteDoc
        } =
            firebaseModules;


        await deleteDoc(
            doc(
                firebaseDb,
                "courses",
                courseId
            )
        );


        coursesCache =
            coursesCache.filter(
                item =>
                    item.id !==
                    courseId
            );


        renderCourses();


        showNotification(
            "تم حذف الدورة بنجاح"
        );

    } catch (error) {

        console.error(
            "Delete course error:",
            error
        );


        if (
            error &&
            error.code ===
                "permission-denied"
        ) {

            showNotification(
                "ليس لديك صلاحية حذف الدورة",
                "error"
            );

        } else {

            showNotification(
                "حدث خطأ أثناء حذف الدورة",
                "error"
            );

        }

    }

}


/* =========================================================
   SAVE COURSE
========================================================= */

async function saveCourse(
    event
) {

    event.preventDefault();


    if (
        currentUserRole !==
        "admin"
    ) {

        showNotification(
            "هذه العملية متاحة للمدير فقط",
            "error"
        );


        return;

    }


    if (
        !firebaseDb ||
        !firebaseModules
    ) {

        showNotification(
            "Firebase غير متصل",
            "error"
        );


        return;

    }


    const title =
        getElement(
            "courseTitleInput"
        )?.value.trim() ||
        "";


    const category =
        getElement(
            "courseCategoryInput"
        )?.value ||
        "surveying";


    const type =
        getElement(
            "courseTypeInput"
        )?.value ||
        "free";


    const instructor =
        getElement(
            "courseInstructorInput"
        )?.value.trim() ||
        "";


    const platform =
        getElement(
            "coursePlatformInput"
        )?.value.trim() ||
        "";


    const url =
        getElement(
            "courseUrlInput"
        )?.value.trim() ||
        "";


    const imageUrl =
        getElement(
            "courseImageInput"
        )?.value.trim() ||
        "";


    const description =
        getElement(
            "courseDescriptionInput"
        )?.value.trim() ||
        "";


    if (!title) {

        showNotification(
            "اكتب اسم الدورة",
            "warning"
        );


        getElement(
            "courseTitleInput"
        )?.focus();


        return;

    }


    if (
        !COURSE_CATEGORIES[
            category
        ]
    ) {

        showNotification(
            "اختر تصنيف الدورة",
            "warning"
        );


        return;

    }


    if (
        !url ||
        !isValidHttpUrl(
            url
        )
    ) {

        showNotification(
            "اكتب رابط دورة صحيح يبدأ بـ https:// أو http://",
            "warning"
        );


        getElement(
            "courseUrlInput"
        )?.focus();


        return;

    }


    if (
        imageUrl &&
        !isValidHttpUrl(
            imageUrl
        )
    ) {

        showNotification(
            "رابط الصورة غير صحيح",
            "warning"
        );


        getElement(
            "courseImageInput"
        )?.focus();


        return;

    }


    const submitButton =
        getElement(
            "courseFormSubmit"
        );


    const originalButtonText =
        submitButton
            ? submitButton.textContent
            : "";


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.textContent =
            editingCourseId
                ? "جاري التعديل..."
                : "جاري الإضافة...";

    }


    try {

        const {
            collection,
            addDoc,
            doc,
            updateDoc,
            serverTimestamp
        } =
            firebaseModules;


        const now =
            Date.now();


        const baseData = {

            title:
                title,

            category:
                category,

            type:
                type === "paid"
                    ? "paid"
                    : "free",

            instructor:
                instructor,

            platform:
                platform,

            url:
                url,

            imageUrl:
                imageUrl,

            description:
                description,

            updatedAt:
                serverTimestamp(),

            updatedAtClient:
                now

        };


        if (editingCourseId) {

            await updateDoc(
                doc(
                    firebaseDb,
                    "courses",
                    editingCourseId
                ),
                baseData
            );


            coursesCache =
                coursesCache.map(
                    course => {

                        if (
                            course.id !==
                            editingCourseId
                        ) {

                            return course;

                        }


                        return {

                            ...course,

                            ...baseData,

                            updatedAtClient:
                                now

                        };

                    }
                );


            showNotification(
                "تم تعديل الدورة بنجاح"
            );

        } else {

            const newCourse = {

                ...baseData,

                createdBy:
                    currentFirebaseUser
                        ? currentFirebaseUser.uid
                        : "",

                createdByEmail:
                    currentFirebaseUser
                        ? (
                            currentFirebaseUser.email ||
                            ""
                        )
                        : "",

                createdAt:
                    serverTimestamp(),

                createdAtClient:
                    now,

                order:
                    coursesCache.length +
                    1

            };


            const reference =
                await addDoc(
                    collection(
                        firebaseDb,
                        "courses"
                    ),
                    newCourse
                );


            coursesCache.unshift({

                id:
                    reference.id,

                ...newCourse,

                createdAtClient:
                    now

            });


            showNotification(
                "تمت إضافة الدورة بنجاح"
            );

        }


        renderCourses();


        closeCourseModal();

    } catch (error) {

        console.error(
            "Save course error:",
            error
        );


        if (
            error &&
            error.code ===
                "permission-denied"
        ) {

            showNotification(
                "ليس لديك صلاحية إضافة أو تعديل الدورات",
                "error"
            );

        } else {

            showNotification(
                "حدث خطأ أثناء حفظ الدورة",
                "error"
            );

        }

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.textContent =
                originalButtonText ||
                "حفظ الدورة";

        }

    }

}


/* =========================================================
   COURSE FILTER DEFAULT
========================================================= */

function setupCourseFilterDefault() {

    const filters =
        $$(".course-filter");


    filters.forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.category ===
                    "all"
            );

        }
    );

}


/* =========================================================
   LOCAL CHAT STORAGE
========================================================= */

function saveChatLocally(
    userMessage,
    aiResponse
) {

    try {

        const enabled =
            localStorage.getItem(
                "geo_ai_save_chats"
            );


        if (
            enabled ===
            "false"
        ) {

            return;

        }


        const existingRaw =
            localStorage.getItem(
                "geo_ai_current_chat"
            );


        let messages =
            [];


        if (existingRaw) {

            try {

                const parsed =
                    JSON.parse(
                        existingRaw
                    );


                if (
                    Array.isArray(
                        parsed
                    )
                ) {

                    messages =
                        parsed;

                }

            } catch (error) {

                messages =
                    [];

            }

        }


        messages.push({

            role:
                "user",

            content:
                userMessage,

            timestamp:
                new Date().toISOString()

        });


        messages.push({

            role:
                "assistant",

            content:
                aiResponse ||
                "",

            timestamp:
                new Date().toISOString()

        });


        localStorage.setItem(
            "geo_ai_current_chat",
            JSON.stringify(
                messages
            )
        );

    } catch (error) {

        console.error(
            "Local chat save error:",
            error
        );

    }

}


/* =========================================================
   LOAD LOCAL CHAT
========================================================= */

function loadLocalChat() {

    const chatMessages =
        getElement(
            "chatMessages"
        );


    if (!chatMessages) {
        return;
    }


    try {

        const raw =
            localStorage.getItem(
                "geo_ai_current_chat"
            );


        if (!raw) {

            resetChatMessages();

            return;

        }


        const messages =
            JSON.parse(
                raw
            );


        if (
            !Array.isArray(
                messages
            ) ||
            !messages.length
        ) {

            resetChatMessages();

            return;

        }


        chatMessages.innerHTML =
            "";


        messages.forEach(
            message => {

                if (
                    message.role ===
                    "user"
                ) {

                    addUserMessage(
                        message.content ||
                        ""
                    );

                } else {

                    addAIMessage(
                        message.content ||
                        ""
                    );

                }

            }
        );

    } catch (error) {

        console.error(
            "Load local chat error:",
            error
        );


        resetChatMessages();

    }

}


/* =========================================================
   REMOVE EMPTY CHAT
========================================================= */

function removeEmptyChat() {

    const empty =
        document.querySelector(
            "#chatMessages .empty-chat"
        );


    if (empty) {

        empty.remove();

    }

}


/* =========================================================
   SCROLL CHAT
========================================================= */

function scrollChatToBottom() {

    const chatMessages =
        getElement(
            "chatMessages"
        );


    if (!chatMessages) {
        return;
    }


    setTimeout(
        () => {

            chatMessages.scrollTop =
                chatMessages.scrollHeight;

        },
        30
    );

}


/* =========================================================
   FILE DESCRIPTION
========================================================= */

function getFileDescription(
    file
) {

    if (!file) {
        return "";
    }


    return (
        `اسم الملف: ${file.name}\n` +
        `نوع الملف: ${file.type || "غير معروف"}\n` +
        `الحجم: ${formatFileSize(file.size)}`
    );

}


/* =========================================================
   HOME QUICK ACTIONS
========================================================= */

function setupHomeActions() {

    const quickCards =
        $$(".quick-card[data-action]");


    quickCards.forEach(
        card => {

            card.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();


                        navigateTo(
                            card.dataset.action
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   WEB SEARCH
========================================================= */

function setupWebSearch() {

    const webSearchBtn =
        getElement(
            "webSearchBtn"
        );


    if (!webSearchBtn) {
        return;
    }


    webSearchBtn.addEventListener(
        "click",
        () => {

            webSearchBtn.classList.toggle(
                "active"
            );


            const enabled =
                webSearchBtn.classList.contains(
                    "active"
                );


            webSearchBtn.setAttribute(
                "aria-pressed",
                String(
                    enabled
                )
            );


            showNotification(
                enabled
                    ? "تم تفعيل البحث في الويب"
                    : "تم إيقاف البحث في الويب"
            );

        }
    );

}


function isWebSearchEnabled() {

    const button =
        getElement(
            "webSearchBtn"
        );


    if (!button) {
        return false;
    }


    return button.classList.contains(
        "active"
    );

}


/* =========================================================
   SETTINGS
========================================================= */

function setupSettings() {

    const saveChatsToggle =
        getElement(
            "saveChatsToggle"
        );


    const languageSelect =
        getElement(
            "languageSelect"
        );


    const savedChats =
        localStorage.getItem(
            "geo_ai_save_chats"
        );


    if (saveChatsToggle) {

        saveChatsToggle.checked =
            savedChats !==
            "false";


        saveChatsToggle.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "geo_ai_save_chats",
                    saveChatsToggle.checked
                        ? "true"
                        : "false"
                );


                showNotification(
                    saveChatsToggle.checked
                        ? "تم تفعيل حفظ المحادثات"
                        : "تم إيقاف حفظ المحادثات"
                );

            }
        );

    }


    const savedLanguage =
        localStorage.getItem(
            "geo_ai_language"
        );


    if (
        languageSelect &&
        savedLanguage
    ) {

        languageSelect.value =
            savedLanguage;

    }


    if (languageSelect) {

        languageSelect.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "geo_ai_language",
                    languageSelect.value
                );


                showNotification(
                    "تم حفظ اللغة"
                );

            }
        );

    }

}


/* =========================================================
   PROFILE
========================================================= */

function setupProfile() {

    const profileButton =
        getElement(
            "profileButton"
        );


    const profileMenu =
        getElement(
            "profileMenu"
        );


    const profileModal =
        getElement(
            "profileModal"
        );


    const profileModalClose =
        getElement(
            "profileModalClose"
        );


    if (
        profileButton &&
        profileMenu
    ) {

        profileButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                profileMenu.classList.toggle(
                    "show"
                );

            }
        );

    }


    document.addEventListener(
        "click",
        event => {

            if (
                profileMenu &&
                !profileMenu.contains(
                    event.target
                ) &&
                !event.target.closest(
                    "#profileButton"
                )
            ) {

                profileMenu.classList.remove(
                    "show"
                );

            }

        }
    );


    if (profileModalClose) {

        profileModalClose.addEventListener(
            "click",
            closeProfileModal
        );

    }


    if (profileModal) {

        profileModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    profileModal
                ) {

                    closeProfileModal();

                }

            }
        );

    }


    const profileOpenButton =
        getElement(
            "profileOpenButton"
        );


    if (profileOpenButton) {

        profileOpenButton.addEventListener(
            "click",
            () => {

                if (profileMenu) {

                    profileMenu.classList.remove(
                        "show"
                    );

                }


                openProfileModal();

            }
        );

    }

}


function openProfileModal() {

    const modal =
        getElement(
            "profileModal"
        );


    if (!modal) {
        return;
    }


    const nameElement =
        getElement(
            "profileName"
        );


    const emailElement =
        getElement(
            "profileEmail"
        );


    const roleElement =
        getElement(
            "profileRole"
        );


    if (currentFirebaseUser) {

        if (nameElement) {

            nameElement.textContent =
                currentFirebaseUser.displayName ||
                "مستخدم GEO AI";

        }


        if (emailElement) {

            emailElement.textContent =
                currentFirebaseUser.email ||
                "";

        }

    }


    if (roleElement) {

        roleElement.textContent =
            currentUserRole ===
            "admin"
                ? "مدير"
                : "مستخدم";

    }


    modal.classList.remove(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeProfileModal() {

    const modal =
        getElement(
            "profileModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutButton =
        getElement(
            "logoutButton"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                if (
                    firebaseAuth &&
                    firebaseModules &&
                    typeof firebaseModules.signOut ===
                        "function"
                ) {

                    await firebaseModules.signOut(
                        firebaseAuth
                    );

                }


                currentFirebaseUser =
                    null;


                currentUserRole =
                    "user";


                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                showNotification(
                    "تعذر تسجيل الخروج",
                    "error"
                );

            }

        }
    );

}


/* =========================================================
   FIREBASE AUTH STATE
========================================================= */

function setupFirebaseAuthListener() {

    if (
        !firebaseAuth ||
        !firebaseModules ||
        typeof firebaseModules.onAuthStateChanged !==
            "function"
    ) {

        return;

    }


    firebaseModules.onAuthStateChanged(
        firebaseAuth,
        async user => {

            currentFirebaseUser =
                user ||
                null;


            if (!user) {

                currentUserRole =
                    "user";


                updateAdminCourseUI();


                return;

            }


            try {

                const {
                    doc,
                    getDoc
                } =
                    firebaseModules;


                const userReference =
                    doc(
                        firebaseDb,
                        "users",
                        user.uid
                    );


                const userSnapshot =
                    await getDoc(
                        userReference
                    );


                if (
                    userSnapshot.exists()
                ) {

                    const userData =
                        userSnapshot.data();


                    currentUserRole =
                        userData.role ||
                        "user";

                } else {

                    currentUserRole =
                        "user";

                }

            } catch (error) {

                console.error(
                    "User role error:",
                    error
                );


                currentUserRole =
                    "user";

            }


            updateAdminCourseUI();


            if (
                coursesCache.length
            ) {

                renderCourses();

            }


            if (
                currentSection ===
                "courses"
            ) {

                loadCourses();

            }

        }
    );

}


/* =========================================================
   LOAD CURRENT USER
========================================================= */

async function loadCurrentFirebaseUser() {

    if (
        !firebaseAuth ||
        !firebaseModules
    ) {

        return;

    }


    const user =
        firebaseAuth.currentUser;


    if (!user) {

        currentFirebaseUser =
            null;

        currentUserRole =
            "user";

        updateAdminCourseUI();

        return;

    }


    currentFirebaseUser =
        user;


    try {

        const {
            doc,
            getDoc
        } =
            firebaseModules;


        const reference =
            doc(
                firebaseDb,
                "users",
                user.uid
            );


        const snapshot =
            await getDoc(
                reference
            );


        if (
            snapshot.exists()
        ) {

            const data =
                snapshot.data();


            currentUserRole =
                data.role ||
                "user";

        } else {

            currentUserRole =
                "user";

        }

    } catch (error) {

        console.error(
            "Current user load error:",
            error
        );


        currentUserRole =
            "user";

    }


    updateAdminCourseUI();

}


/* =========================================================
   SAVE CHAT TO FIRESTORE
========================================================= */

async function saveChatToFirestore(
    userMessage,
    aiResponse
) {

    if (
        !firebaseDb ||
        !firebaseModules ||
        !currentFirebaseUser
    ) {

        return;

    }


    try {

        const {
            collection,
            addDoc,
            serverTimestamp
        } =
            firebaseModules;


        await addDoc(
            collection(
                firebaseDb,
                "chats"
            ),
            {

                uid:
                    currentFirebaseUser.uid,

                email:
                    currentFirebaseUser.email ||
                    "",

                name:
                    currentFirebaseUser.displayName ||
                    "",

                conversationId:
                    currentConversationId,

                message:
                    userMessage,

                response:
                    aiResponse ||
                    "",

                createdAt:
                    serverTimestamp(),

                createdAtClient:
                    Date.now()

            }
        );

    } catch (error) {

        console.error(
            "Save chat Firestore error:",
            error
        );

    }

}


/* =========================================================
   SAVE CONVERSATION MESSAGE
========================================================= */

async function saveConversationMessage(
    userMessage,
    aiResponse
) {

    await saveChatToFirestore(
        userMessage,
        aiResponse
    );

}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                event.key.toLowerCase() ===
                    "k"
            ) {

                event.preventDefault();


                navigateTo(
                    "chat"
                );


                const input =
                    getElement(
                        "chatInput"
                    );


                if (input) {

                    input.focus();

                }

            }


            if (
                event.key ===
                "Escape"
            ) {

                closeMobileSidebar();


                closeCourseModal();


                closeProfileModal();

            }

        }
    );

}


/* =========================================================
   IMAGE ATTACHMENT
========================================================= */

function createImageAttachmentHTML(
    file
) {

    if (!file) {
        return "";
    }


    return `

        <div class="message-attachment">

            🖼️

            <span>

                ${escapeHTML(
                    file.name
                )}

            </span>

        </div>

    `;

}


/* =========================================================
   FILE ATTACHMENT
========================================================= */

function createFileAttachmentHTML(
    file
) {

    if (!file) {
        return "";
    }


    return `

        <div class="message-attachment">

            📎

            <span>

                ${escapeHTML(
                    file.name
                )}

            </span>

        </div>

    `;

}


/* =========================================================
   AUTO RESIZE
========================================================= */

function setupAutoResize() {

    const textareas =
        $$(
            "#chatInput, #homeChatInput, #gisInput, #codeInput"
        );


    textareas.forEach(
        textarea => {

            textarea.addEventListener(
                "input",
                () => {

                    textarea.style.height =
                        "auto";


                    textarea.style.height =
                        Math.min(
                            textarea.scrollHeight,
                            180
                        ) +
                        "px";

                }
            );

        }
    );

}


/* =========================================================
   PREPARE CHAT
========================================================= */

function prepareChatForNavigation() {

    const input =
        getElement(
            "chatInput"
        );


    if (input) {

        setTimeout(
            () => {

                input.focus();

            },
            50
        );

    }

}


/* =========================================================
   GLOBAL ERROR HANDLING
========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "GEO AI Global error:",
            event.error ||
            event.message
        );

    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "GEO AI Promise error:",
            event.reason
        );

    }
);


/* =========================================================
   INITIALIZE GEO AI
========================================================= */

async function initializeGEOAI() {

    console.log(
        "GEO AI initializing..."
    );


    currentConversationId =
        createConversationId();


    setupNavigation();

    setupTheme();

    setupNewChat();

    setupTextareaEnter();

    setupChat();

    setupGIS();

    setupCoding();

    setupStudy();

    setupTests();

    setupFiles();

    setupCourses();

    setupCourseFilterDefault();

    setupHomeActions();

    setupWebSearch();

    setupSettings();

    setupProfile();

    setupLogout();

    setupKeyboardShortcuts();

    setupAutoResize();

    setupSuggestionButtons();


    resetChatMessages();


    loadLocalChat();


    navigateTo(
        "home"
    );


    const firebaseReady =
        await initializeFirebase();


    if (firebaseReady) {

        setupFirebaseAuthListener();


        await loadCurrentFirebaseUser();


        updateAdminCourseUI();


        loadCourses();

    } else {

        console.warn(
            "GEO AI started without Firebase."
        );


        updateAdminCourseUI();

    }


    console.log(
        "GEO AI initialized successfully."
    );

}


/* =========================================================
   START APPLICATION
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeGEOAI
    );

} else {

    initializeGEOAI();

}