const firebaseConfig = {
    apiKey: "AIzaSyAPdSJCOHnhwrSyLLL7ftf8TmnDQRY2pr4",
    authDomain: "gh-chess-cup.firebaseapp.com",
    databaseURL: "https://gh-chess-cup-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gh-chess-cup",
    storageBucket: "gh-chess-cup.firebasestorage.app",
    messagingSenderId: "708894541313",
    appId: "1:708894541313:web:22b547038626da34a96200",
    measurementId: "G-KMFZETLH0M"
};

// Initialize Firebase (Compat mode for plain browser scripts)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
