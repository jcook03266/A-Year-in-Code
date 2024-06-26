// Reusable Taste Profile Questionnaire option button
export default function TPQOptionButton({
  title,
  children,
  onClick,
  isSelected,
}: {
  title?: string;
  children?: React.ReactNode;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex line-clamp-1 px-[24px] py-[8px] border-[1px] border-medium shadow-lg font-medium text-[16px] sm:text-[18px] text-permanent_white justify-center items-center w-full h-[65px] md:h-[75px] active:bg-primary ${
        isSelected ? "bg-primary" : "bg-black"
      } rounded-[10px] hover:bg-primary hover:border-[0px] hover:shadow-md hover:opacity-75 ease-in-out transition-all active:scale-90`}
    >
      {children}
    </button>
  );
}
