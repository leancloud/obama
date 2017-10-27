// Description:
//   Decide who have lunch
//
// Commands:
//  (午.*几个)|(几个.*午)

const _ = require('lodash');
const axios = require('axios');
const moment = require('moment');
const Promise = require('bluebird');

const AV = require('../lib/leanstorage');

class LunchCount extends AV.Object {}

AV.Object.register(LunchCount);

const 班子成员 = 4;

module.exports = function(hubot) {
  hubot.hear(/(午.*几个)|(几个.*午)/, res => {
    return new AV.Query(LunchCount).find().then( lunchCountObjects => {
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

      let 钦点名单 = [];
      let 参选名单 = [];

      const minCount = _.min(_.map(lunchCounts, 'count'));
      const peopleMinCount = _.filter(lunchCounts, {count: minCount});

      if (peopleMinCount.length >= 班子成员) {
        参选名单 = peopleMinCount;
      } else {
        钦点名单 = peopleMinCount;
        参选名单 = _.difference(lunchCounts, peopleMinCount);
      }

      return Promise.try( () => {
        if (参选名单.length) {
          return getHashFactors().then( hashFactors => {
            const 选举结果 = _.uniq(hashFactors.map( hashFactor => {
              return 参选名单[hashFactor % 参选名单.length];
            })).slice(0, 班子成员 - 钦点名单.length);

            return 钦点名单.concat(选举结果);
          });
        } else if (钦点名单.length > 班子成员) {
          return getHashFactors().then( hashFactors => {
            return _.uniq(hashFactors.map( hashFactor => {
              return 钦点名单[hashFactor % 钦点名单.length];
            })).slice(0, 班子成员);
          });
        } else {
          return 钦点名单;
        }
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

function getHashFactors() {
  return axios.get(`https://blockchain.info/blocks/${Date.now()}?format=json`).then( ({data: {blocks}}) => {
    const firstBlockHash = blocks[blocks.length - 1].hash;

    const hashs = hashOffsets().map( offset => {
      return firstBlockHash.slice(offset, offset + 8);
    });

    return hashs.map( hash => {
      return parseInt(hash, 16);
    });
  });
}

function hashOffsets(length = 8) {
  let offsets = [];
  for (let i = 64 - length; i >= 0; i -= length) {
    offsets.push(i);
  }
  return offsets;
}
