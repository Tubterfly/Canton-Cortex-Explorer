/**
 * NEXT.JS CONFIGURATION (TURBOPACK COMPLIANT)
 * Modo Mainnet için optimize edilmiş proxy yapılandırması.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        /**
         * MODO MAINNET PROXY
         * Kaynak: /modo-proxy/v1/parties
         * Hedef: https://api.modo.link/canton-mainnet/v1/parties
         */
        source: '/modo-proxy/:path*',
        destination: 'https://api.modo.link/canton-mainnet/:path*',
      },
      {
        source: '/ledger-proxy/:path*',
        destination: 'https://ledger-api-json.participant.hackcanton-01.devnet.naas.noders.services:443/:path*',
      },
      {
        source: '/validator-proxy/:path*',
        destination: 'https://validator-api-http.validator.hackcanton-01.devnet.naas.noders.services:443/:path*',
      }
    ];
  },
};

export default nextConfig;