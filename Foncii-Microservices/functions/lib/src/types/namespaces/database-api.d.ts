/**
 * Type definitions specific to our firebase database implementation
 * and other database-related code.
 */
/** Various supported NoSQL collections in our database */
export declare enum FonciiDatabaseCollections {
    fmPosts = "FM Posts",
    fmUsers = "FM Users",
    fonciiUsers = "Users"
}
/** Operators for constructing query clauses */
export declare enum FirestoreQueryOperators {
    equals = "==",
    doesNotEqual = "!=",
    greaterThanOrEqualTo = ">=",
    lessThanOrEqualTo = "<=",
    greaterThan = ">",
    lessThan = "<",
    /** Filters base on multiple items using OR operator */
    arrayContainsAny = "array-contains-any",
    /** Filters based on single item */
    arrayContains = "array-contains",
    in = "in"
}
export declare enum SortOrders {
    ascending = "asc",
    descending = "desc"
}
