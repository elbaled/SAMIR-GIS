// ==========================================
// Ahmed AI - Firebase Configuration
// ==========================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// Firebase configuration

const firebaseConfig = {
    apiKey: "AIzaSyDL9xUDi2pm66m5Ow85c0feZs4btaoPgEo",
    authDomain: "ahmed-c5cdf.firebaseapp.com",
    projectId: "ahmed-c5cdf",
    storageBucket: "ahmed-c5cdf.firebasestorage.app",
    messagingSenderId: "4671644989",
    appId: "1:4671644989:web:886b792cae0d95a58c9154",
    measurementId: "G-ST0VNS98E7"
};


// Initialize Firebase

const app = initializeApp(firebaseConfig);


// Firebase Authentication

const auth = getAuth(app);


// Cloud Firestore

const db = getFirestore(app);


// Export

export {
    app,
    auth,
    db
};
