# Heavy Build Test for Cloudflare Workers

This project tests build performance between 2 vCPU and 4 vCPU plans.

Build command: `npm run build`
Output: `dist/worker.js`

The build includes:
- 10+ heavy dependencies
- Complex webpack optimization (5 compression passes)
- Large bundle size
- Maximum parallel processing
