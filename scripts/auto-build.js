const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

function detectEnvironment() {
  const cpuCount = os.cpus().length;
  const totalMemory = Math.round(os.totalmem() / 1024 / 1024 / 1024);
  
  const isCloudflare = process.env.CF_PAGES || 
                      process.env.CLOUDFLARE_ENV || 
                      process.env.CF_PAGES_BRANCH ||
                      process.env.WRANGLER_SEND_METRICS;
  
  return { cpuCount, totalMemory, isCloudflare, platform: os.platform(), arch: os.arch() };
}

function generateMegaWebpackConfig(settings) {
  const config = `
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    main: './src/index.js',
    worker1: './src/index.js',
    worker2: './src/index.js',
    worker3: './src/index.js',
    worker4: './src/index.js',
    worker5: './src/index.js',
    worker6: './src/index.js',
    worker7: './src/index.js',
    worker8: './src/index.js'
  },
  target: 'webworker',
  mode: 'production',
  
  module: {
    rules: [
      {
        test: /\\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: { browsers: ['chrome >= 80'] },
                modules: false
              }]
            ]
          }
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
            drop_console: false,
            reduce_vars: true,
            collapse_vars: true,
            inline: 2,
            unsafe: true,
            unsafe_comps: true,
            unsafe_math: true,
            toplevel: true
          },
          mangle: {
            toplevel: true,
            properties: {
              regex: /^_private/
            }
          },
          format: {
            comments: false,
          },
        },
        parallel: ${settings.parallel},
        extractComments: false
      })
    ],
    
    splitChunks: {
      chunks: 'all',
      minSize: 1000,
      maxSize: 50000,
      cacheGroups: {
        lodash: {
          test: /[\\\\/]node_modules[\\\\/]lodash/,
          name: 'lodash-chunk',
          chunks: 'all',
          priority: 20
        },
        moment: {
          test: /[\\\\/]node_modules[\\\\/]moment/,
          name: 'moment-chunk',
          chunks: 'all',
          priority: 19
        },
        ramda: {
          test: /[\\\\/]node_modules[\\\\/]ramda/,
          name: 'ramda-chunk',
          chunks: 'all',
          priority: 18
        },
        mathjs: {
          test: /[\\\\/]node_modules[\\\\/]mathjs/,
          name: 'mathjs-chunk',
          chunks: 'all',
          priority: 17
        },
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        }
      }
    }
  },

  resolve: {
    fallback: {
      "crypto": false,
      "stream": false,
      "buffer": false,
      "util": false,
      "fs": false,
      "path": false
    }
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-[chunkhash].chunk.js',
    clean: true
  }
};`;

  fs.writeFileSync('webpack.mega.js', config);
}

