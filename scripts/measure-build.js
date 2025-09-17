const { execSync } = require('child_process');
const fs = require('fs');

function measureBuild() {
  console.log('🔧 Starting Worker build performance measurement...');
  
  const builds = [];
  const numTests = 5;
  
  for (let i = 1; i <= numTests; i++) {
    console.log(`\n📦 Build ${i}/${numTests}:`);
    
    // Clean previous build
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    
    const start = Date.now();
    
    try {
      // Time the webpack build with detailed output
      console.log('   Starting webpack build...');
      const output = execSync('npm run build', { 
        encoding: 'utf8',
        timeout: 300000, // 5 minute timeout
        stdio: 'pipe'
      });
      
      const buildTime = Date.now() - start;
      console.log(`   ✅ Build completed in ${buildTime}ms`);
      
      // Check bundle size
      const stats = fs.statSync('dist/worker.js');
      const bundleSize = stats.size;
      
      builds.push({
        buildNumber: i,
        duration: buildTime,
        bundleSize: bundleSize,
        success: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      const buildTime = Date.now() - start;
      console.log(`   ❌ Build failed after ${buildTime}ms`);
      console.log(`   Error: ${error.message.substring(0, 200)}...`);
      
      builds.push({
        buildNumber: i,
        duration: buildTime,
        success: false,
        error: error.message.substring(0, 500),
        timestamp: new Date().toISOString()
      });
    }
    
    // Brief pause between builds
    if (i < numTests) {
      console.log('   ⏱️  Waiting 2 seconds before next build...');
      execSync('sleep 2');
    }
  }
  
  // Calculate statistics
  const successfulBuilds = builds.filter(b => b.success);
  if (successfulBuilds.length > 0) {
    const avgTime = successfulBuilds.reduce((sum, b) => sum + b.duration, 0) / successfulBuilds.length;
    const minTime = Math.min(...successfulBuilds.map(b => b.duration));
    const maxTime = Math.max(...successfulBuilds.map(b => b.duration));
    const avgBundleSize = successfulBuilds.reduce((sum, b) => sum + (b.bundleSize || 0), 0) / successfulBuilds.length;
    
    console.log('\n📊 === Build Performance Summary ===');
    console.log(`✅ Successful builds: ${successfulBuilds.length}/${numTests}`);
    console.log(`⏱️  Average build time: ${Math.round(avgTime)}ms`);
    console.log(`🚀 Fastest build: ${minTime}ms`);
    console.log(`🐌 Slowest build: ${maxTime}ms`);
    console.log(`📦 Average bundle size: ${Math.round(avgBundleSize / 1024)}KB`);
    
    // Save results
    const results = {
      testMetadata: {
        testDate: new Date().toISOString(),
        testRuns: numTests,
        successfulRuns: successfulBuilds.length
      },
      builds: builds,
      summary: {
        averageTime: Math.round(avgTime),
        minTime,
        maxTime,
        averageBundleSize: Math.round(avgBundleSize),
        standardDeviation: Math.round(Math.sqrt(
          successfulBuilds.reduce((sum, b) => sum + Math.pow(b.duration - avgTime, 2), 0) / successfulBuilds.length
        ))
      }
    };
    
    fs.writeFileSync('build-performance-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Results saved to build-performance-results.json');
    
    return results;
  } else {
    console.log('\n❌ No successful builds to analyze');
    return null;
  }
}

// Run the measurement
measureBuild();
