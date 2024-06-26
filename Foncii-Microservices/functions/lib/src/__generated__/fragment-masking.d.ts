import { ResultOf, DocumentTypeDecoration, TypedDocumentNode } from '@graphql-typed-document-node/core';
import { Incremental } from './graphql';
export type FragmentType<TDocumentType extends DocumentTypeDecoration<any, any>> = TDocumentType extends DocumentTypeDecoration<infer TType, any> ? [TType] extends [{
    ' $fragmentName'?: infer TKey;
}] ? TKey extends string ? {
    ' $fragmentRefs'?: {
        [key in TKey]: TType;
    };
} : never : never : never;
export declare function useFragment<TType>(_documentNode: DocumentTypeDecoration<TType, any>, fragmentType: FragmentType<DocumentTypeDecoration<TType, any>>): TType;
export declare function useFragment<TType>(_documentNode: DocumentTypeDecoration<TType, any>, fragmentType: FragmentType<DocumentTypeDecoration<TType, any>> | null | undefined): TType | null | undefined;
export declare function useFragment<TType>(_documentNode: DocumentTypeDecoration<TType, any>, fragmentType: ReadonlyArray<FragmentType<DocumentTypeDecoration<TType, any>>>): ReadonlyArray<TType>;
export declare function useFragment<TType>(_documentNode: DocumentTypeDecoration<TType, any>, fragmentType: ReadonlyArray<FragmentType<DocumentTypeDecoration<TType, any>>> | null | undefined): ReadonlyArray<TType> | null | undefined;
export declare function makeFragmentData<F extends DocumentTypeDecoration<any, any>, FT extends ResultOf<F>>(data: FT, _fragment: F): FragmentType<F>;
export declare function isFragmentReady<TQuery, TFrag>(queryNode: DocumentTypeDecoration<TQuery, any>, fragmentNode: TypedDocumentNode<TFrag>, data: FragmentType<TypedDocumentNode<Incremental<TFrag>, any>> | null | undefined): data is FragmentType<typeof fragmentNode>;
