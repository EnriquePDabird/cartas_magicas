// Your web app's Firebase configuration
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
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();