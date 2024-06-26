/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Components
// Local
import FonciiModal from "../foncii-base-modal/FonciiModal";
import AuthModalLogInForm from "./components/AuthModalLogInForm";
import AuthModalSignUpForm from "./components/AuthModalSignUpForm";
import CloseUtilityButton from "../.../../../../components/buttons/utility-buttons/close-button/CloseUtilityButton";
import AuthModalResetPasswordForm from "./components/AuthModalResetPasswordForm";

// Hooks
import React, { useEffect, useState } from "react";
import { useRouterSearchParams } from "../../../hooks/UseRouterSearchParamsHook";

// Navigation
import {
  NavigationProperties,
  SharedURLParameters,
} from "../../../core-foncii-maps/properties/NavigationProperties";

// Managers
import UserManager from "../../../managers/userManager";

// Redux
import { getFonciiUserSlice } from "../../../redux/operations/selectors";

// Types
/**
 * Shared interface for all of the different auth modal forms to conform to
 */
export interface AuthModalFormProps {
  switchToAuthForm: (authForm: AuthForms) => void;
}

export enum AuthForms {
  LogIn = "0",
  SignUp = "1",
  ResetPassword = "2",
}

export default function AuthModal() {
  // Routing
  const routerSearchParams = useRouterSearchParams();

  // State Management
  // Redux
  const fonciiUser = getFonciiUserSlice()();

  // Default form when modal is displayed is the login form
  const [currentForm, setCurrentForm] = useState(AuthForms.LogIn);

  // Set default values when component mounts
  useEffect(() => {
    setDefaultValues();
    conditionallyRedirectIsolatedUser();
  }, []);

  // Redirect / dismiss this modal when a non-FTUE user logs in, FTUE redirection is handled by the navigation header as it's a layout component
  useEffect(() => {
    conditionallyRedirectIsolatedUser();
  }, [fonciiUser]);

  // Convenience
  const isPresented = () => {
    return (
      routerSearchParams.getParamValue(SharedURLParameters.displayAuthModal) !=
      undefined
    );
  };

  // Business Logic
  function setDefaultValues() {
    const defaultAuthForm = String(
      routerSearchParams.getParamValue(SharedURLParameters.currentAuthForm)
    ) as any as AuthForms | undefined,
      authForm = defaultAuthForm ?? AuthForms.LogIn;

    setCurrentForm(authForm);
  }

  function conditionallyRedirectIsolatedUser() {
    if (UserManager.shared.userAuthenticated()) {
      routerSearchParams.removeParams([
        SharedURLParameters.displayAuthModal,
        SharedURLParameters.currentAuthForm,
        SharedURLParameters.displaySideMenu,
      ]);
      NavigationProperties.userGalleryPageLink();
    }
  }

  // Action Handlers
  const switchToAuthFormHandler = (authForm: AuthForms) => {
    setCurrentForm(authForm);

    routerSearchParams.setParams({
      [SharedURLParameters.currentAuthForm]: authForm,
    });
  };

  // Actions
  const dismiss = () => {
    routerSearchParams.removeParams([
      SharedURLParameters.displayAuthModal,
      SharedURLParameters.currentAuthForm,
    ]);
  };

  // Subcomponents
  const Header = (): React.ReactNode => {
    const title = () => {
      switch (currentForm) {
        case AuthForms.LogIn:
          return "Log in";
        case AuthForms.SignUp:
          return "Sign up";
        case AuthForms.ResetPassword:
          return "Password reset";
      }
    };

    return (
      <div className="flex items-center justify-start sticky z-[1] bg-black bg-opacity-80 backdrop-blur-lg top-0 w-full h-fit py-[8px] xs:py-[14px] border-b-[1px] border-t-[1px] xs:border-t-[0px] border-medium_dark_grey">
        <CloseUtilityButton
          onClick={dismiss}
          className="h-[32px] w-[32px] shrink-0 absolute left-[24px]"
          filled={false}
        />
        <p className="h-fit w-full text-center text-[16px] xs:text-[20px] font-semibold xs:font-medium text-permanent_white">
          {title()}
        </p>
      </div>
    );
  };

  // Sections
  const CurrentAuthForm = (): React.ReactNode => {
    const AuthForm = () => {
      switch (currentForm) {
        case AuthForms.LogIn:
          return (
            <AuthModalLogInForm switchToAuthForm={switchToAuthFormHandler} />
          );
        case AuthForms.SignUp:
          return (
            <AuthModalSignUpForm switchToAuthForm={switchToAuthFormHandler} />
          );
        case AuthForms.ResetPassword:
          return (
            <AuthModalResetPasswordForm
              switchToAuthForm={switchToAuthFormHandler}
            />
          );
      }
    };

    return (
      <div className="shrink items-center justify-center w-full px-[24px] pb-[40px]">
        {AuthForm()}
      </div>
    );
  };

  const MainContent = (): React.ReactNode => {
    return (
      <div className="overflow-y-auto overflow-x-hidden relative flex flex-col gap-y-[24px] duration-300 overflow-hidden items-center justify-start border-[1px] border-medium_dark_grey bg-black bg-opacity-80 shadow-lg h-full w-full sm:max-h-[725px] sm:max-w-[590px] min-w-[80dvw] md:min-w-[590px] rounded-[8px] transition-all ease-in-out">
        {Header()}
        {CurrentAuthForm()}
      </div>
    );
  };

  return (
    <FonciiModal
      isPresented={isPresented()}
      onDismiss={dismiss}
      dismissableOverlay
    >
      {MainContent()}
    </FonciiModal>
  );
}
