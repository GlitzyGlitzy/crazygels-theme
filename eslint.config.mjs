import nextConfig from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextConfig,
  {
    rules: {
      // Too aggressive for existing patterns (reading localStorage on mount, etc.)
      'react-hooks/set-state-in-effect': 'off',
      // Server components often use try/catch with JSX fallbacks; use error boundaries where needed
      'react-hooks/error-boundaries': 'off',
    },
  },
];

export default config;
