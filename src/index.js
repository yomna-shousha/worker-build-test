// Auto-generated heavy computation worker with vCPU reporting
import _ from 'lodash';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays } from 'date-fns';
import * as R from 'ramda';
import { fromEvent, interval, map, filter, take } from 'rxjs';
import { List, Map } from 'immutable';
import classNames from 'classnames';
import validator from 'validator';
import * as math from 'mathjs';
import Big from 'big.js';

// Auto-configure based on environment
const AUTO_CONFIG = {
  dataSize: 3000,
  iterations: 800,
  matrixSize: 100
};

console.log(`🎯 Auto-configured for: ${AUTO_CONFIG.dataSize} records, ${AUTO_CONFIG.iterations} iterations`);

// Generate massive dataset for CPU stress
const massiveDataSet = {
  timestamp: moment().toISOString(),
  config: AUTO_CONFIG,
  users: _.range(AUTO_CONFIG.dataSize).map(i => ({
    id: i,
    uuid: uuidv4(),
    name: `User ${i}`,
    email: `user${i}@example.com`,
    created: moment().subtract(i, 'hours').toISOString(),
    tags: _.times(15, () => `tag-${Math.floor(Math.random() * 1000)}`),
    scores: _.times(50, () => Math.random() * 100),
    metadata: {
      preferences: _.times(20, j => ({
        key: `pref_${j}`,
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
  
  products: _.range(AUTO_CONFIG.dataSize / 2).map(i => ({
    id: i,
    sku: uuidv4(),
    name: `Product ${i}`,
    description: _.times(20, () => `word${Math.floor(Math.random() * 10000)}`).join(' '),
    price: _.round(Math.random() * 1000, 2),
    categories: _.times(5, () => `cat-${Math.floor(Math.random() * 100)}`),
    variants: _.times(10, j => ({
      id: `${i}-${j}`,
      sku: uuidv4(),
      attributes: _.times(8, k => ({
        name: `attr_${k}`,
        value: `value_${Math.floor(Math.random() * 100)}`
      }))
    }))
  }))
};

// Heavy CPU-intensive processors
const processors = {
  lodashProcessor: (data) => {
    console.log('🔥 Running heavy lodash operations...');
    return _.chain(data.users)
      .groupBy(user => moment(user.created).format('YYYY-MM'))
      .mapValues(group => ({
        count: group.length,
        avgScore: _.mean(group.flatMap(u => u.scores)),
        topTags: _.take(_.keys(_.countBy(group.flatMap(u => u.tags))), 10),
        processed: _.sortBy(group, 'id').map(u => _.pick(u, ['id', 'name', 'email'])),
        complexCalc: _.times(100, () => _.shuffle(group)).length
      }))
      .value();
  },

  ramdaProcessor: (data) => {
    console.log('⚡ Running heavy Ramda operations...');
    const processUser = R.pipe(
      R.pick(['id', 'name', 'scores', 'tags']),
      R.assoc('avgScore', R.pipe(R.prop('scores'), R.mean)),
      R.assoc('tagCount', R.pipe(R.prop('tags'), R.length)),
      R.assoc('processed', true)
    );
    
    return R.pipe(
      R.prop('users'),
      R.map(processUser),
      R.groupBy(R.pipe(R.prop('avgScore'), score => score > 50 ? 'high' : 'low')),
      R.mapObjIndexed((group, key) => ({
        category: key,
        count: R.length(group),
        avgScore: R.pipe(R.pluck('avgScore'), R.mean)(group),
        complexity: R.times(R.identity, 1000).length
      }))
    )(data);
  },

  mathProcessor: () => {
    console.log('🧮 Running heavy math operations...');
    const results = [];
    for (let i = 0; i < AUTO_CONFIG.iterations; i++) {
      // Create random matrices
      const matrix1 = math.random([AUTO_CONFIG.matrixSize, AUTO_CONFIG.matrixSize]);
      const matrix2 = math.random([AUTO_CONFIG.matrixSize, AUTO_CONFIG.matrixSize]);
      
      // Heavy matrix operations
      const multiplied = math.multiply(matrix1, matrix2);
      const transposed = math.transpose(multiplied);
      const determinant = math.det(transposed);
      
      // Big number calculations
      const big1 = new Big(Math.random() * 1000);
      const big2 = new Big(Math.random() * 1000);
      const bigResult = big1.pow(3).plus(big2.sqrt());
      
      results.push({
        iteration: i,
        determinant: determinant,
        bigNumber: bigResult.toString()
      });
    }
    return { calculations: results.length, sample: results.slice(0, 5) };
  },

  immutableProcessor: (data) => {
    console.log('💎 Running heavy Immutable operations...');
    const immutableData = Map(data);
    const usersList = List(immutableData.get('users', []));
    
    return usersList
      .groupBy(user => moment(user.created).format('YYYY'))
      .map(group => Map({
        count: group.size,
        users: group.map(user => user.name).toArray(),
        avgScore: group.reduce((sum, user) => {
          const scores = user.scores;
          return sum + (Array.isArray(scores) ? _.mean(scores) : 0);
        }, 0) / group.size,
        heavyCalc: _.times(200, () => group.size).reduce((a, b) => a + b, 0)
      }))
      .toJS();
  },

  validationProcessor: (data) => {
    console.log('✅ Running heavy validation operations...');
    return data.users.map(user => {
      // Perform expensive validations
      const validations = _.times(50, i => ({
        test: `validation_${i}`,
        result: validator.isEmail(`test${i}@example.com`),
        uuid: validator.isUUID(uuidv4()),
        length: validator.isLength(user.name, { min: 1, max: 100 })
      }));
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isValidEmail: validator.isEmail(user.email),
        isValidUUID: validator.isUUID(user.uuid),
        validationCount: validations.length,
        classes: classNames({
          'valid-user': validator.isEmail(user.email),
          'premium-user': _.mean(user.scores) > 75,
          'active-user': moment(user.created).isAfter(moment().subtract(30, 'days'))
        })
      };
    });
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
        operation = 'full-stress-test';
        console.log('🚀 Running FULL CPU STRESS TEST...');
        result = {
          lodash: processors.lodashProcessor(massiveDataSet),
          ramda: processors.ramdaProcessor(massiveDataSet),
          math: processors.mathProcessor(),
          immutable: processors.immutableProcessor(massiveDataSet),
          validation: processors.validationProcessor(massiveDataSet).slice(0, 10)
        };
        break;
      case '/lodash':
        operation = 'lodash-stress';
        result = processors.lodashProcessor(massiveDataSet);
        break;
      case '/math':
        operation = 'math-stress';
        result = processors.mathProcessor();
        break;
      case '/ramda':
        operation = 'ramda-stress';
        result = processors.ramdaProcessor(massiveDataSet);
        break;
      case '/immutable':
        operation = 'immutable-stress';
        result = processors.immutableProcessor(massiveDataSet);
        break;
      case '/validation':
        operation = 'validation-stress';
        result = processors.validationProcessor(massiveDataSet).slice(0, 10);
        break;
      default:
        result = {
          message: 'Cloudflare Workers vCPU Stress Test',
          autoConfig: AUTO_CONFIG,
          dataSize: {
            users: massiveDataSet.users.length,
            products: massiveDataSet.products.length
          },
          endpoints: ['/stress', '/lodash', '/math', '/ramda', '/immutable', '/validation'],
          instructions: 'Use /stress for full CPU load test'
        };
    }

    const processingTime = performance.now() - start;

    return new Response(JSON.stringify({
      operation,
      processingTime: `${processingTime.toFixed(2)}ms`,
      timestamp: moment().toISOString(),
      result: operation === 'full-stress-test' ? 
        { ...result, note: 'Results truncated for response size' } : 
        result,
      performance: {
        fast: processingTime < 100,
        acceptable: processingTime < 500,
        slow: processingTime >= 500,
        veryHeavy: processingTime >= 1000
      }
    }, null, 2), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Processing-Time': `${processingTime.toFixed(2)}ms`,
        'X-vCPU-Test': 'stress-test-active'
      }
    });
  }
};
