/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@settl/types', '@settl/utils'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
    NEXT_PUBLIC_MOBILE_APK_URL:
      process.env.NEXT_PUBLIC_MOBILE_APK_URL ??
      'https://expo.dev/artifacts/eas/JgMODv9-Md48G2XxiqEv9mXDCH7u0NjkK_5s2x_Hpsk.apk',
  },
};

export default nextConfig;
