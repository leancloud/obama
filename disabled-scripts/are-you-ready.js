const _ = require('lodash');
const moment = require('moment');

let waitingFor = [];
let date = moment().format('YYYY-MM-DD');

module.exports = function(hubot) {
  hubot.router.get('/are-you-ready', (req, res) => {
    let text;

    if (waitingFor.length) {
      text = waitingFor.join('、');
    } else {
      text = 'Go!';
    }

    res.header('Content-Type', 'text/html; charset=utf-8');
    res.header('Refresh', '10');
    res.end(`<center style='font-size: 4em; color: red; font-weight: bold;'>${text}<center>`);
  });

  hubot.hear(/在等(.*)/, res => {
    checkDate();

    let usernames = extractUsernames(res.match[1]);
    waitingFor = _.union(waitingFor, usernames);

    res.send(printWaitingFor());
  });

  hubot.hear(/在等谁/, res => {
    checkDate();
    res.send(printWaitingFor());
  });

  hubot.hear(/(.*)好了/, res => {
    checkDate();

    let usernames = extractUsernames(res.match[1]);

    if (res.match[0].indexOf('我') !== -1) {
      usernames.push(getUsername(res));
    }

    waitingFor = _.difference(waitingFor, usernames);

    res.send(printWaitingFor());
  });
};

function printWaitingFor() {
  if (waitingFor.length) {
    return `现在在等 ${waitingFor.join('、')}`
  } else {
    return `看来大家都已经准备好了`;
  }
}

function checkDate() {
  if (date !== moment().format('YYYY-MM-DD')) {
    waitingFor = [];
    date = moment().format('YYYY-MM-DD');
  }
}

function getUsername(res) {
  return res.message.user.name || res.message.user;
}

function extractUsernames(string) {
  if (string.indexOf('@') !== -1) {
    return string.match(/@(\S+\b)/g).map( username => {
      return username.replace('@', '');
    });
  } else {
    return [];
  }
}
