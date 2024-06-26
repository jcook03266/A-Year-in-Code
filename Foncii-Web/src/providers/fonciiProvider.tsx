/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Services
import AnalyticsService from "../services/analytics/analyticsService";

// Managers
import UserSessionManager from "../managers/userSessionManager";

// Hooks
import { useEffect } from "react";

// Note: Only accessible by client side components
export default function FonciiProvider({ children }: any) {
  // State Management
  // Configure analytics service and init client properties
  useEffect(() => {
    AnalyticsService.shared.setup();
  }, []);

  // Init user session when the user's device ID is available (required for our user sessions)
  useEffect(() => {
    UserSessionManager.shared.setup();
  }, [AnalyticsService.shared.getDeviceID()]);

  return <div>{children}</div>;
}
