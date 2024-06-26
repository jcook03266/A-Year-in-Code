/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Framework
import ReactDOM from "react-dom";

// Hooks
import { useEffect } from "react";
import { useListeners } from "../../../hooks/UseListeners";

// Animation
import { AnimatePresence, motion } from "framer-motion";

// Utils
import { cn } from "../../../utilities/development/DevUtils";

// Types
interface FonciiModalProps {
  children?: React.ReactNode;
  onDismiss?: () => void;
  /** True if the user can tap the background overlay to dismiss the modal, false otherwise, default is true */
  dismissableOverlay?: boolean;
  /** True if the modal is currently being presented, false otherwise, false by default */
  isPresented?: boolean;
}

/**
 * A reusable base for all modals to use across this application,
 * fit with an opaque background, close on key actions and other
 * useful features.
 */
export default function FonciiModal({
  children,
  onDismiss,
  dismissableOverlay = true,
  isPresented = false,
}: FonciiModalProps) {
  // Listeners
  const listeners = useListeners();

  // State Management
  // Key press events
  useEffect(() => {
    const unwrappedDismissClosure = onDismiss ?? (() => {});

    // Event listener for key down events on the document
    document.addEventListener(
      "keydown",
      listeners.onEscapeKeyPress(unwrappedDismissClosure)
    );

    // Cleanup: remove event listener when the component unmounts
    return () => {
      document.removeEventListener(
        "keydown",
        listeners.onEscapeKeyPress(unwrappedDismissClosure)
      );
    };
  }, []); // Run this effect only once

  // Subcomponents
  const Overlay = (): React.ReactNode => {
    return (
      <button
        className={`bg-opacity-20 bg-black backdrop-blur-md absolute h-full w-full`}
      />
    );
  };

  const DismissArea = (): React.ReactNode => {
    return (
      <button
        className={`absolute cursor-default h-full w-full`}
        disabled={!dismissableOverlay}
        onClick={onDismiss}
      />
    );
  };

  return ReactDOM.createPortal(
    <div
      className={cn(
        `flex justify-center z-[1000000] top-0 left-0 fixed  h-[100dvh] w-[100dvw] items-center content-center transition-all ease-in-out duration-500`,
        isPresented
          ? "scale-100 opacity-100 pointer-events-auto"
          : "scale-0 opacity-0 pointer-events-none"
      )}
      tabIndex={0} // Global attribute that allows an HTML element to receive focus
      aria-description="Modal"
    >
      <Overlay />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className={`flex justify-center z-[1000000] top-0 left-0 fixed  h-[100dvh] w-[100dvw] items-center content-center`}
        >
          <DismissArea />
          {children}
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
