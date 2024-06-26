// An enum for ease of use injecting dynamic colors into Tailwind class names
export enum ColorEnum {
  transparent = "transparent",
  accentColor = "accentColor",
  primary = "primary",
  medium = "medium",
  black = "black",
  neutral = "neutral",
  light_grey = 'light_grey',
  medium_light_grey = "medium_light_grey",
  medium_dark_grey = "medium_dark_grey",
  light_dark_grey = "light_dark_grey",
  dark_grey = "dark_grey",
  shadow = "shadow",
  system_black = "system_black",
  system_white = "system_white",
  invalid_red = "invalid_red",
  valid_green = "valid_green",
  invalid_input_red = "invalid_input_red",
  permanent_black = "permanent_black",
  permanent_white = "permanent_white",
  indicator_blue = "indicator_blue",
  gold = "gold",
  blue_hue_shadow = "blue_hue_shadow",
}

/// Repository containing a dictionary of all supported colors
const ColorRepository = {
  colors: {
    [ColorEnum.transparent]: "transparent",
    [ColorEnum.accentColor]: "#EB5757",
    [ColorEnum.primary]: "#EB5757",
    [ColorEnum.medium]: "#697086",
    [ColorEnum.black]: "#191D2C",
    [ColorEnum.neutral]: "#A4A8B7",
    [ColorEnum.light_grey]: "#EFF0F6",
    [ColorEnum.medium_light_grey]: "#4D5575",
    [ColorEnum.medium_dark_grey]: "#2F3447",
    [ColorEnum.light_dark_grey]: "#2D354D",
    [ColorEnum.dark_grey]: "#1E2334",
    [ColorEnum.shadow]: "rgba(0,0,0,0.25)",
    [ColorEnum.system_black]: "#000000",
    [ColorEnum.system_white]: "#FFFFFF",
    [ColorEnum.invalid_red]: "#FF0000",
    [ColorEnum.valid_green]: "#57EB5D",
    [ColorEnum.invalid_input_red]: "#FF3D3D",
    [ColorEnum.permanent_black]: "#000000",
    [ColorEnum.permanent_white]: "#FFFFFF",
    [ColorEnum.indicator_blue]: "#1C6CB6",
    [ColorEnum.gold]: "#FFD700",
    [ColorEnum.blue_hue_shadow]: "rgba(24, 119, 242, 0.25)",
  },
  gradients: {
    post_hero_overlay_gradient:
      "linear-gradient(180deg, rgba(0, 0, 0, 0.1645), rgba(0, 0, 0, 0.6801))",
    instagram_connect_account_button_gradient:
      "linear-gradient(87deg, rgba(228, 101, 72, 0.85) -0.76%, #D92C74 13.52%, rgba(217, 44, 116, 0.90) 51.21%, #A54190 68.08%, rgba(115, 23, 61, 0.87) 112.16%)",
  },
};

export default ColorRepository;
