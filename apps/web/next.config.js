import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.join(currentDirectory, "../.."),
  },
  devIndicators: {
    position: "top-left"
  }
};

export default nextConfig;
