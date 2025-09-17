const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

function detectEnvironment() {
  const cpuCount = os.cpus().length;
  const totalMemory = Math.round(os.totalmem() / 1024 / 1024 / 1024);
  
  // Try to detect if we're in Cloudflare Workers build environment
  const isCloudflare = process.env.CF_PAGES || 
                      process.env.CLOUDFLARE_ENV || 
                      process.env.CF_PAGES_BRANCH ||
                      process.env.WRANGLER_SEND_METRICS;
  
  return {
    cpuCount,
    totalMemory,
    isCloudflare,
    platform: os.platform(),
    arch: os.arch()
  };
}

function generateWebpackConfig(settings) {
  const config = `
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  target: 'webworker',
  mode: 'production',
  
  module: {
    rules: [
      {
        test: /\\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            passes: ${settings.passes},
            drop_console: true,
            reduce_vars: true,
            collapse_vars: true,
            inline: 3,
            unsafe: true
          },
          mangle: {
            toplevel: true
          }
        },
        parallel: ${settings.parallel},
        extractComments: false
      })
    ],
    
    splitChunks: ${settings.chunks === 'aggressive' ? `{
      chunks: 'all',
      minSize: 0,
      maxSize: 100000,
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }` : '{}'}
  },

  resolve: {
    fallback: {
      "crypto": false,
      "stream": false,
      "buffer": false,
      "util": false
    }
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'worker.js',
    clean: true
  }
};`;

  fs.writeFileSync('webpack.auto.js', config);
}

function classifyPerformance(cpuCount, avgDuration, avgCpuUtil) {
  if (cpuCount >= 4 && avgDuration < 15000 && avgCpuUtil > 70) {
    return '🚀 HIGH PERFORMANCE (4+ vCPU)';
  } else if (cpuCount >= 4 && avgDuration < 25000) {
    return '⚡ GOOD PERFORMANCE (4+ vCPU)';
  } else if (cpuCount === 2 && avgDuration < 30000 && avgCpuUtil > 80) {
    return '👍 OPTIMIZED (2 vCPU)';
  } else if (cpuCount === 2) {
    return '📈 STANDARD (2 vCPU)';
  } else {
    return '🤔 UNKNOWN CONFIGURATION';
  }
}

function runStressBuild() {
  const env = detectEnvironment();
  
  console.log('🚀 CLOUDFLARE WORKERS vCPU STRESS TEST');
  console.log('=====================================');
  console.log(`💻 Detected CPUs: ${env.cpuCount} cores`);
  console.log(`🧠 Memory: ${env.totalMemory}GB`);
  console.log(`☁️  Cloudflare Environment: ${env.isCloudflare ? 'YES' : 'Local'}`);
  console.log(`🏗️  Platform: ${env.platform} (${env.arch})`);
  
  // Determine optimal webpack settings based on CPU count
  const webpackSettings = {
    parallel: Math.min(env.cpuCount * 2, 16),
    passes: env.cpuCount >= 4 ? 8 : 5,
    chunks: env.cpuCount >= 4 ? 'aggressive' : 'normal'
  };
  
  console.log(`⚙️  Webpack parallel: ${webpackSettings.parallel}`);
  console.log(`🔧 Compression passes: ${webpackSettings.passes}`);
  console.log('');
  
  const builds = [];
  const numTests = 3;
  
  for (let i = 1; i <= numTests; i++) {
    console.log(`📦 Build ${i}/${numTests} - Measuring CPU performance...`);
    
    // Clean previous build
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    
    const start = Date.now();
    const startCpuUsage = process.cpuUsage();
    
    try {
      // Generate webpack config on the fly
      generateWebpackConfig(webpackSettings);
      
      // Run webpack with CPU monitoring
      const buildOutput = execSync('npx webpack --config webpack.auto.js --progress', {
        encoding: 'utf8',
        timeout: 600000,
        stdio: 'pipe'
      });
      
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      const buildTime = Date.now() - start;
      
      // Calculate CPU metrics
      const userCpuTime = endCpuUsage.user / 1000;
      const systemCpuTime = endCpuUsage.system / 1000;
      const totalCpuTime = userCpuTime + systemCpuTime;
      const cpuUtilization = (totalCpuTime / buildTime) * 100;
      
      // Check output
      const bundleStats = fs.existsSync('dist/worker.js') ? 
        fs.statSync('dist/worker.js') : { size: 0 };
      
      const result = {
        build: i,
        duration: buildTime,
        cpuMetrics: {
          cores: env.cpuCount,
          userTime: Math.round(userCpuTime),
          systemTime: Math.round(systemCpuTime),
          totalTime: Math.round(totalCpuTime),
          utilization: Math.round(cpuUtilization * 100) / 100
        },
        bundleSize: bundleStats.size,
        webpackSettings,
        success: true
      };
      
      builds.push(result);
      
      console.log(`   ✅ ${buildTime}ms | CPU: ${result.cpuMetrics.utilization}% | Bundle: ${Math.round(bundleStats.size/1024)}KB`);
      
    } catch (error) {
      const buildTime = Date.now() - start;
      console.log(`   ❌ Build failed after ${buildTime}ms`);
      
      builds.push({
        build: i,
        duration: buildTime,
        success: false,
        error: error.message.substring(0, 300)
      });
    }
    
    // Brief pause
    if (i < numTests) {
      console.log('   ⏱️  Waiting 2 seconds...');
      execSync('sleep 2');
    }
  }
  
  // Generate final report
  const successfulBuilds = builds.filter(b => b.success);
  
  if (successfulBuilds.length === 0) {
    console.log('\n❌ No successful builds to analyze');
    return;
  }
  
  const avgDuration = successfulBuilds.reduce((sum, b) => sum + b.duration, 0) / successfulBuilds.length;
  const avgCpuUtil = successfulBuilds.reduce((sum, b) => sum + (b.cpuMetrics?.utilization || 0), 0) / successfulBuilds.length;
  const avgBundleSize = successfulBuilds.reduce((sum, b) => sum + b.bundleSize, 0) / successfulBuilds.length;
  
  console.log('\n🎯 === vCPU PERFORMANCE REPORT ===');
  console.log(`📊 Environment: ${env.cpuCount} vCPU, ${env.totalMemory}GB RAM`);
  console.log(`⏱️  Average Build Time: ${Math.round(avgDuration)}ms`);
  console.log(`🔥 Average CPU Utilization: ${Math.round(avgCpuUtil * 100) / 100}%`);
  console.log(`📦 Average Bundle Size: ${Math.round(avgBundleSize / 1024)}KB`);
  console.log(`⚙️  Webpack Parallel: ${webpackSettings.parallel} processes`);
  console.log(`🗜️  Compression Passes: ${webpackSettings.passes}`);
  
  // Performance classification
  const performanceClass = classifyPerformance(env.cpuCount, avgDuration, avgCpuUtil);
  console.log(`🏆 Performance Class: ${performanceClass}`);
  
  // Save detailed results
  const report = {
    timestamp: new Date().toISOString(),
    environment: env,
    webpackSettings: webpackSettings,
    builds: builds,
    summary: {
      avgDuration: Math.round(avgDuration),
      avgCpuUtilization: Math.round(avgCpuUtil * 100) / 100,
      avgBundleSize: Math.round(avgBundleSize),
      performanceClass
    }
  };
  
  fs.writeFileSync('vcpu-performance-report.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Detailed report saved to vcpu-performance-report.json');
  
  // Cleanup
  if (fs.existsSync('webpack.auto.js')) {
    fs.unlinkSync('webpack.auto.js');
  }
  
  return builds;
}

// Auto-run the stress test
runStressBuild();
