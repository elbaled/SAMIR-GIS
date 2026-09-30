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


        firebaseReady =
            false;

    }

}


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (id) =>
    document.getElementById(id);


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(text) {

    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   ESCAPE CODE
   ========================================================= */

function escapeCode(code) {

    return String(code ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   NOTIFICATION
   ========================================================= */

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


/* =========================================================
   SCROLL CHAT
   ========================================================= */

function scrollChatToBottom() {

    const chat =
        $("chatMessages");


    if (chat) {

        chat.scrollTop =
            chat.scrollHeight;

    }

}


/* =========================================================
   GET CHAT CONTAINER
   ========================================================= */

function getChatContainer() {

    return (
        $("chatMessages") ||
        document.querySelector(
            "#chatMessages"
        )
    );

}


/* =========================================================
   FILE HELPERS
   ========================================================= */

function getFileExtension(
    fileName
) {

    return String(fileName || "")
        .split(".")
        .pop()
        .toLowerCase();

}


/* =========================================================
   TRUNCATE FILE TEXT
   ========================================================= */

function truncateFileText(
    text
) {

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

function readTXTFile(
    file
) {

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

async function readDOCXFile(
    file
) {

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

async function readPDFFile(
    file
) {

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
   READ SUPPORTED FILE
   ========================================================= */

async function extractFileText(
    file
) {

    if (!file) {

        throw new Error(
            "لم يتم اختيار ملف."
        );

    }


    const extension =
        getFileExtension(
            file.name
        );


    if (
        extension === "txt"
    ) {

        return await readTXTFile(
            file
        );

    }


    if (
        extension === "pdf"
    ) {

        return await readPDFFile(
            file
        );

    }


    if (
        extension === "docx"
    ) {

        return await readDOCXFile(
            file
        );

    }


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


    selectedFile:
        null,


    selectedFileText:
        "",


    selectedFileName:
        "",


    selectedFileType:
        "",


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


/* =========================================================
   RENDER SAVED CHAT
   ========================================================= */

function renderSavedChat() {

    const container =
        getChatContainer();


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
   GEO AI SMART MARKDOWN RENDERER
   ========================================================= */

let geoCodeCounter =
    0;


/* =========================================================
   DETECT CODE LANGUAGE
   ========================================================= */

function normalizeCodeLanguage(
    language
) {

    const lang =
        String(
            language || ""
        )
        .trim()
        .toLowerCase();


    const languages = {

        py:
            "Python",

        python:
            "Python",

        python3:
            "Python",

        js:
            "JavaScript",

        javascript:
            "JavaScript",

        jsx:
            "JSX",

        ts:
            "TypeScript",

        typescript:
            "TypeScript",

        html:
            "HTML",

        css:
            "CSS",

        sql:
            "SQL",

        json:
            "JSON",

        xml:
            "XML",

        bash:
            "Bash",

        sh:
            "Shell",

        shell:
            "Shell",

        powershell:
            "PowerShell",

        ps:
            "PowerShell",

        java:
            "Java",

        c:
            "C",

        cpp:
            "C++",

        "c++":
            "C++",

        cs:
            "C#",

        "c#":
            "C#",

        php:
            "PHP",

        go:
            "Go",

        rust:
            "Rust",

        ruby:
            "Ruby",

        kotlin:
            "Kotlin",

        swift:
            "Swift",

        r:
            "R",

        matlab:
            "MATLAB",

        arcpy:
            "ArcPy",

        qgis:
            "QGIS / Python"

    };


    return (
        languages[lang] ||
        (
            language
                ? String(language).trim()
                : "Code"
        )
    );

}


/* =========================================================
   MARKDOWN RENDERER
   ========================================================= */

function renderGeoMarkdown(
    text
) {

    let source =
        String(text ?? "");


    const codeBlocks =
        [];


    /*
       ======================================================
       حفظ أكواد Markdown أولاً
       ======================================================
    */

    source =
        source.replace(
            /```([a-zA-Z0-9_+#.-]*)\s*\n?([\s\S]*?)```/g,
            function (
                _,
                language,
                code
            ) {

                const id =
                    `geo-code-${Date.now()}-${geoCodeCounter++}`;


                const lang =
                    normalizeCodeLanguage(
                        language
                    );


                const cleanCode =
                    code
                        .replace(
                            /^\n/,
                            ""
                        )
                        .replace(
                            /\n$/,
                            ""
                        );


                codeBlocks.push({

                    id,

                    language:
                        lang,

                    code:
                        cleanCode

                });


                return `___GEO_CODE_${codeBlocks.length - 1}___`;

            }
        );


    /*
       ======================================================
       دعم الحالات التي يرسل فيها AI كوداً بدون ``` 
       ======================================================
    */

    source =
        source.replace(
            /(?:^|\n)(?:Python|python)\s*:\s*\n([\s\S]*?)(?=\n(?:شرح|Explanation|JavaScript|SQL|Python)\s*:|$)/g,
            function (
                _,
                code
            ) {

                const cleanCode =
                    String(code)
                        .trim();


                if (
                    !cleanCode
                ) {

                    return _;

                }


                const id =
                    `geo-code-${Date.now()}-${geoCodeCounter++}`;


                codeBlocks.push({

                    id,

                    language:
                        "Python",

                    code:
                        cleanCode

                });


                return `\n___GEO_CODE_${codeBlocks.length - 1}___\n`;

            }
        );


    /*
       ======================================================
       Escape باقي النص
       ======================================================
    */

    source =
        escapeHTML(
            source
        );


    /*
       ======================================================
       العناوين
       ======================================================
    */

    source =
        source.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );


    source =
        source.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );


    source =
        source.replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        );


    /*
       ======================================================
       Bold
       ======================================================
    */

    source =
        source.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    /*
       ======================================================
       Italic
       ======================================================
    */

    source =
        source.replace(
            /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
            "<em>$1</em>"
        );


    /*
       ======================================================
       Inline Code
       ======================================================
    */

    source =
        source.replace(
            /`([^`\n]+)`/g,
            `<code class="geo-inline-code">$1</code>`
        );


    /*
       ======================================================
       القوائم
       ======================================================
    */

    source =
        source.replace(
            /^[•*-]\s+(.*)$/gm,
            `<div class="geo-list-item">• $1</div>`
        );


    source =
        source.replace(
            /^\d+\.\s+(.*)$/gm,
            `<div class="geo-list-item">$1</div>`
        );


    /*
       ======================================================
       عناوين الشرح
       ======================================================
    */

    source =
        source.replace(
            /^(شرح الكود:?)$/gim,
            `<div class="geo-code-explanation-title">$1</div>`
        );


    source =
        source.replace(
            /^(Explanation:?)$/gim,
            `<div class="geo-code-explanation-title">$1</div>`
        );


    /*
       ======================================================
       فواصل الأسطر
       ======================================================
    */

    source =
        source.replace(
            /\n/g,
            "<br>"
        );


    /*
       ======================================================
       استرجاع أكواد البرمجة
       ======================================================
    */

    codeBlocks.forEach(
        (
            block,
            index
        ) => {

            const escapedCode =
                escapeCode(
                    block.code
                );


            const codeHTML = `

                <div
                    class="geo-code-wrapper"
                    data-code-id="${block.id}"
                >

                    <div
                        class="geo-code-header"
                    >

                        <span
                            class="geo-code-language"
                        >
                            ${escapeHTML(block.language)}
                        </span>


                        <button
                            type="button"
                            class="geo-copy-code"
                            data-code-id="${block.id}"
                        >
                            📋 نسخ الكود
                        </button>

                    </div>


                    <pre
                        class="geo-code-pre"
                    ><code>${escapedCode}</code></pre>

                </div>

            `;


            source =
                source.replace(
                    `___GEO_CODE_${index}___`,
                    codeHTML
                );

        }
    );


    return source;

}


/* =========================================================
   COPY CODE
   ========================================================= */

async function copyGeoCode(
    codeId,
    button
) {

    const wrapper =
        document.querySelector(
            `[data-code-id="${codeId}"]`
        );


    if (!wrapper) {

        return;

    }


    const codeElement =
        wrapper.querySelector(
            "code"
        );


    if (!codeElement) {

        return;

    }


    const code =
        codeElement.textContent;


    try {

        await navigator.clipboard.writeText(
            code
        );


        const oldText =
            button.textContent;


        button.textContent =
            "✅ تم النسخ";


        button.classList.add(
            "copied"
        );


        setTimeout(
            () => {

                button.textContent =
                    oldText;


                button.classList.remove(
                    "copied"
                );

            },
            1800
        );


    } catch (error) {

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            code;


        textarea.style.position =
            "fixed";


        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.select();


        try {

            document.execCommand(
                "copy"
            );


            button.textContent =
                "✅ تم النسخ";


            setTimeout(
                () => {

                    button.textContent =
                        "📋 نسخ الكود";

                },
                1800
            );


        } catch (copyError) {

            showNotification(
                "لم أستطع نسخ الكود تلقائيًا.",
                "!"
            );

        }


        textarea.remove();

    }

}


/* =========================================================
   CODE COPY EVENTS
   ========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                ".geo-copy-code"
            );


        if (!button) {

            return;

        }


        const codeId =
            button.dataset.codeId;


        copyGeoCode(
            codeId,
            button
        );

    }
);


/* =========================================================
   MESSAGE UI
   ========================================================= */

function addMessageToUI(
    role,
    content,
    save = true
) {

    const container =
        getChatContainer();


    if (!container) {

        return null;

    }


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


    const renderedContent =
        role === "assistant"
            ? renderGeoMarkdown(
                content
            )
            : escapeHTML(
                content
            ).replace(
                /\n/g,
                "<br>"
            );


    message.innerHTML = `

        <div class="message-avatar">
            ${
                role === "user"
                    ? "أ"
                    : "🤖"
            }
        </div>


        <div class="message-content">

            ${renderedContent}

        </div>

    `;


    container.appendChild(
        message
    );


    scrollChatToBottom();


    if (save) {

        state.currentChat.push({

            role:
                role,

            content:
                String(
                    content ?? ""
                )

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
    imageName
) {

    const container =
        getChatContainer();


    if (!container) {

        return null;

    }


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
        "message user-message";


    message.innerHTML = `

        <div class="message-avatar">
            أ
        </div>


        <div class="message-content">

            <div
                style="
                    display:flex;
                    flex-direction:column;
                    gap:8px;
                "
            >

                <img
                    src="${imageData}"
                    alt="${escapeHTML(
                        imageName || "صورة"
                    )}"
                    style="
                        max-width:100%;
                        max-height:320px;
                        border-radius:12px;
                        object-fit:contain;
                    "
                >

                <small>
                    📷 ${escapeHTML(
                        imageName || "صورة"
                    )}
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
        (
            resolve,
            reject
        ) => {

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
           ==================================================
           مهم:
           لا نستخدم textContent هنا
           لأننا نريد تحويل Markdown إلى صندوق كود.
           ==================================================
        */

        if (loadingMessage) {

            const content =
                loadingMessage.querySelector(
                    ".message-content"
                );


            if (content) {

                content.innerHTML =
                    renderGeoMarkdown(
                        finalAnswer
                    );

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

                content.innerHTML = `

                    <div class="geo-error-message">

                        ❌
                        ${escapeHTML(
                            error.message
                        )}

                    </div>

                `;

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
                ) {

                    return;

                }


                const request =
                    input.value.trim();


                if (!request) {

                    showNotification(
                        "اكتب المطلوب من AI أولاً",
                        "!"
                    );


                    return;

                }


                output.innerHTML = `

                    <div
                        class="geo-coding-loading"
                    >
                        🤖 جاري إنشاء الكود...
                    </div>

                `;


                try {

                    const answer =
                        await askAI(
                            `أنت مساعد برمجة متخصص.\n` +
                            `لغة البرمجة: ${state.selectedCodingLanguage}\n\n` +
                            `المطلوب:\n${request}\n\n` +
                            `اكتب الكود داخل Markdown code block باستخدام ``` مع اسم اللغة، وبعد صندوق الكود اكتب شرحاً مختصراً منفصلاً. ` +
                            `لا تضع الشرح أو التعليقات العربية داخل الكود إلا إذا طلب المستخدم ذلك صراحة.`
                        );


                    output.innerHTML =
                        renderGeoMarkdown(
                            answer ||
                            "لم يتم إنشاء الكود."
                        );


                } catch (error) {

                    output.innerHTML = `

                        <div
                            class="geo-error-message"
                        >

                            ❌
                            ${escapeHTML(
                                error.message
                            )}

                        </div>

                    `;

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


                const code =
                    output.querySelector(
                        ".geo-code-wrapper code"
                    );


                if (!code) {

                    showNotification(
                        "لا يوجد كود لنسخه",
                        "!"
                    );


                    return;

                }


                try {

                    await navigator
                        .clipboard
                        .writeText(
                            code.textContent
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


        showNotification(
            `تمت قراءة الملف بنجاح: ${file.name}`,
            "✓"
        );


        updateLatestFileStatus(
            "✓ تمت القراءة"
        );


        openSection(
            "chat"
        );


        addMessageToUI(
            "assistant",
            `📚 تم تحميل الملف "${file.name}" بنجاح.\n\nأقدر الآن أساعدك في:\n- تلخيصه\n- شرحه\n- استخراج التعريفات\n- إنشاء أسئلة\n- إنشاء اختبار\n- الإجابة عن أسئلتك من محتواه`
        );


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
                ${escapeHTML(
                    file.name
                )}
            </strong>


            <small>
                ${formatFileSize(
                    file.size
                )}
                •
                ${escapeHTML(
                    status
                )}
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
                    ${escapeHTML(
                        subject
                    )}...

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
                            ${escapeHTML(
                                subject
                            )}
                        </h2>


                        <div class="test-content">

                            ${renderGeoMarkdown(
                                answer
                            )}

                        </div>

                    </div>

                `;


            } catch (error) {

                container.innerHTML = `

                    <div class="test-error">

                        ❌
                        ${escapeHTML(
                            error.message
                        )}

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
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
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
