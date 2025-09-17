const fs = require('fs');

console.log('🔧 Setting up Cloudflare Workers vCPU stress test...');

// Ensure src directory exists
if (!fs.existsSync('src')) {
  fs.mkdirSync('src');
  console.log('✅ Created src directory');
}

// Auto-generate minimal .babelrc if missing
if (!fs.existsSync('.babelrc')) {
  const babelConfig = {
    "presets": [
      ["@babel/preset-env", {
        "targets": { "browsers": ["chrome >= 80"] },
        "modules": false
      }]
    ]
  };
  fs.writeFileSync('.babelrc', JSON.stringify(babelConfig, null, 2));
  console.log('✅ Created .babelrc');
}

// Auto-generate wrangler.toml if missing
if (!fs.existsSync('wrangler.toml')) {
  const wranglerConfig = `name = "vcpu-stress-test"
main = "dist/worker.js"
compatibility_date = "2024-09-17"

[build]
command = "npm run build"
watch_dir = "src"

[vars]
VCPU_TEST = "auto-configured"
`;
  fs.writeFileSync('wrangler.toml', wranglerConfig);
  console.log('✅ Created wrangler.toml');
}

console.log('🎉 Setup complete! Run "npm run build" to start vCPU stress test');
