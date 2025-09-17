// Working CPU-intensive worker that actually builds
import _ from 'lodash';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays } from 'date-fns';
import * as R from 'ramda';
import { List, Map } from 'immutable';
import classNames from 'classnames';
import validator from 'validator';
import * as math from 'mathjs';
import Big from 'big.js';
import CryptoJS from 'crypto-js';

// CPU stress configuration that will actually compile
const STRESS_CONFIG = {
  dataSize: 5000,
  iterations: 2000,
  matrixSize: 100
};

console.log('🔥 STRESS CONFIG: ' + STRESS_CONFIG.dataSize + ' records, ' + STRESS_CONFIG.iterations + ' iterations');

// Generate large dataset for CPU stress
const stressDataSet = {
  timestamp: moment().toISOString(),
  config: STRESS_CONFIG,
  users: _.range(STRESS_CONFIG.dataSize).map(i => ({
    id: i,
    uuid: uuidv4(),
    name: 'StressUser ' + i,
    email: 'stressuser' + i + '@test.com',
    created: moment().subtract(i, 'hours').toISOString(),
    tags: _.times(15, () => 'tag-' + Math.floor(Math.random() * 1000)),
    scores: _.times(50, () => Math.random() * 100),
    metadata: {
      preferences: _.times(25, j => ({
        key: 'pref_' + j,
        value: uuidv4(),
        weight: Math.random()
      })),
      history: _.times(100, k => ({
        action: _.sample(['view', 'click', 'purchase', 'share']),
        timestamp: moment().subtract(k, 'minutes').toISOString(),
        value: Math.random() * 1000
      }))
    }
  })),
  
  products: _.range(STRESS_CONFIG.dataSize / 2).map(i => ({
    id: i,
    sku: uuidv4(),
    name: 'StressProduct ' + i,
    description: _.times(30, () => 'word' + Math.floor(Math.random() * 1000)).join(' '),
    price: _.round(Math.random() * 1000, 2),
    categories: _.times(8, () => 'cat-' + Math.floor(Math.random() * 100)),
    variants: _.times(10, j => ({
      id: i + '-' + j,
      sku: uuidv4(),
      attributes: _.times(10, k => ({
        name: 'attr_' + k,
        value: 'value_' + Math.floor(Math.random() * 100)
      }))
    }))
  }))
};

