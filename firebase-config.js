// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLyoIoXp2aJCnhFqIFufMVBz0fzCS-FYY",
  authDomain: "game-303eb.firebaseapp.com",
  databaseURL: "https://game-303eb-default-rtdb.firebaseio.com",
  projectId: "game-303eb",
  storageBucket: "game-303eb.firebasestorage.app",
  messagingSenderId: "22261863844",
  appId: "1:22261863844:web:66f8541079b9025ec69d31",
  measurementId: "G-RKN2F3HVHS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();
const analytics = firebase.analytics();