// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDEnh1mNuobAQrNQ-2ppJw99VvCfzHK7oo",
    authDomain: "trucos-de-magia-1b611.firebaseapp.com",
    projectId: "trucos-de-magia-1b611",
    storageBucket: "trucos-de-magia-1b611.firebasestorage.app",
    messagingSenderId: "792039814604",
    appId: "1:792039814604:web:5a9bc1c1c523ad9e97d969",
    measurementId: "G-EHVL29M2GE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, auth };