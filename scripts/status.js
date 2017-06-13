// Description:
//   LeanCloud status page update bot
//
// Commands:
//   status <new|amend> [color] content
//
//   Available colors: success, warning, error, timeout, red, yellow, green, gray, black, update, investigating, identified, monitoring, resolved, mildlyfuck, fuck, unfuck, minor-outage, major-outage

const leancloudStatus = require('../lib/leancloud-status');

module.exports = function(hubot) {
  const helpMessage = `status <new|amend> [color] content\nAvailable colors: ${Object.keys(leancloudStatus.colorMapping).join(', ')}`;

  hubot.hear(/status(.*)/, function(res) {
    const result = (res.match[1] || '').trim().match(/(\S*)\s*(.*)/);

    if (!result) {
      return res.send(helpMessage);
    }

    const [__, command] = result;

    if (command === 'new') {
      const result = (res.match[1] || '').trim().match(/new\s+(\S+)?\s*(.*)/);
      const color = result[2] ? result[1] : 'gray';
      const content = result[2] ? result[2] : result[1];

      if (color && content) {
        return leancloudStatus.create(color, content).then( () => {
          return res.send('ok');
        });
      } else {
        return res.send(helpMessage);
      }
    } else if (command === 'amend') {
      const result = (res.match[1] || '').trim().match(/amend\s+(\S+)?\s*(.*)/);
      const color = result[2] ? result[1] : null;
      const content = result[2] ? result[2] : result[1];

      if (content) {
        return leancloudStatus.updateLastMessage(color, content).then( () => {
          return res.send('ok');
        });
      } else {
        return res.send(helpMessage);
      }
    } else {
      res.send(helpMessage);
    }
  });
}
