import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/iclock/cdata', destination: '/api/iclock/cdata' },
      { source: '/iclock/getrequest', destination: '/api/iclock/getrequest' },
      { source: '/iclock/devicecmd', destination: '/api/iclock/devicecmd' },
    ]
  },
};

export default nextConfig;
