"use client";
// Dependencies
// Components
import FonciiDialog from "../foncii-dialog/FonciiDialog";

// Types
interface ConfirmationDialogProps {
  confirmationDialogTemplate: ConfirmationDialog;
  isDisplayed: boolean;
}

export default function ConfirmationDialog({
  confirmationDialogTemplate,
  isDisplayed = false,
}: ConfirmationDialogProps): React.ReactNode {
  // Parsing
  const title = confirmationDialogTemplate.title,
    message = confirmationDialogTemplate.message,
    onCancel = confirmationDialogTemplate.onCancel,
    onConfirm = confirmationDialogTemplate.onConfirm,
    isDestructive = confirmationDialogTemplate.isDestructive;

  // Text Descriptions
  const confirmButtonTitle = "Confirm",
    cancelButtonTitle = "Cancel";

  // Subcomponents
  const ActionButtonFactory = (
    title: string,
    action: () => void,
    primaryAction: boolean = false
  ): React.ReactNode => {
    return (
      <button
        className={`${
          primaryAction ? "bg-primary" : "bg-medium_dark_grey"
        } hover:opacity-70 transition-all ease-in-out rounded-md w-full max-w-[100px] h-fit px-[10px] py-[5px] text-[14px] font-normal text-center border-[1px] border-medium_dark_grey`}
        onClick={action}
        aria-label={`${title} button`}
      >
        <p>{title}</p>
      </button>
    );
  };

  const ActionButtons = (): React.ReactNode => {
    return (
      <div className="flex flex-row gap-x-[15px] w-full h-fit items-center justify-start">
        {/** Confirm Button */}
        {ActionButtonFactory(confirmButtonTitle, onConfirm, true)}
        {/** Confirm Button */}

        {/** Cancel Button */}
        {ActionButtonFactory(cancelButtonTitle, onCancel)}
        {/** Cancel Button */}
      </div>
    );
  };

  const TextContentSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[10px] w-full h-fit text-permanent_white text-start">
        <h1
          className={`text-[20px] font-semibold line-clamp-2 ${
            isDestructive ? "text-primary" : "text-permanent_white"
          }`}
        >
          {title}
        </h1>
        <h2 className="text-[16px] font-normal line-clamp-3 text-neutral">
          {message}
        </h2>
      </div>
    );
  };

  const DialogBox = (): React.ReactNode => {
    return (
      <div
        className={`border-medium_dark_grey border-[1px] transition-all ease-in-out rounded-md z-[20001] relative bg-black h-fit w-[90%] max-w-[350px] overflow-hidden pointer-events-auto`}
        autoFocus
      >
        <div className="flex flex-col gap-y-[20px] p-[20px]">
          {TextContentSection()}
          {ActionButtons()}
        </div>
      </div>
    );
  };

  return isDisplayed ? (
    <FonciiDialog onDismiss={onCancel}>{DialogBox()}</FonciiDialog>
  ) : undefined;
}
