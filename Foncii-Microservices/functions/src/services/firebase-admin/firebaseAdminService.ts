// Dependencies
// Firebase-Admin SDK 
import { getApps } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import { Storage, getStorage } from 'firebase-admin/storage';

/**
 * Service layer for interfacing with firebase services such as Cloud Storage, and the AdminSDK in an authenticated environment
 * See documentation here: https://firebase.google.com/docs/admin/setup
 * 
 * Note: Firebase-Admin is for server use only, this SDK is not allowed on clients for obvious reasons, due to the high privileges
 * granted. It's always best to assume the client is not secure.
 */
export class FirebaseAdminService {
    // Instance Variables
    // Default Auth reference
    auth!: Auth;
    // Storage Bucket Reference
    storage!: Storage;

    // Properties 
    #serviceAccount = JSON.parse(process.env.ADMIN_SDK_CERT);
    fonciiCDNURL = process.env.FONCII_CDN_URL;
    fonciiContentStorageBucketIdentifier = process.env.CLOUD_STORAGE_BUCKET_URL;

    constructor() {
        this.#setup();
    }

    // Create firebase app and specify auth certs and properties
    #setup() {
        // Singleton, ensure the app isn't already initalized by checking if the object is empty or not
        if (!getApps().length) {
            initializeApp({
                    credential: credential.cert(this.#serviceAccount),
                    storageBucket: this.fonciiContentStorageBucketIdentifier
                });
        }

        this.auth = getAuth();
        this.storage = getStorage();
    }
}