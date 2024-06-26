// Dependencies
// Components
import TasteProfileQuestionnaireModal from "../../../components/modals/taste-profile-questionnaire/TasteProfileQuestionnaire";

// Types
type TasteProfilePageProps = {
  params: { userID: string };
};

/**
 * Isolated page to host the compute intensive taste profile modal on. This page isn't
 * indexed and is unique to each user since it relies on a user ID parameter
 * to authorize them for access to the questionnaire.
 */
export default function TasteProfile({ params }: TasteProfilePageProps) {
  // State Management
  // ID of the user accessing the taste profile questionnaire
  const userID = params.userID;

  return (
    <main>
      <div className="overflow-y-auto overflow-x-hidden flex flex-col h-[100dvh] items-center justify-start w-full pb-[100px] z-[1] relative">
        <TasteProfileQuestionnaireModal userID={userID} />
      </div>
    </main>
  );
}
