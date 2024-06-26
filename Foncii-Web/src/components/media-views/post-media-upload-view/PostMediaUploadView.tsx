/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Types
import { PostMediaTypes } from "../../../__generated__/graphql";

// Components
// Local
import FonciiToolTip from "../../../components/tool-tips/FonciiToolTip";

// External
import Image from "next/image";

// Hooks
import { useEffect, useRef, useState } from "react";

// Assets
import { ImageRepository } from "../../../../public/assets/images/ImageRepository";

// Services
import CloudStorageServiceAdapter from "../../../services/media/service-adapters/cloudStorageServiceAdapter";

// Utilities
import { cn } from "../../../utilities/development/DevUtils";
import { ClassNameValue } from "tailwind-merge";
import { delay } from "../../../utilities/common/scheduling";

// Types
export interface MediaSelectionUpdate {
  selectedMediaType: PostMediaTypes;
  selectedMediaData?: Uint8Array;
  selectedVideoMediaThumbnailData?: Uint8Array;
}

interface PostMediaUploadViewProps {
  className?: ClassNameValue;
  onMediaSelectionUpdate?: (media: MediaSelectionUpdate) => void;
}

export default function PostMediaUploadView({
  className,
  onMediaSelectionUpdate,
}: PostMediaUploadViewProps) {
  // State Management
  // Local
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | undefined>(
    undefined
  ),
    [selectedMediaFileData, setSelectedMediaFileData] = useState<
      Uint8Array | undefined
    >(undefined),
    [selectedMediaFileURL, setSelectedMediaFileURL] = useState<
      string | undefined
    >(undefined),
    [
      selectedVideoMediaThumbnailFileData,
      setSelectedVideoMediaThumbnailFileData,
    ] = useState<Uint8Array | undefined>(undefined),
    [
      selectedVideoMediaThumbnailFileURL,
      setSelectedVideoMediaThumbnailFileURL,
    ] = useState<string | undefined>(undefined),
    [selectedMediaFileInvalid, setSelectedMediaFileInvalid] =
      useState<boolean>(false);

  // UI Refs
  const dropArea = useRef<HTMLButtonElement>(null);

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

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Properties
  const currentPostMediaImage = (): any => {
    if (!selectedMediaFileData || !selectedMediaFile) return;

    if (
      isInputFileAVideo(selectedMediaFileData) &&
      selectedVideoMediaThumbnailFileData &&
      CloudStorageServiceAdapter.isUserPostImageMediaValid(
        selectedVideoMediaThumbnailFileData
      )
    ) {
      return selectedVideoMediaThumbnailFileURL;
    } else {
      // Use a URL reference to the selected file in order to display it in the image view
      return selectedMediaFileURL;
    }
  };

  // Image Dimensions ~ These are just for the image dimensions prop requirement
  const imageWidth = 1920,
    imageHeight = 1080;

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
      // Reset the state of the file selection process as user selected invalid file
      clearSelectionState();

      setSelectedMediaFileInvalid(true);
    } else {
      let videoMediaThumbnailData = undefined;

      // Update current selection context
      if (isInputFileAVideo(fileDataBuffer)) {
        videoMediaThumbnailData = await createThumbnailImageFromVideoMedia({
          selectedMediaFile: file,
          selectedMediaFileData: fileDataBuffer,
        });

        // Video thumbnail data
        setSelectedVideoMediaThumbnailFileData(videoMediaThumbnailData);
      } else {
        // Image to display
        setSelectedMediaFileURL(URL.createObjectURL(file));
      }

      // All media file data
      setSelectedMediaFile(file);
      setSelectedMediaFileData(fileDataBuffer);

      // Inform parent of new selection
      onMediaSelectionUpdate?.({
        selectedMediaType: isInputFileAVideo(fileDataBuffer)
          ? PostMediaTypes.Video
          : PostMediaTypes.Image,
        selectedMediaData: fileDataBuffer,
        selectedVideoMediaThumbnailData: videoMediaThumbnailData,
      });
    }
  };

  // Trigger the hidden file input element when the button is clicked
  const handleEditInputClick = (): void => {
    fileInputRef.current?.click();
  };

  // Business Logic
  // Validate that the file in question conforms to the requirements of the API
  const isInputFileValid = (fileDataBuffer: Uint8Array): boolean => {
    if (isInputFileAVideo(fileDataBuffer)) return true;
    else
      return CloudStorageServiceAdapter.isUserPostImageMediaValid(
        fileDataBuffer
      );
  };

  const isInputFileAVideo = (fileDataBuffer: Uint8Array): boolean => {
    return CloudStorageServiceAdapter.isUserPostVideoMediaValid(fileDataBuffer);
  };

  // Reset the state of the file selection process
  const clearSelectionState = (): void => {
    // Validation
    setSelectedMediaFileInvalid(false);

    // All media
    setSelectedMediaFileData(undefined);
    setSelectedMediaFile(undefined);
    setSelectedMediaFileURL(undefined);

    // Video Thumbnail
    setSelectedVideoMediaThumbnailFileData(undefined);
    setSelectedVideoMediaThumbnailFileURL(undefined);
  };

  // Helpers
  const createThumbnailImageFromVideoMedia = async ({
    selectedMediaFile,
    selectedMediaFileData,
  }: {
    selectedMediaFile: File | undefined;
    selectedMediaFileData: Uint8Array | undefined;
  }): Promise<Uint8Array | undefined> => {
    if (!selectedMediaFileData) return;

    if (selectedMediaFile && isInputFileAVideo(selectedMediaFileData)) {
      return new Promise((resolve) => {
        try {
          const video = document.createElement("video"),
            // Get the video's canvas frame for the thumbnail
            canvas = document.createElement("canvas");

          const videoURL = URL.createObjectURL(selectedMediaFile);
          // Important, video must auto-play
          video.autoplay = true;
          video.muted = true;
          video.src = videoURL;

          video.onloadeddata = async () => {
            const ctx = canvas.getContext("2d");

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // This delay is required by safari b/c it will blank out for certain videos when processing the thumbnail
            // and result in an empty image file, source: https://stackoverflow.com/questions/71113843/how-to-fix-the-black-screen-with-canvas-todataurl-on-safari-browser
            delay(async () => {
              ctx?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
              video.pause();

              canvas.toBlob(async () => {
                const dataURL = canvas.toDataURL("image/png"),
                  blob = await (await fetch(dataURL)).blob();

                // Update local state
                setSelectedVideoMediaThumbnailFileURL(dataURL);

                // Revoke URL after drawing image, doing so before will result in an undefined output
                URL.revokeObjectURL(videoURL);

                const arrayBuffer = await new Promise<ArrayBuffer>(
                  (resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (reader.result instanceof ArrayBuffer) {
                        resolve(reader.result);
                      }
                    };
                    reader.readAsArrayBuffer(blob);
                  }
                );

                resolve(new Uint8Array(arrayBuffer));
              });
            }, 100);
          };
        } catch (error) {
          console.error(
            "Error encountered while creating video thumbnail:",
            error
          );
          return;
        }
      });
    }
  };

  // Subcomponents
  const CurrentMediaContent = (): React.ReactNode => {
    if (selectedMediaFile) {
      /** Display selected media file */
      return (
        <FonciiToolTip title="Pending post media file upload">
          <Image
            className="w-full h-full object-cover object-center pointer-events-none"
            src={currentPostMediaImage()}
            fetchPriority="high"
            loading="eager"
            alt={"Media file upload"}
            width={imageWidth}
            height={imageHeight}
            unoptimized
            unselectable="on"
          />
        </FonciiToolTip>
      );
    } else {
      /** Display prompt when no media file selected */
      return (
        <FonciiToolTip title="Add image or video media to start off this experience">
          <div className="flex flex-col items-center justify-center h-full w-full gap-y-[24px]">
            <Image
              className="w-[40px] h-[40px] rounded-full shadow-xl"
              src={ImageRepository.UtilityIcons.AddPostMediaIcon}
              fetchPriority="high"
              loading="eager"
              alt={"Add media icon"}
              unselectable="on"
            />

            <div className="flex flex-col items-center text-center justify-center h-fit w-full gap-y-[8px]">
              <p className="text-[20px] text-permanent_white font-medium">
                {"Add Photos/Videos"}
              </p>
            </div>
          </div>
        </FonciiToolTip>
      );
    }
  };

  return (
    <button
      className={cn(
        "relative items-end justify-center w-full h-full overflow-hidden shrink-0 bg-medium_dark_grey",
        className,
        selectedMediaFileInvalid
          ? "border-primary border-[1px] rounded-[10px]"
          : ""
      )}
      ref={dropArea}
      onClick={handleEditInputClick}
    >
      {CurrentMediaContent()}

      <input
        type="file"
        accept=".png, .jpg, .jpeg, .mp4, .mov" // Restrict to only these file types
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelectionChange}
      />
    </button>
  );
}