function runCpuBurnTest(durationMs) {
  console.log(\`🔥 Running CPU burn test for \${durationMs}ms...\`);
  const start = Date.now();
  let iterations = 0;
  
  while (Date.now() - start < durationMs) {
    // Pure CPU intensive operations
    for (let i = 0; i < 100000; i++) {
      Math.sin(Math.random() * Math.PI);
      Math.cos(Math.random() * Math.PI);
      Math.sqrt(Math.random() * 1000000);
      iterations++;
    }
  }
  
  return iterations;
}

function runMegaStressBuild() {
  const env = detectEnvironment();
  
  console.log('🔥🔥🔥 MEGA CPU STRESS TEST - MAXIMUM LOAD 🔥🔥🔥');
  console.log('================================================');
  console.log(\`💻 Detected CPUs: \${env.cpuCount} cores\`);
  console.log(\`🧠 Memory: \${env.totalMemory}GB\`);
  console.log(\`☁️  Cloudflare Environment: \${env.isCloudflare ? 'YES' : 'Local'}\`);
  console.log(\`🏗️  Platform: \${env.platform} (\${env.arch})\`);
  
  // MEGA settings for maximum stress
  const webpackSettings = {
    parallel: env.cpuCount * 4, // 4x CPU count for max parallelism
    passes: 10, // MAXIMUM compression passes
    chunks: 'mega-aggressive'
  };
  
  console.log(\`⚙️  Webpack parallel: \${webpackSettings.parallel}\`);
  console.log(\`🔧 Compression passes: \${webpackSettings.passes}\`);
  console.log('🎯 Target: 10-15 minute stress test');
  console.log('');
  
  const builds = [];
  const numTests = 8; // More tests = more stress
  
  for (let i = 1; i <= numTests; i++) {
    console.log(\`📦 MEGA BUILD \${i}/\${numTests} - Maximum CPU stress...\`);
    
    // Clean previous build
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    
    const overallStart = Date.now();
    const startCpuUsage = process.cpuUsage();
    
    try {
      // Pre-build CPU burn test
      console.log('   🔥 Pre-build CPU burn (30 seconds)...');
      const burnIterations = runCpuBurnTest(30000);
      
      // Generate mega webpack config
      generateMegaWebpackConfig(webpackSettings);
      
      console.log('   🏗️  Starting webpack mega build...');
      const webpackStart = Date.now();
      
      // Run webpack with maximum stress
      const buildOutput = execSync('npx webpack --config webpack.mega.js --progress', {
        encoding: 'utf8',
        timeout: 1200000, // 20 minute timeout
        stdio: 'pipe'
      });
      
      const webpackTime = Date.now() - webpackStart;
      
      // Post-build CPU burn test
      console.log('   🔥 Post-build CPU burn (30 seconds)...');
      const postBurnIterations = runCpuBurnTest(30000);
      
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      const totalTime = Date.now() - overallStart;
      
      // Calculate CPU metrics
      const userCpuTime = endCpuUsage.user / 1000;
      const systemCpuTime = endCpuUsage.system / 1000;
      const totalCpuTime = userCpuTime + systemCpuTime;
      const cpuUtilization = (totalCpuTime / totalTime) * 100;
      
      // Check all output files
      const distFiles = fs.existsSync('dist') ? fs.readdirSync('dist') : [];
      const totalBundleSize = distFiles.reduce((size, file) => {
        return size + fs.statSync(\`dist/\${file}\`).size;
      }, 0);
      
      const result = {
        build: i,
        totalDuration: totalTime,
        webpackDuration: webpackTime,
        burnIterations: burnIterations + postBurnIterations,
        cpuMetrics: {
          cores: env.cpuCount,
          userTime: Math.round(userCpuTime),
          systemTime: Math.round(systemCpuTime),
          totalTime: Math.round(totalCpuTime),
          utilization: Math.round(cpuUtilization * 100) / 100
        },
        bundleInfo: {
          totalSize: totalBundleSize,
          fileCount: distFiles.length,
          files: distFiles
        },
        webpackSettings,
        success: true
      };
      
      builds.push(result);
      
      console.log(\`   ✅ \${totalTime}ms total | Webpack: \${webpackTime}ms | CPU: \${result.cpuMetrics.utilization}% | Bundle: \${Math.round(totalBundleSize/1024)}KB (\${distFiles.length} files)\`);
      
    } catch (error) {
      const totalTime = Date.now() - overallStart;
      console.log(\`   ❌ Build failed after \${totalTime}ms\`);
      console.log(\`   Error: \${error.message.substring(0, 200)}...\`);
      
      builds.push({
        build: i,
        totalDuration: totalTime,
        success: false,
        error: error.message.substring(0, 500)
      });
    }
    
    // Brief pause between mega builds
    if (i < numTests) {
      console.log('   ⏱️  Cooling down 5 seconds...');
      execSync('sleep 5');
    }
  }
  
  // Generate mega report
  const successfulBuilds = builds.filter(b => b.success);
  
  if (successfulBuilds.length === 0) {
    console.log('\\n❌ No successful builds to analyze');
    return;
  }
  
  const avgDuration = successfulBuilds.reduce((sum, b) => sum + b.totalDuration, 0) / successfulBuilds.length;
  const avgWebpackTime = successfulBuilds.reduce((sum, b) => sum + (b.webpackDuration || 0), 0) / successfulBuilds.length;
  const avgCpuUtil = successfulBuilds.reduce((sum, b) => sum + (b.cpuMetrics?.utilization || 0), 0) / successfulBuilds.length;
  const avgBundleSize = successfulBuilds.reduce((sum, b) => sum + (b.bundleInfo?.totalSize || 0), 0) / successfulBuilds.length;
  const avgFileCount = successfulBuilds.reduce((sum, b) => sum + (b.bundleInfo?.fileCount || 0), 0) / successfulBuilds.length;
  
  console.log('\\n🎯 === MEGA vCPU STRESS TEST RESULTS ===');
  console.log(\`📊 Environment: \${env.cpuCount} vCPU, \${env.totalMemory}GB RAM\`);
  console.log(\`⏱️  Average Total Time: \${Math.round(avgDuration)}ms (\${Math.round(avgDuration/1000)}s)\`);
  console.log(\`🏗️  Average Webpack Time: \${Math.round(avgWebpackTime)}ms (\${Math.round(avgWebpackTime/1000)}s)\`);
  console.log(\`🔥 Average CPU Utilization: \${Math.round(avgCpuUtil * 100) / 100}%\`);
  console.log(\`📦 Average Bundle Size: \${Math.round(avgBundleSize / 1024)}KB\`);
  console.log(\`📄 Average File Count: \${Math.round(avgFileCount)} files\`);
  console.log(\`⚙️  Webpack Parallel: \${webpackSettings.parallel} processes\`);
  console.log(\`🗜️  Compression Passes: \${webpackSettings.passes}\`);
  console.log(\`✅ Successful Builds: \${successfulBuilds.length}/\${numTests}\`);
  
  // Performance classification with more detail
  let performanceClass;
  if (env.cpuCount >= 4 && avgDuration < 600000 && avgCpuUtil > 60) {
    performanceClass = '🚀 MEGA PERFORMANCE (4+ vCPU)';
  } else if (env.cpuCount >= 4) {
    performanceClass = '⚡ HIGH PERFORMANCE (4+ vCPU)';
  } else if (env.cpuCount === 2 && avgCpuUtil > 70) {
    performanceClass = '💪 MAXED OUT (2 vCPU)';
  } else if (env.cpuCount === 2) {
    performanceClass = '📈 STANDARD (2 vCPU)';
  } else {
    performanceClass = '🤔 UNKNOWN CONFIGURATION';
  }
  
  console.log(\`🏆 Performance Class: \${performanceClass}\`);
  
  // Calculate efficiency metrics
  const timePerCore = avgDuration / env.cpuCount;
  const bundlePerSecond = (avgBundleSize / 1024) / (avgDuration / 1000);
  
  console.log(\`\\n📈 EFFICIENCY METRICS:\`);
  console.log(\`⚡ Time per CPU core: \${Math.round(timePerCore)}ms\`);
  console.log(\`📊 Bundle KB per second: \${Math.round(bundlePerSecond * 100) / 100}\`);
  console.log(\`🎯 CPU cores utilized effectively: \${avgCpuUtil > 50 ? 'YES' : 'PARTIAL'}\`);
  
  // Save mega detailed results
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'MEGA_STRESS_TEST',
    environment: env,
    webpackSettings: webpackSettings,
    builds: builds,
    summary: {
      avgTotalDuration: Math.round(avgDuration),
      avgWebpackDuration: Math.round(avgWebpackTime),
      avgCpuUtilization: Math.round(avgCpuUtil * 100) / 100,
      avgBundleSize: Math.round(avgBundleSize),
      avgFileCount: Math.round(avgFileCount),
      performanceClass,
      efficiencyMetrics: {
        timePerCore: Math.round(timePerCore),
        bundlePerSecond: Math.round(bundlePerSecond * 100) / 100
      }
    }
  };
  
  fs.writeFileSync('mega-vcpu-stress-report.json', JSON.stringify(report, null, 2));
  console.log('\\n💾 MEGA detailed report saved to mega-vcpu-stress-report.json');
  
  // Cleanup
  if (fs.existsSync('webpack.mega.js')) {
    fs.unlinkSync('webpack.mega.js');
  }
  
  return builds;
}

// Run the mega stress test
runMegaStressBuild();
