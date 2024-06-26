// Dependencies
// Firebase SDK
import { getApps, initializeApp, getApp, FirebaseApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import {
  ref,
  getStorage,
  StorageReference,
  FirebaseStorage,
} from "firebase/storage";

/**
 * Firebase Web SDK service class implementation for interfacing
 * directly with Firebase's many libraries and third-party services
 * such as auth and remote config.
 *
 * Doesn't support Admin, use the server for higher Firebase related privileges.
 */
export default class FirebaseService {
  // Instance Variables
  // App Reference
  app!: FirebaseApp;

  // Default Auth reference
  auth!: Auth;
  // Storage Entity
  storage!: FirebaseStorage;

  // Properties
  fonciiCDNURL = "https://cdn.foncii.com";
  fonciiContentStorageBucketIdentifier = "gs://foncii-content-bucket";

  // Foncii-Maps Project Config
  // Web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  private firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_API_KEY,
    authDomain: "auth.maps.foncii.com",
    projectId: "foncii-maps",
    storageBucket: "foncii-maps.appspot.com",
    messagingSenderId: "387644354356",
    appId: "1:387644354356:web:2098190c2665c9e3c6ff61",
    measurementId: "G-MQ5TMVJN24",
  };

  constructor() {
    // Firebase Web SDK
    // Singleton, ensure the app isn't already initalized by checking if the object is empty or not
    if (!getApps().length) {
      initializeApp({
        ...this.firebaseConfig,
        storageBucket: this.fonciiContentStorageBucketIdentifier,
      });
    }

    // Service References
    this.app = getApp();
    this.auth = getAuth();
    this.storage = getStorage(
      this.app,
      this.fonciiContentStorageBucketIdentifier
    );
  }

  /**
   * Creates a storage reference to the object located at the specified path within the target storage bucket
   * (if not the default CDN option)
   *
   * @param storageBucketIdentifier -> Optional custom storage bucket identifier, leave blank to use the default CDN identifier
   * @param path -> Path to the target resource to upload, download, or delete
   *
   * @returns A storage reference to the object located at the specified path within the target storage bucket
   */
  getRefForObject({
    storageBucketIdentifier = this.fonciiContentStorageBucketIdentifier,
    filePath,
  }: {
    storageBucketIdentifier?: string;
    filePath: string;
  }): StorageReference {
    return ref(getStorage(this.app, storageBucketIdentifier), filePath);
  }
}
