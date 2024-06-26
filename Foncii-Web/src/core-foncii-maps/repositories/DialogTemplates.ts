// Various templates to choose from to use for dialog based communications in the application
export const DialogTemplates = {
  MarkPostForDeletionConfirmation: (args: {
    onCancel: () => void;
    onConfirm: () => void;
  }) => {
    return {
      ...args,
      title: "Delete experience",
      message:
        "Are you sure you want to delete this experience? You'll have 30 days to undo this deletion.",
      isDestructive: true,
    } as ConfirmationDialog;
  },

  PermanentlyDeletePostConfirmation: (args: {
    onCancel: () => void;
    onConfirm: () => void;
  }) => {
    return {
      ...args,
      title: "Permanently delete experience",
      message:
        "Are you sure you want to permanently delete this experience? This cannot be undone.",
      isDestructive: true,
    } as ConfirmationDialog;
  },

  ProfilePictureDeletionConfirmation: (args: {
    onCancel: () => void;
    onConfirm: () => void;
  }) => {
    return {
      ...args,
      title: "Delete profile picture",
      message: "Are you sure you want to delete your profile picture?",
      isDestructive: true,
    } as ConfirmationDialog;
  },

  ExitFTUETasteProfileQuiz: (args: {
    onCancel: () => void;
    onConfirm: () => void;
  }) => {
    return {
      ...args,
      title: "Are you sure you want to exit?",
      message:
        "Your taste profile will be saved, and you can come back to finish it later.",
      isDestructive: true,
    } as ConfirmationDialog;
  },
};
