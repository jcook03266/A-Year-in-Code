/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Hooks
import React, { useEffect, useRef, useState } from "react";

// Components
// Local
import GenericAvatarImageView from "../../../../../components/media-views/generic-avatar-image-view/GenericAvatarImageView";
import DynamicRoundedCTAButton from "../../../../../components/buttons/call-to-action/dynamic-rounded-cta-button/DynamicRoundedCTAButton";
import FonciiToolTip from "../../../../tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Redux
import { getFonciiUserSlice } from "../../../../../redux/operations/selectors";

// Assets
import { ImageRepository } from "../../../../../../public/assets/images/ImageRepository";

// Formatting
import { possessiveFormattedUsernameCopy } from "../../../../../utilities/formatting/textContentFormatting";

// Services
import { FonciiAPIClientAdapter } from "../../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";
import CloudStorageServiceAdapter, {
  MediaServerImageFitParams,
  MediaServerImageFormatParams,
} from "../../../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Dialogs
import ConfirmationDialog from "../../../../../components/dialogs/confirmation-dialog/ConfirmationDialog";
import { DialogTemplates } from "../../../../../core-foncii-maps/repositories/DialogTemplates";

// Utils
import { cn } from "../../../../../utilities/development/DevUtils";

// Simple context that allows the user to update their profile picture.
export default function ProfilePictureUpdateContext(): React.ReactNode {
  // State Management
  // Global
  const fonciiUser = getFonciiUserSlice()();

  // Local
  const [selectedImageFile, setSelectedImageFile] = useState<File | undefined>(
    undefined
  ),
    [selectedImageFileData, setSelectedImageFileData] = useState<
      Uint8Array | undefined
    >(undefined),
    [selectedMediaFileInvalid, setSelectedMediaFileInvalid] =
      useState<boolean>(false);

  // UI Refs
  const dropArea = useRef<HTMLDivElement>(null);

  // UI Visibility Modifiers
  const [confirmationDialogVisible, setConfirmationDialogVisible] =
    useState(false);

  // Respond to user data related updates ~ profile picture updates
  useEffect(() => { }, [fonciiUser]);

  // Add file drop event listener
  useEffect(() => {
    if (!dropArea.current) return;
    function preventDefaults(e: any) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prevent default drop behavior
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropArea.current?.addEventListener(eventName, preventDefaults, false);
    });

    dropArea.current?.addEventListener("drop", handleFileSelectionChange);

    // Cleanup: remove event listener when the component unmounts
    return () => {
      dropArea.current?.removeEventListener("drop", handleFileSelectionChange);
    };
  }, []);

  // Properties
  const currentAvatarImage = (): any => {
    if (selectedImageFile) {
      // Create a URL reference to the selected file in order to display it in the image view
      return URL.createObjectURL(selectedImageFile);
    } else {
      return fonciiUser.user?.profilePictureURL;
    }
  };

  const currentUsername = (): string | undefined => {
    return fonciiUser.user?.username;
  };

  const avatarImageViewAltDescription = (): string => {
    return `${possessiveFormattedUsernameCopy(
      currentUsername()
    )} profile picture`;
  };

  // Text Description
  const fileUploadRequirementsMessage =
    "Recommended: Square JPG, or PNG at least 98x98 pixels, 4 MB or less.",
    fileUploadSelectionInvalidMessage =
      "Selected file invalid, please provide a supported file type with the required size constraints";

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convenience
  // Valid file input + selected input data available
  const canUpdateProfilePicture = (): boolean => {
    return !selectedMediaFileInvalid && selectedImageFileData != undefined;
  };

  const canDeleteProfilePicture = (): boolean => {
    return userHasExistingProfilePicture();
  };

  const userHasExistingProfilePicture = (): boolean => {
    return fonciiUser.user?.profilePictureURL != undefined;
  };

  // Action Handlers
  const handleFileSelectionChange = async (e: any) => {
    // Remove any error message for new selections
    setSelectedMediaFileInvalid(false);

    // File parsing
    // File drop : file passed via edit button / file selector
    const file: File = e.dataTransfer
      ? e.dataTransfer.files[0]
      : e.target.files[0];

    // Reject empty selections (canceled selections)
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer(),
      fileDataBuffer = new Uint8Array(arrayBuffer);

    // Validation
    if (!isInputFileValid(fileDataBuffer)) {
      setSelectedMediaFileInvalid(true);
    } else {
      // Update current selection context
      setSelectedImageFile(file);
      setSelectedImageFileData(fileDataBuffer);
    }
  };

  // Trigger the hidden file input element when the button is clicked
  const handleEditButtonClick = (): void => {
    fileInputRef.current?.click();
  };

  // Actions
  const deleteProfilePictureConfirmationRequest = () => {
    setConfirmationDialogVisible(true);
  };

  const dismissConfirmationDialog = () => {
    setConfirmationDialogVisible(false);
  };

  const confirmUpdateAction = async () => {
    if (!canUpdateProfilePicture()) return;

    // Parsing data
    const userID = fonciiUser.user?.id,
      fileDataBufferString = String(selectedImageFileData);

    // Precondition failure
    if (!userID) return;

    const apiService = new FonciiAPIClientAdapter(),
      didOperationSucceed = await apiService.performSetUserProfilePicture(
        userID,
        fileDataBufferString
      );

    // Clear any selections if the update is successful
    if (didOperationSucceed) clearSelectionState();
  };

  const deleteProfilePictureAction = async () => {
    if (!canDeleteProfilePicture()) return;

    // Parsing data
    const userID = fonciiUser.user?.id;

    // Precondition failure
    if (!userID) return;

    // Close confirmation dialog
    dismissConfirmationDialog();

    const apiService = new FonciiAPIClientAdapter(),
      didOperationSucceed = await apiService.performSetUserProfilePicture(
        userID,
        undefined
      );

    // Clear any selections if the update is successful
    if (didOperationSucceed) clearSelectionState();
  };

  // Business Logic
  // Validate that the file in question conforms to the requirements of the API
  const isInputFileValid = (fileDataBuffer: Uint8Array): boolean => {
    return CloudStorageServiceAdapter.isProfilePictureMediaValid(
      fileDataBuffer
    );
  };

  // Reset the state of the file selection process
  const clearSelectionState = (): void => {
    setSelectedMediaFileInvalid(false);
    setSelectedImageFileData(undefined);
    setSelectedImageFile(undefined);
  };

  // Subcomponents
  const ProfilePictureSection = (): React.ReactNode => {
    return (
      <div className="relative flex items-center justify-center h-[150px] w-[150px] rounded-full">
        {/** User Avatar Image View */}
        <Image
          fetchPriority="high"
          loading="eager"
          alt={`User Avatar Background Hue`}
          src={ImageRepository.Illustrations.UserAvatarBackgroundHue}
          className="h-fit w-full fixed top-0 left-0 pointer-events-none"
          unselectable="on"
        />
        <GenericAvatarImageView
          imageURL={currentAvatarImage()}
          altDescription={avatarImageViewAltDescription()}
          imageResizingProps={{
            height: 400,
            width: 400,
            fit: MediaServerImageFitParams.cover,
            format: MediaServerImageFormatParams.f3,
          }}
        />
        {/** User Avatar Image View */}

        {/** Edit Button */}
        <button
          className="w-fit h-fit text-[14px] gap-x-[8px] px-[16px] py-[4px] xl:text-[16px] font-semibold absolute bottom-0 text-permanent_white bg-primary shadow-xl rounded-[16px] transition-all active:scale-90 ease-in-out hover:opacity-75 flex items-center justify-center"
          onClick={handleEditButtonClick}
        >
          <Image
            src={ImageRepository.UserMenuIcons.CameraIcon}
            alt="Camera Icon"
            className="w-[24px] h-[24px] shrink-0"
          />
          <p>Edit</p>
          <input
            type="file"
            accept=".png, .jpg, .jpeg" // Restrict to only these file types
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelectionChange}
          />
        </button>
      </div>
    );
  };

  const ErrorMessageSection = (): React.ReactNode => {
    return selectedMediaFileInvalid ? (
      <p className="text-primary text-[14px] font-semibold text-center">
        {fileUploadSelectionInvalidMessage}
      </p>
    ) : undefined;
  };

  const FileUploadRequirementsSection = (): React.ReactNode => {
    return (
      <div className="flex flex-col gap-y-[16px] pt-[4px] w-full max-w-[380px]">
        <div className="flex text-medium text-[14px] font-normal text-start justify-start items-center h-fit w-fit">
          <p className="px-[12px] border-l-[1px] border-l-primary">
            {fileUploadRequirementsMessage}
          </p>
        </div>
      </div>
    );
  };

  const UpdateConfirmationButton = (): React.ReactNode => {
    // Don't render the confirmation button unless the user is ready to confirm an update
    if (!canUpdateProfilePicture()) return;

    const title = "Confirm Update",
      loading = fonciiUser?.isLoading;

    return (
      <div
        className={cn('max-w-[290px] w-full py-[5px] h-[40px] transition-all ease-in-out duration-500',
          canUpdateProfilePicture() ? "opacity-100" : "opacity-50")}
      >
        <DynamicRoundedCTAButton
          title={title}
          onClickAction={confirmUpdateAction}
          disabled={!canUpdateProfilePicture()}
          loading={loading}
        />
      </div>
    );
  };

  const DeleteProfilePictureButton = (): React.ReactNode => {
    const deleteIcon = ImageRepository.UtilityIcons.DeleteTrashIcon;

    // Don't render
    if (!canDeleteProfilePicture()) return undefined;

    return (
      <FonciiToolTip title="Delete your profile picture">
        <button
          className="flex flex-row gap-x-[10px] text-center justify-center items-center w-fit h-fit active:scale-90 transition-all ease-in-out hover:opacity-75 pt-[4px]"
          onClick={deleteProfilePictureConfirmationRequest}
        >
          <Image
            src={deleteIcon}
            alt="Remove Profile Picture Button Icon"
            className="h-[20px] w-[20px]"
          />
          <p className="text-invalid_input_red text-[16px] font-regular h-fit">
            Remove
          </p>
        </button>
      </FonciiToolTip>
    );
  };

  return (
    <div
      className="flex flex-col h-fit w-[250px] py-[10px] items-center justify-center gap-y-[20px]"
      ref={dropArea}
    >
      {ProfilePictureSection()}
      {ErrorMessageSection()}
      {FileUploadRequirementsSection()}
      {UpdateConfirmationButton()}

      <div className="flex border-t-[0.3px] border-medium items-center justify-center w-full h-fit">
        <span className="pt-[16px]">{DeleteProfilePictureButton()}</span>
      </div>

      {/** Dialogs */}
      <ConfirmationDialog
        confirmationDialogTemplate={DialogTemplates.ProfilePictureDeletionConfirmation(
          {
            onCancel: dismissConfirmationDialog,
            onConfirm: deleteProfilePictureAction,
          }
        )}
        isDisplayed={confirmationDialogVisible}
      />
    </div>
  );
}
