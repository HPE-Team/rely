import { defineConfig } from 'vite'

// Only needed when the Slidev dev server runs behind a public domain + TLS proxy
// (the multi-presenter live-sync server). Local `npm run dev` ignores these safely.
//
// Host = the EC2 public DNS (no custom domain). Swap if you point a real domain later.
// - allowedHosts: Vite rejects unknown Host headers by default -> page 403s behind proxy.
// Served over plain HTTP on port 80 (Let's Encrypt won't issue for *.amazonaws.com, so no
// TLS without a custom domain). HMR/sync ws then uses default ws:// on the page origin —
// no hmr override needed. If a real domain + TLS is added later, set hmr:{protocol:'wss',clientPort:443}.
export default defineConfig({
  server: {
    allowedHosts: ['ec2-13-207-45-93.ap-south-1.compute.amazonaws.com'],
  },
})
