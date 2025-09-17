# Cloudflare Workers vCPU Stress Test

Zero-configuration stress test to compare 2 vCPU vs 4+ vCPU performance on Cloudflare Workers Builds.

## 🚀 Quick Start

1. **Import this repo** to Cloudflare Workers Builds
2. **Build Settings:**
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - ✅ Enable "Builds for non-production branches"
3. **Run build** - automatic vCPU detection and performance reporting!

## 📊 What It Tests

- **Heavy dependencies**: Mathematical libraries, data processing tools
- **CPU-intensive operations**: Matrix calculations, complex bundling
- **Webpack optimization**: 5-8 compression passes, parallel processing
- **Bundle size**: Large codebase with heavy computations

## 🎯 Performance Metrics

The build automatically detects and reports:
- **vCPU count** (2 vs 4+ cores)
- **Build duration** (average across multiple runs)
- **CPU utilization** (percentage during build)
- **Bundle output size**
- **Performance classification**

## 📈 Expected Results

- **2 vCPU (Free Plan)**: ~25-40 seconds, 70-85% CPU utilization
- **4 vCPU (Paid Plan)**: ~15-25 seconds, 85-95% CPU utilization
- **Performance improvement**: 30-50% faster builds

## 🔄 Testing Process

1. Run on free plan (2 vCPU) → Save performance report
2. Upgrade to paid plan (4 vCPU) → Run again
3. Compare `vcpu-performance-report.json` files
4. Calculate ROI based on build time savings

No configuration required - just import and build! 🎉
