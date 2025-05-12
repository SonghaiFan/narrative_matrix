// Mock Firebase implementation
console.log("Using mock Firebase implementation");

// Create a mock Firestore database object
export const db = {
  collection: () => console.log("Mock: db.collection called"),
  doc: () => console.log("Mock: db.doc called"),
};

// This file needs to export something that matches the shape expected by firebase-operations.ts,
// but we're not actually connecting to Firebase in this simplified version
