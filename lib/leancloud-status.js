const AWS = require('aws-sdk');
const Promise = require('bluebird');
const axios = require('axios');

const s3Client = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'cn-north-1'
});

const colorMapping = exports.colorMapping = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  timeout: 'timeout',

  red: 'error',
  yellow: 'warning',
  green: 'success',
  gray: 'timeout',
  black: 'timeout',

  update: 'timeout',
  investigating: 'warning',
  identified: 'warning',
  monitoring: 'timeout',
  resolved: 'success',

  mildlyfuck: 'warning',
  fuck: 'error',
  unfuck: 'success',

  'minor-outage': 'warning',
  'major-outage': 'error'
};

exports.create = function(color, content) {
  const type = colorMapping[color] ? colorMapping[color] : color;

  return downloadAndModifidy( data => {
    data.events.unshift({
      type: type,
      content: content,
      inProgress: type === 'error' || type === 'warning' ? true : false,
      time: new Date
    });

    return data;
  });
};

exports.updateLastMessage = function(color, content) {
  const type = colorMapping[color] ? colorMapping[color] : color;

  return downloadAndModifidy( data => {
    data.events[0].type = type || data.events[0].type;
    data.events[0].content = content;
    data.events[0].inProgress = type === 'error' || type === 'warning' ? true : false;

    return data;
  });
};

function downloadAndModifidy(modifier) {
  return axios.get('https://s3.cn-north-1.amazonaws.com.cn/leancloud-status/events.json').then( ({data}) => {
    return modifier(data);
  }).then( data => {
    if (data) {
      return Promise.fromCallback( callback => {
        s3Client.putObject({
          Bucket: 'leancloud-status',
          Key: 'events.json',
          Body: JSON.stringify(data),
          ACL: 'public-read',
          ContentType: 'application/json'
        }, callback);
      });
    }
  });
}
