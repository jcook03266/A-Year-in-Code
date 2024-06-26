// Dependencies
// Components
import OnboardingModal from "../../../components/modals/onboarding/OnboardingModal";

// Types
type OnboardingPageProps = {
  params: { userID: string };
};

/**
 * Simple onboarding page for new users. This page is not indexed and
 * is located at the user's ID which is not directly publicly available
 * so it would be hard for any user to navigate back to this page unless
 * they save it. The user ID is also compared with the logged in user's
 * ID so no ill intent is possible, nor is any foreign data loaded using
 * the server side parameters passed to this page.
 */
export default function Onboarding({ params }: OnboardingPageProps) {
  // State Management
  // ID of the new user going through the onboarding process
  const userID = params.userID;

  return (
    <main>
      <div className="overflow-y-auto overflow-x-hidden flex flex-col h-[100dvh] items-center justify-start w-full pb-[100px] z-[1] relative">
        <OnboardingModal userID={userID} />
      </div>
    </main>
  );
}
