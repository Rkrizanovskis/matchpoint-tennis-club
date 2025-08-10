// Firebase Configuration for Matchpoint Tennis Club
const firebaseConfig = {
  apiKey: "AIzaSyB-qLLcm3_oKk1soGsSQui38dM-9M8BN14",
  authDomain: "matchpoint-e5b00.firebaseapp.com",
  projectId: "matchpoint-e5b00",
  storageBucket: "matchpoint-e5b00.firebasestorage.app",
  messagingSenderId: "145208722794",
  appId: "1:145208722794:web:b6f46e386445321019d113"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const auth = firebase.auth();

// Sign in anonymously when the page loads
auth.signInAnonymously()
  .then(() => {
    console.log('Signed in anonymously');
  })
  .catch((error) => {
    console.error('Error signing in:', error);
  });

// Helper function to get session ID
function getSessionId(date, day, time) {
  return `${date}-${day}-${time}`;
}

// Helper function to format date
function formatDateForId(date) {
  return date.toISOString().split('T')[0];
}

// Helper function to get week start date (Monday)
function getWeekStartDate(weekOffset = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Adjust to Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Helper function to get week end date (Thursday)
function getWeekEndDate(weekOffset = 0) {
  const monday = getWeekStartDate(weekOffset);
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3); // Monday + 3 = Thursday
  thursday.setHours(23, 59, 59, 999);
  return thursday;
}
