/**
 * Hook with reusable DOM event listener code
 */
export const useListeners = () => {
  /**
   * @param key -> The key to trigger the passed closure for
   * @param action -> The closure to call when the key is pressed
   *
   * @returns A closure with the keyboard event to listen trigger the passed action for if it matches
   * the key passed in.
   *
   * @example
   * ```
   * // Listeners
   * const listeners = useListeners();
   *
   * // Key press events
   * useEffect(() => {
   * // Event listener for key down events on the document
   * document.addEventListener('keydown', listeners.onKeyPress({ key: 'Escape', action: dismiss }));
   *
   * return () => { document.removeEventListener('keydown', listeners.onKeyPress({ key: 'Escape', action: dismiss })); }
   * }, []); // Run this effect only once
   * ```
   */
  const onKeyPress = ({
    key,
    action,
  }: {
    key: string;
    action: Function;
  }): ((e: KeyboardEvent) => void) => {
    return (e: KeyboardEvent) => {
      if (e.key === key) action();
    };
  };

  // Specific key press events
  const onEscapeKeyPress = (action: Function) =>
    onKeyPress({ key: "Escape", action });

  return {
    onKeyPress,
    onEscapeKeyPress,
  };
};
