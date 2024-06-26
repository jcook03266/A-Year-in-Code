import { Auth } from 'firebase-admin/auth';
import { Storage } from 'firebase-admin/storage';
/**
 * Service layer for interfacing with firebase services such as Firestore, and the AdminSDK in an authenticated environment
 * See documentation here: https://firebase.google.com/docs/admin/setup
 */
export declare class FirebaseService {
    #private;
    db: FirebaseFirestore.Firestore;
    auth: Auth;
    storage: Storage;
    fonciiCDNURL: string;
    fonciiContentStorageBucketIdentifier: string;
    admin: any;
    constructor();
}
