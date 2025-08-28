import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    authInterrupts: true,
  },
  // i18n: {
  //   locales: ['default', 'en', 'ko'],
  //   defaultLocale: 'en',
  // },
  // // trailingSlash: false
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
