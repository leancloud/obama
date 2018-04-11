// Description:
//   Decide who have lunch
//
// Commands:
//  (午.*几个)|(几个.*午)

const _ = require('lodash');
const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
const ConsistentHashing = require('consistent-hashing');

const AV = require('../lib/leanstorage');

class LunchCount extends AV.Object {}

AV.Object.register(LunchCount);

const days = ['周一', '周二', '周三', '周四', '周五'];

module.exports = function(hubot) {
  hubot.hear(/吃饭/, res => {
    return new AV.Query(LunchCount).find().then( lunchCountObjects => {
      const members = lunchCountObjects.map( lunchCountObject => {
        return lunchCountObject.get('name');
      });

      return getThisWeekRandomSalt().then( salt => {
        const hashing = new ConsistentHashing(days);

        hashing.crypto = function(str) {
          return crypto.createHash(this.algorithm).update(str + salt).digest('hex');
        };

        const results = {};

        members.forEach( member => {
          const lunchDay = hashing.getNode(member);

          if (results[lunchDay]) {
            results[lunchDay].push(member);
          } else {
            results[lunchDay] = [];
            results[lunchDay].push(member);
          }
        });

        res.send(days.map( day => {
          return `${day}：${results[day].join('、')}`;
        }).join('\n'));
      });
    }).catch( err => {
      console.log(err.message);
      res.send(err.message);
    });
  });
}

function getThisWeekRandomSalt() {
  const beginOfWeek = moment().startOf('week');

  return axios.get(`https://blockchain.info/blocks/${beginOfWeek.valueOf()}?format=json`).then( ({data: {blocks}}) => {
    return blocks[blocks.length - 1].hash;
  });
}
