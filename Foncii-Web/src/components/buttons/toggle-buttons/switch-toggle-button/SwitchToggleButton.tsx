// Dependencies
// Utilities
import { cn } from "../../../../utilities/development/DevUtils";

// Types
interface SwitchToggleButtonProps {
  /** External toggle state that should be updated using the onToggle callback. */
  isToggled: boolean;
  /** Callback to update the external toggle state. */
  onToggle: (toggled: boolean) => void;
}

export default function SwitchToggleButton({
  isToggled,
  onToggle,
}: SwitchToggleButtonProps) {
  // Action handlers
  const toggleActionHandler = () => {
    onToggle(!isToggled);
  };

  // Subcomponents
  const Background = ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactNode => {
    return (
      <div
        onClick={toggleActionHandler}
        className={cn(
          "relative flex items-center h-[16px] w-[36px] rounded-full shrink-0 shadow-lg transition-all ease-in-out duration-300",
          isToggled ? "bg-primary" : "bg-medium"
        )}
      >
        {children}
      </div>
    );
  };

  const ControlThumb = (): React.ReactNode => {
    return (
      <button
        onClick={toggleActionHandler}
        className={cn(
          "absolute w-[16px] h-[16px] duration-300 rounded-full shadow-lg bg-permanent_white shrink-0 transition-all ease-in-out active:w-[20px]",
          isToggled ? "right-0" : "left-0"
        )}
      />
    );
  };

  return (
    <Background>
      <ControlThumb />
    </Background>
  );
}
