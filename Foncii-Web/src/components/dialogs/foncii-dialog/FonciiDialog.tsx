/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Framework
import ReactDOM from "react-dom";

// Hooks
import { useEffect } from "react";
import { useListeners } from "../../../hooks/UseListeners";

// Types
interface FonciiDialogProps {
  children?: React.ReactNode;
  onDismiss: () => void;
}

/**
 * A reusable base for all modals to use across this application,
 * fit with an opaque background, close on key actions and other
 * useful features.
 */
export default function FonciiDialog({
  children,
  onDismiss,
}: FonciiDialogProps) {
  // Listeners
  const listeners = useListeners();

  // State Management
  // Key press events
  useEffect(() => {
    // Event listener for key down events on the document
    document.addEventListener("keydown", listeners.onEscapeKeyPress(onDismiss));

    // Cleanup: remove event listener when the component unmounts
    return () => {
      document.removeEventListener(
        "keydown",
        listeners.onEscapeKeyPress(onDismiss)
      );
    };
  }, []); // Run this effect only once

  // Subcomponents
  const Overlay = (): React.ReactNode => {
    return (
      <button
        className={`bg-opacity-80 bg-black backdrop-blur-md absolute h-full w-full cursor-pointer`}
        onClick={onDismiss}
      />
    );
  };

  // Note: Z-index is double the usual detail view / modal's z-index such that it can appear on top of modals
  return ReactDOM.createPortal(
    <div
      className={`flex justify-center z-[200000] top-0 left-0 fixed h-full w-full items-center content-center`}
      tabIndex={0} // Global attribute that allows an HTML element to receive focus
      aria-description="Dialog"
    >
      {Overlay()}
      {children}
    </div>,
    document.body
  );
}
