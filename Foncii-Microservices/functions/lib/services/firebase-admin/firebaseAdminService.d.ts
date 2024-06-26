import { Auth } from 'firebase-admin/auth';
import { Storage } from 'firebase-admin/storage';
/**
 * Service layer for interfacing with firebase services such as Cloud Storage, and the AdminSDK in an authenticated environment
 * See documentation here: https://firebase.google.com/docs/admin/setup
 *
 * Note: Firebase-Admin is for server use only, this SDK is not allowed on clients for obvious reasons, due to the high privileges
 * granted. It's always best to assume the client is not secure.
 */
export declare class FirebaseAdminService {
    #private;
    auth: Auth;
    storage: Storage;
    fonciiCDNURL: string;
    fonciiContentStorageBucketIdentifier: string;
    constructor();
}
