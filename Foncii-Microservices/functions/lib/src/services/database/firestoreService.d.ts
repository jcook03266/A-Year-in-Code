import { FirebaseService } from '../firebase-admin/firebaseAdminService';
export declare class FirestoreServiceAdapter extends FirebaseService {
    constructor();
    /**
     * Fetches the document with the given ID from the target collection
     *
     * @async
     * @param documentID
     * @param collectionName
     * @returns -> Firestore document data or undefined if the given argument was invalid
     */
    fetchDocumentWithID(documentID: string, collectionName: string): Promise<{
        [x: string]: any;
    } | undefined>;
    /**
     * Determines if the document with the given ID exists in the target collection
     *
     * @async
     * @param documentID
     * @param collectionName
     * @returns -> True if the document exists, false otherwise
     */
    doesDocumentWithIDExist(documentID: string, collectionName: string): Promise<boolean>;
    /**
     * Creates a new document with an auto-generated document ID
     * in the specified collection, using the given data
     *
     * @async
     * @param data
     * @param collectionName
     */
    createNewDocument(data: {
        [x: string]: any;
    }, collectionName: string): Promise<void>;
    /**
     * Creates a new document with the specified document ID
     * in the target collection, using the given data
     *
     * @async
     * @param documentID
     * @param data
     * @param collectionName
     */
    createNewDocumentWithID(documentID: string, data: {
        [x: string]: any;
    }, collectionName: string): Promise<void>;
    /**
     * Updates the document with the specified document ID
     * in the target collection, using the given data
     *
     * @async
     * @param documentID
     * @param data
     * @param collectionName
     * @param includeUndefined -> True if  undefined properties should be included in the update which will
     * remove the fields they're associated with, false if those undefined properties should be trimmed (default)
     */
    updateDocumentWithID(documentID: string, data: {
        [x: string]: any;
    }, collectionName: string, includeUndefined?: boolean): Promise<void>;
    /**
     * Deletes the document with the given id in the target collection
     *
     * @async
     * @param documentID
     * @param collectionName
     */
    deleteDocumentWithID(documentID: string, collectionName: string): Promise<void>;
    /**
     * Deletes the specified field in the target document within
     * the given collection
     *
     * @async
     * @param fieldName
     * @param collectionName
     * @param documentID
     */
    deleteFieldWithNameIn(fieldName: string, collectionName: string, documentID: string): Promise<void>;
}
