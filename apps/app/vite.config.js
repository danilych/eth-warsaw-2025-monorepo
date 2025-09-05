import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import crypto from 'node:crypto';

if (!('hash' in crypto)) {
  crypto.hash = (algorithm, data, outputEncoding) => {
    return crypto.createHash(algorithm).update(data).digest(outputEncoding);
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
});
