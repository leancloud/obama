// Description:
//   Decide who have lunch
//
// Commands:
//  (午.*几个)|(几个.*午)

const _ = require('lodash');
const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
const Promise = require('bluebird');

const AV = require('../lib/leanstorage');

class LunchCount extends AV.Object {}

AV.Object.register(LunchCount);

const 班子成员 = 4;

module.exports = function(hubot) {
  hubot.hear(/(午.*几个)|(几个.*午)|(午.*轮)|(轮.*午)/, res => {
    return AV.Query.or(
      new AV.Query(LunchCount).doesNotExist('excludeAt'),
      new AV.Query(LunchCount).lessThan('excludeAt', moment().startOf('day').toDate())
    ).find().then( lunchCountObjects => {
      const lunchCounts = lunchCountObjects.map( lunchCountObject => {
        let count = lunchCountObject.get('count');

        if (lunchCountObject.get('lunchAt') >= moment().startOf('day').toDate()) {
          count -= 1;
        }

        return {
          name: lunchCountObject.get('name'),
          count: count
        };
      });

      const minCount = _.min(_.map(lunchCounts, 'count'));
      const peopleMinCount = _.filter(lunchCounts, {count: minCount});

      const 参选名单 = peopleMinCount;
      const 候补名单 = _.difference(lunchCounts, peopleMinCount);

      console.log('参选名单', 参选名单);
      console.log('候补名单', 候补名单);

      return getTodayRandomSalt().then( salt => {
        const 总排位 = _.flatten([
          _.sortBy(参选名单, ({name}) => getRank(salt, name) ),
          _.sortBy(候补名单, ({name}) => getRank(salt, name) ),
        ]);

        console.log('总排位', 总排位);

        return 总排位.slice(0, 班子成员);
      }).then( 领导班子名单 => {
        return increaseLunchCount(lunchCountObjects.filter( lunchCountObject => {
          return _.includes(_.map(领导班子名单, 'name'), lunchCountObject.get('name'));
        })).then( () => {
          res.send(_.map(领导班子名单, 'name').join('、'));
        });
      });
    }).catch( err => {
      console.log(err.message);
      res.send(err.message);
    });
  });

  hubot.hear(/(.*)(没来|没有来|不能吃饭)/, res => {
    const usernames = extractUsernames(res.match[1]);

    return Promise.all(usernames.map( username => {
      return new AV.Query(LunchCount).equalTo('username', username).first().then( lunchCountObject => {
        lunchCountObject.increment('count', -1);
        lunchCountObject.set('excludeAt', new Date);
        return lunchCountObject.save(null, {
          query: new AV.Query(LunchCount).greaterThan('lunchAt', moment().startOf('day').toDate())
        });
      });
    })).then( () => {
      res.send('ok');
    }).catch( err => {
      console.log(err.message);
      res.send(err.message);
    });
  });
}

function increaseLunchCount(lunchCountObjects) {
  return Promise.all(lunchCountObjects.map( lunchCountObject => {
    lunchCountObject.increment('count', 1);
    lunchCountObject.set('lunchAt', new Date);
    return lunchCountObject.save(null, {
      query: new AV.Query.or(
        new AV.Query(LunchCount).doesNotExist('lunchAt'),
        new AV.Query(LunchCount).lessThan('lunchAt', moment().startOf('day').toDate())
      )
    }).catch( err => {
      if (err.code !== 305) {
        throw err;
      }
    });
  }));
}

function getTodayRandomSalt() {
  return axios.get(`https://blockchain.info/blocks/${Date.now()}?format=json`).then( ({data: {blocks}}) => {
    const firstBlockHash = blocks[blocks.length - 1].hash;
    const saltBase16 = firstBlockHash.slice(firstBlockHash.length - 8, firstBlockHash.length);
    return parseInt(saltBase16, 16);
  });
}

function getRank(salt, name) {
  const hash = md5(salt + name);
  return parseInt(hash.slice(hash.length - 8, hash.length), 16);
}

function extractUsernames(string) {
  return string.match(/@(\S+\b)/g).map( username => {
    return username.replace('@', '');
  });
}

function md5(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}
