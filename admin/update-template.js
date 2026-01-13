// Script to update Firebase template directly
// Run with: node update-template.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB-qLLcm3_oKk1soGsSQui38dM-9M8BN14",
  authDomain: "matchpoint-e5b00.firebaseapp.com",
  projectId: "matchpoint-e5b00",
  storageBucket: "matchpoint-e5b00.firebasestorage.app",
  messagingSenderId: "145208722794",
  appId: "1:145208722794:web:b6f46e386445321019d113"
};

// New template data - January 2026 to April 2026
const NEW_TEMPLATE = {
  tuesday: {
    '20:00-21:00': {
      players: ['Viktorija', 'Rita', 'Nikola', 'Liza'],
      instructor: 'Paša'
    },
    '21:00-22:00': {
      players: ['Karīna', 'Jūlija', 'Sintija', 'Valdis', 'Līva'],
      instructor: 'Paša'
    }
  },
  thursday: {
    '20:00-21:00': {
      players: ['Agnese', 'Kristaps', 'Elza', 'Aivars', 'Arta'],
      instructor: 'Justīne'
    },
    '21:00-22:00': {
      players: ['Edgars', 'Klāvs', 'Jānis', 'Ričards'],
      instructor: 'Justīne'
    }
  },
  createdAt: new Date().toISOString(),
  sourceWeek: '2026-01-02',
  seasonStart: '2026-01-02',
  seasonEnd: '2026-04-30',
  description: 'January - April 2026 Season'
};

async function updateTemplate() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('Connecting to Firebase...');
    
    // Get current template first
    const templateRef = doc(db, 'seasonTemplate', 'default');
    const currentDoc = await getDoc(templateRef);
    
    if (currentDoc.exists()) {
      console.log('\n📋 Current template:');
      console.log(JSON.stringify(currentDoc.data(), null, 2));
    }
    
    // Set new template
    console.log('\n⏳ Setting new template...');
    await setDoc(templateRef, NEW_TEMPLATE);
    
    console.log('\n✅ Template updated successfully!');
    console.log('\n📋 New template:');
    console.log(JSON.stringify(NEW_TEMPLATE, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateTemplate();
