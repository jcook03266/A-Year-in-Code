// Color Theme Definition, same as the one defined in the ColorRepository module
// Important: Keep both definitions in sync when making updates to either
enum ColorEnum {
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
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        "top-loading-bar": "top-loading-bar-animation 4s ease-in-out infinite",
        progress: "progress 1s infinite linear",
      },
      keyframes: {
        "top-loading-bar-animation": {
          "0%, 100%": { transform: "translateX(-100vw)" },
          "50%": { transform: "translateX(100vw)" },
        },
        progress: {
          "0%": { transform: " translateX(0) scaleX(0)" },
          "40%": { transform: "translateX(0) scaleX(0.4)" },
          "100%": { transform: "translateX(100%) scaleX(0.5)" },
        },
      },
      transformOrigin: {
        "left-right": "0% 50%",
      },
      fontFamily: {
        lato: ["Lato", "sans-serif"],
      },
      gradients: {},
      colors: ColorRepository.colors,
      screens: {
        xs: "475px",
        // => @media (min-width: 475px) { ... }
        sm: "640px",
        // => @media (min-width: 640px) { ... }
        md: "768px",
        // => @media (min-width: 768px) { ... }
        lg: "1024px",
        // => @media (min-width: 1024px) { ... }
        xl: "1280px",
        // => @media (min-width: 1280px) { ... }
        "2xl": "1536px",
        // => @media (min-width: 1536px) { ... }
      },
    },
  },
  safelist: [{ pattern: /(bg|h|w|border|text|outline|divide|shadow)-./ }],
  plugins: [],
};
