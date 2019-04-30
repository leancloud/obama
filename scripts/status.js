// Description:
//   LeanCloud status page update bot
//
// Commands:
//   status <new|amend> [color] content

const leancloudStatus = require('../lib/leancloud-status');

module.exports = function(hubot) {
  const helpMessage = `status <new|amend> [color] content\nColors: ${Object.keys(leancloudStatus.colorMapping).join(', ')}\nMore: https://github.com/leancloud/paas/wiki/Status-Page`;

  hubot.respond(/status(.*)/, function(res) {
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
