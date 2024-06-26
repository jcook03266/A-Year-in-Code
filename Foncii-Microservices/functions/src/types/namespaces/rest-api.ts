    /** Reusable REST API Type Definitions */
    export type RequestHeaderArgument = string | string[] | undefined;

        export enum HTTPStatusCodes {
            /** The request succeeded. The result meaning of "success" depends on the method (query, mutation etc) */
            OK = 200,
            /** The request succeeded, and a new resource was created as a result. */
            CREATED = 201,
            /* The requested resource has been moved to a new location, and the client should direct their request to the new location */
            REDIRECTED = 301,
            /** The server cannot or will not process the request due to something that is perceived to be a client error */
            BAD_REQUEST = 400,
            /** 
             * Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated". That is, the client must authenticate 
             * itself to get the requested response.
             */
            UNAUTHORIZED = 401,
            /** 
             * The client does not have access rights to the content; that is, it is unauthorized, so the server is refusing to give the requested resource. 
             * Unlike 401 Unauthorized, the client's identity is known to the server. 
             */
            FORBIDDEN = 403,
            /**
             * The server cannot find the requested resource. In the browser, this means the URL is not recognized.
             * Note: Servers may also send this response instead of 403 Forbidden to hide the existence of a resource from an unauthorized client.
             */
            NOT_FOUND = 404,
            /** The server has encountered a situation it does not know how to handle. */
            INTERNAL_SERVER_ERROR = 500
}