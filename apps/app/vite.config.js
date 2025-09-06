import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

if (!('hash' in crypto)) {
  crypto.hash = (algorithm, data, outputEncoding) => {
    return crypto.createHash(algorithm).update(data).digest(outputEncoding);
  };
}

// https://vite.dev/config/
export default defineConfig(() => ({
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['28546b252a03.ngrok-free.app'],
  },
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['28546b252a03.ngrok-free.app'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