// CPU-intensive processors that will compile
const processors = {
  heavyLodashProcessor: (data) => {
    console.log('🔥 Running heavy lodash operations...');
    const start = performance.now();
    
    const result = _.chain(data.users)
      .groupBy(user => moment(user.created).format('YYYY-MM'))
      .mapValues(group => {
        // Heavy processing per group
        const calculations = _.times(500, i => {
          const shuffled = _.shuffle(group);
          const sorted = _.sortBy(shuffled, 'id');
          const mapped = _.map(sorted, u => ({
            id: u.id,
            name: u.name,
            avgScore: _.mean(u.scores),
            complexity: Math.sin(i) * _.sum(u.scores)
          }));
          return mapped.length;
        });
        
        return {
          count: group.length,
          avgScore: _.mean(group.flatMap(u => u.scores)),
          topTags: _.take(_.keys(_.countBy(group.flatMap(u => u.tags))), 10),
          processed: _.sortBy(group, 'id').map(u => _.pick(u, ['id', 'name', 'email'])),
          complexity: _.sum(calculations)
        };
      })
      .value();
    
    console.log('   ✅ Heavy lodash completed in ' + (performance.now() - start).toFixed(2) + 'ms');
    return result;
  },

  heavyMathProcessor: () => {
    console.log('🧮 Running heavy math operations...');
    const start = performance.now();
    
    const results = [];
    for (let i = 0; i < STRESS_CONFIG.iterations; i++) {
      // Matrix operations
      const matrix1 = math.random([STRESS_CONFIG.matrixSize, STRESS_CONFIG.matrixSize]);
      const matrix2 = math.random([STRESS_CONFIG.matrixSize, STRESS_CONFIG.matrixSize]);
      
      // Heavy operations
      const multiplied = math.multiply(matrix1, matrix2);
      const transposed = math.transpose(multiplied);
      const det = math.det(transposed);
      
      // Big number calculations
      const bigOps = _.times(10, j => {
        const big1 = new Big(Math.random() * 1000);
        const big2 = new Big(Math.random() * 1000);
        return big1.plus(big2).toString();
      });
      
      results.push({
        iteration: i,
        determinant: det,
        bigNumbers: bigOps.slice(0, 3)
      });
      
      // CPU burn every 100 iterations
      if (i % 100 === 0) {
        _.times(1000, n => Math.sin(n * Math.PI / 180));
      }
    }
    
    console.log('   ✅ Heavy math completed in ' + (performance.now() - start).toFixed(2) + 'ms');
    return { calculations: results.length, sample: results.slice(0, 5) };
  },

  heavyCryptoProcessor: (data) => {
    console.log('🔐 Running heavy crypto operations...');
    const start = performance.now();
    
    const results = [];
    
    // Process users with crypto operations
    data.users.slice(0, 1000).forEach((user, i) => {
      // Hash operations
      const sha256 = CryptoJS.SHA256(JSON.stringify(user.metadata)).toString();
      const md5 = CryptoJS.MD5(user.email).toString();
      
      // Key derivation (CPU intensive)
      const key = CryptoJS.PBKDF2(user.email, 'salt', { 
        keySize: 128/32, 
        iterations: 100 + (i % 100) 
      }).toString();
      
      results.push({
        userId: user.id,
        sha256: sha256.substring(0, 16),
        md5: md5.substring(0, 16),
        derivedKey: key.substring(0, 16)
      });
    });
    
    console.log('   ✅ Heavy crypto completed in ' + (performance.now() - start).toFixed(2) + 'ms');
    return { processed: results.length, sample: results.slice(0, 5) };
  },

  heavyValidationProcessor: (data) => {
    console.log('✅ Running heavy validation operations...');
    const start = performance.now();
    
    const results = data.users.slice(0, 1000).map((user, i) => {
      // Multiple validations per user
      const validations = _.times(100, j => {
        const testEmail = 'test' + i + j + '@example.com';
        const testUuid = uuidv4();
        
        return {
          emailValid: validator.isEmail(testEmail),
          uuidValid: validator.isUUID(testUuid),
          lengthValid: validator.isLength('test' + j, { min: 1, max: 100 }),
          numericValid: validator.isNumeric('' + Math.floor(Math.random() * 1000))
        };
      });
      
      const classes = classNames({
        'valid-user': validator.isEmail(user.email),
        'premium-user': _.mean(user.scores) > 75,
        'active-user': moment(user.created).isAfter(moment().subtract(30, 'days'))
      });
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isValidEmail: validator.isEmail(user.email),
        validationCount: validations.length,
        validValidations: validations.filter(v => v.emailValid && v.uuidValid).length,
        classes: classes
      };
    });
    
    console.log('   ✅ Heavy validation completed in ' + (performance.now() - start).toFixed(2) + 'ms');
    return results;
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const start = performance.now();

    let result;
    let operation = 'info';
    
    switch (url.pathname) {
      case '/stress':
        operation = 'FULL-STRESS-TEST';
        console.log('🔥🔥 Running FULL CPU STRESS TEST...');
        result = {
          lodash: processors.heavyLodashProcessor(stressDataSet),
          math: processors.heavyMathProcessor(),
          crypto: processors.heavyCryptoProcessor(stressDataSet),
          validation: processors.heavyValidationProcessor(stressDataSet).slice(0, 10)
        };
        break;
        
      case '/lodash':
        operation = 'lodash-stress';
        result = processors.heavyLodashProcessor(stressDataSet);
        break;
        
      case '/math':
        operation = 'math-stress';
        result = processors.heavyMathProcessor();
        break;
        
      case '/crypto':
        operation = 'crypto-stress';
        result = processors.heavyCryptoProcessor(stressDataSet);
        break;
        
      case '/validation':
        operation = 'validation-stress';
        result = processors.heavyValidationProcessor(stressDataSet).slice(0, 10);
        break;
        
      default:
        result = {
          message: 'Cloudflare Workers vCPU Stress Test',
          config: STRESS_CONFIG,
          dataSize: {
            users: stressDataSet.users.length,
            products: stressDataSet.products.length
          },
          endpoints: ['/stress', '/lodash', '/math', '/crypto', '/validation'],
          instructions: 'Use /stress for full CPU load test'
        };
    }

    const processingTime = performance.now() - start;

    return new Response(JSON.stringify({
      operation,
      processingTime: processingTime.toFixed(2) + 'ms',
      timestamp: moment().toISOString(),
      result: operation === 'FULL-STRESS-TEST' ? 
        { message: 'Stress test completed - results truncated for response size' } : 
        result,
      performance: {
        light: processingTime < 100,
        moderate: processingTime >= 100 && processingTime < 500,
        heavy: processingTime >= 500 && processingTime < 2000,
        extreme: processingTime >= 2000,
        classification: processingTime >= 2000 ? 'EXTREME' : 
                       processingTime >= 500 ? 'HEAVY' : 
                       processingTime >= 100 ? 'MODERATE' : 'LIGHT'
      }
    }, null, 2), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Processing-Time': processingTime.toFixed(2) + 'ms',
        'X-vCPU-Test': 'stress-active'
      }
    });
  }
};
