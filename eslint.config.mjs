import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypescript,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"], rules: { "react-hooks/set-state-in-effect": "off", "@next/next/no-img-element": "off", "@next/next/no-html-link-for-pages": "off" } },
];

export default config;
