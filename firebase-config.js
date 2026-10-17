const firebaseConfig = {
    apiKey: "AIzaSyD2aUDiw01E9CGBPBdWDZQdnBFbV4yD_FE",
    authDomain: "gh-chess-cup.firebaseapp.com",
    databaseURL: "https://gh-chess-cup-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gh-chess-cup",
    storageBucket: "gh-chess-cup.firebasestorage.app",
    messagingSenderId: "708894541313",
    appId: "1:708894541313:web:784305049f87f423a96200",
    measurementId: "G-3GT405E6BJ"
};

// Initialize Firebase (Compat mode for plain browser scripts)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
