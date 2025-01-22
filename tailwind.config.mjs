/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')
const flattenColorPalette = require('tailwindcss/src/util/flattenColorPalette')
const toColorValue = require('tailwindcss/src/util/toColorValue')
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--my-font)'],
      },
      textShadow: {
        xs: "2px 2px 0px var(--tw-shadow-color)",
        sm: "3px 3px 0px var(--tw-shadow-color)",
        md: "4px 4px 0px var(--tw-shadow-color)",
        lg: "6px 6px 0px var(--tw-shadow-color)",
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    }),
    plugin(function ({ matchUtilities, e, config, theme }) {
      const textBorderSize = `--tw${config('prefix')}-text-border-size`

      matchUtilities(
        {
          'text-border': (value) => ({
            'text-shadow': `0 0 var(${textBorderSize},1px) ${toColorValue(value)}`,
          }),
        },
        {
          values: (({ DEFAULT: _, ...colors }) => colors)(flattenColorPalette(theme('borderColor'))),
          type: 'color',
        }
      )

      matchUtilities(
        {
          'text-border-size': (value) => ({
            [textBorderSize]: value
          }),
        },
        { values: theme('borderWidth') }
      )
    }),
  ],
};
