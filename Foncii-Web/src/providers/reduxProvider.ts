"use client";
// Using Client Directive b/c this is a client-side state management library
// Dependencies
// Redux
import store from "../redux/store";
import { Provider } from "react-redux";

// Initializes a redux provider associated with the global store provided
// which cascades down through its children components. Note: The store and provider itself
// is accessible to client components only.
export default function ReduxProvider({ children }: any) {
  return Provider({ store, children });
}
