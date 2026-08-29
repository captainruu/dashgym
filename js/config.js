// ============================================================
// FIREBASE FIRESTORE — DASH DATABASE
// ============================================================
import { initializeApp }    from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
// Supabase is used ONLY for Storage (artwork uploads).
// Firestore + Firebase Auth remain unchanged for everything else.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {
  getFirestore, collection, doc,
  getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy, where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDxdtR7DBRxbvPXk_b3pkpKjrVD51jMjIw",
  authDomain:        "dash-gym-database.firebaseapp.com",
  projectId:         "dash-gym-database",
  storageBucket:     "dash-gym-database.firebasestorage.app",
  messagingSenderId: "61684725609",
  appId:             "1:61684725609:web:a7ce6ed1aa662e3ed0aff8"
};

const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const auth    = getAuth(app);
const SUPABASE_URL = "https://wcdrzubeaxazddxdaaub.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZHJ6dWJlYXhhemRkeGRhYXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzAyMDIsImV4cCI6MjEwMzMwNjIwMn0.Jsd6YsskU2EAlyFyVcufcXQ0-2eQRvMdA9K8fKP-9Kc";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const PROMO_BUCKET = "promos";

// Logo assets — now real files instead of embedded base64
// (paths are relative to any page at the project root)
const LOGO_GOLD_URL  = "assets/images/logo-gold.png";
const LOGO_WHITE_URL = "assets/images/logo-white.png";

// ============================================================
// DEFAULT DATA
// ============================================================
const DEFAULT_PACKAGES = [
  {id:'daily1',    name:'1 Day',     nameId:'1 Hari',    price:270000,   days:1,   promo:'',            featured:false},
  {id:'daily2',    name:'2 Days',    nameId:'2 Hari',    price:470000,   days:2,   promo:'',            featured:false},
  {id:'daily3',    name:'3 Days',    nameId:'3 Hari',    price:670000,   days:3,   promo:'',            featured:false},
  {id:'week1',     name:'1 Week',    nameId:'1 Minggu',  price:1100000,  days:7,   promo:'',            featured:false},
  {id:'week2',     name:'2 Weeks',   nameId:'2 Minggu',  price:1500000,  days:14,  promo:'',            featured:false},
  {id:'week3',     name:'3 Weeks',   nameId:'3 Minggu',  price:1800000,  days:21,  promo:'',            featured:false},
  {id:'month1',    name:'1 Month',   nameId:'1 Bulan',   price:2300000,  days:30,  promo:'',            featured:true},
  {id:'month2',    name:'2 Months',  nameId:'2 Bulan',   price:3500000,  days:60,  promo:'',            featured:false},
  {id:'month3',    name:'3 Months',  nameId:'3 Bulan',   price:4700000,  days:90,  promo:'',            featured:false},
  {id:'member6',   name:'6 Months Membership',  nameId:'Membership 6 Bulan',  price:9500000,  days:180, promo:'Unlimited gym access + classes', featured:false},
  {id:'member9',   name:'9 Months Membership',  nameId:'Membership 9 Bulan',  price:13500000, days:270, promo:'Unlimited gym access + classes', featured:false},
  {id:'member12',  name:'12 Months Membership', nameId:'Membership 12 Bulan', price:15500000, days:365, promo:'Best Value — Unlimited gym access + classes', featured:false},
];


export { db, auth, supabase, PROMO_BUCKET, DEFAULT_PACKAGES, LOGO_GOLD_URL, LOGO_WHITE_URL, signInWithEmailAndPassword, signOut, onAuthStateChanged, collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, where };
