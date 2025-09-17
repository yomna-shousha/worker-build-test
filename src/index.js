// Import ALL the heavy libraries to maximize bundle size
import _ from 'lodash';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays, subDays, differenceInDays } from 'date-fns';
import * as R from 'ramda';
import { fromEvent, interval, map, filter, take } from 'rxjs';
import { List, Map, Set } from 'immutable';
import classNames from 'classnames';
import validator from 'validator';

// Create massive data structures
const massiveDataSet = {
  users: _.range(2000).map(i => ({
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
  
  products: _.range(1000).map(i => ({
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
    })),
    reviews: _.times(25, r => ({
      id: uuidv4(),
      rating: Math.floor(Math.random() * 5) + 1,
      comment: _.times(30, () => `review${Math.floor(Math.random() * 1000)}`).join(' '),
      date: moment().subtract(r, 'days').toISOString()
    }))
  }))
};

// Complex processing functions using all libraries
const processors = {
  lodashProcessor: (data) => {
    return _.chain(data.users)
      .groupBy(user => moment(user.created).format('YYYY-MM'))
      .mapValues(group => ({
        count: group.length,
        avgScore: _.mean(group.flatMap(u => u.scores)),
        topTags: _.take(_.keys(_.countBy(group.flatMap(u => u.tags))), 10),
        processed: _.sortBy(group, 'id').map(u => _.pick(u, ['id', 'name', 'email']))
      }))
      .value();
  },

  ramdaProcessor: (data) => {
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
        avgScore: R.pipe(R.pluck('avgScore'), R.mean)(group)
      }))
    )(data);
  },

  immutableProcessor: (data) => {
    const immutableData = Map(data);
    const usersList = List(immutableData.get('users', []));
    
    return usersList
      .groupBy(user => moment(user.get ? user.get('created') : user.created).format('YYYY'))
      .map(group => Map({
        count: group.size,
        users: group.map(user => user.get ? user.get('name') : user.name).toArray(),
        avgScore: group.reduce((sum, user) => {
          const scores = user.get ? user.get('scores') : user.scores;
          return sum + (Array.isArray(scores) ? _.mean(scores) : 0);
        }, 0) / group.size
      }))
      .toJS();
  },

  dateProcessor: (startDate, endDate) => {
    const start = moment(startDate);
    const end = moment(endDate);
    const days = differenceInDays(new Date(endDate), new Date(startDate));
    
    return _.times(days, i => {
      const currentDate = addDays(new Date(startDate), i);
      return {
        date: format(currentDate, 'yyyy-MM-dd'),
        moment: start.clone().add(i, 'days').format('YYYY-MM-DD HH:mm:ss'),
        dateFns: format(currentDate, 'PPP'),
        uuid: uuidv4(),
        dayOfWeek: format(currentDate, 'EEEE'),
        isWeekend: [0, 6].includes(currentDate.getDay())
      };
    });
  },

  validationProcessor: (data) => {
    return data.users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isValidEmail: validator.isEmail(user.email),
      isValidUUID: validator.isUUID(user.uuid),
      nameLength: validator.isLength(user.name, { min: 1, max: 100 }),
      classes: classNames({
        'valid-user': validator.isEmail(user.email),
        'invalid-user': !validator.isEmail(user.email),
        'premium-user': _.mean(user.scores) > 75,
        'active-user': moment(user.created).isAfter(moment().subtract(30, 'days'))
      })
    }));
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const start = performance.now();

    let result;
    
    switch (url.pathname) {
      case '/lodash':
        result = processors.lodashProcessor(massiveDataSet);
        break;
      case '/ramda':
        result = processors.ramdaProcessor(massiveDataSet);
        break;
      case '/immutable':
        result = processors.immutableProcessor(massiveDataSet);
        break;
      case '/dates':
        result = processors.dateProcessor('2024-01-01', '2024-12-31');
        break;
      case '/validation':
        result = processors.validationProcessor(massiveDataSet);
        break;
      default:
        result = {
          message: 'Heavy Build Performance Test Worker',
          endpoints: ['/lodash', '/ramda', '/immutable', '/dates', '/validation'],
          dataSize: {
            users: massiveDataSet.users.length,
            products: massiveDataSet.products.length,
            totalMemory: 'very large'
          },
          libraries: ['lodash', 'moment', 'ramda', 'rxjs', 'immutable', 'date-fns', 'uuid', 'validator']
        };
    }

    return new Response(JSON.stringify({
      data: Array.isArray(result) ? result.slice(0, 10) : result, // Limit response size
      meta: {
        processingTime: `${(performance.now() - start).toFixed(2)}ms`,
        timestamp: moment().toISOString(),
        worker: 'heavy-build-test'
      }
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
