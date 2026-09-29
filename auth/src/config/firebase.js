import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  browserLocalPersistence,
  getReactNativePersistence,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
 
const firebaseConfig = {
  apiKey: "AIzaSyBHKXjGOaV01wuFN4MIwo3P9TQP4CB0PgI",
  authDomain: "batata-72b32.firebaseapp.com",
  databaseURL: "https://batata-72b32-default-rtdb.firebaseio.com",
  projectId: "batata-72b32",
  storageBucket: "batata-72b32.firebasestorage.app",
  messagingSenderId: "627417879175",
  appId: "1:627417879175:web:07800e509fcb0067c65e22",
  measurementId: "G-C8T8PX4079"
};
 
const app = initializeApp(firebaseConfig);
 
const persistence =
  Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage);
 
const auth = initializeAuth(app, { persistence });
const database = getDatabase(app);
 
export { auth, database };