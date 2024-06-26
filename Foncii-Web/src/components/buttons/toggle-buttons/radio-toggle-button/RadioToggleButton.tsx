"use client";
// Types
interface RadioToggleButtonProps {
  title: string; // Title to display inside the button as a label
  toggled: boolean;
  onToggleAction: () => void;
}

export default function RadioToggleButton({
  title,
  toggled,
  onToggleAction,
}: RadioToggleButtonProps) {
  // Note: Maximum size of this button is 150px, the text title is truncated
  return (
    <div className="flex flex-row gap-x-[10px] items-center w-fit h-fit">
      <button
        className={`flex h-[16px] w-[16px] rounded-full justify-center items-center
            ease-in-out duration-200 border-[2px] border-permanent_white
            transition-all active:scale-90
            `}
        onClick={onToggleAction}
      >
        <div
          className={`transition-transform active:scale-90 ease-in-out duration-200 h-[10px] w-[10px] rounded-full bg-permanent_white ${
            toggled ? "scale-100" : "scale-0"
          }`}
        />
      </button>

      {/** Adjacent title describing the radio button's functionality */}
      <p
        className={`line-clamp-1 text-center text-[14px] text-permanent_white font-normal`}
      >
        {title}
      </p>
    </div>
  );
}
