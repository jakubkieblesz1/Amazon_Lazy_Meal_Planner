const { defineConfig } = require('eslint');
const eslintPluginReact = require('eslint-plugin-react');
const eslintConfigAirbnb = require('eslint-config-airbnb');

module.exports = [
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      react: eslintPluginReact,
    },
    rules: {
      ...eslintConfigAirbnb.rules,
      'react/prop-types': 'off',
    },
  },
];
