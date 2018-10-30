var lastRoom;

module.exports = function(hubot) {
  hubot.hear(/.*/, res => {
    if (res.message.room.includes('topic:(无主题)') || res.message.room.includes('topic:(no+topic)')) {
      if (lastRoom === res.message.room) {
        res.send(`💬 虽然这个话题可能不是你发起的，但你依然可以在回复一条消息后，对消息进行编辑，修改一个合适的主题后，选择「修改前后消息到该话题」并保存。`)
      } else {
        res.send(`💬 亲爱的 ${res.message.user.name}，请在百忙之中为你的消息挑选一个合适的主题，这样将有助于其他人基于主题来开启免打扰，减少需要阅读的消息数量，提升团队工作效率。`);
      }

      lastRoom = res.message.room;
    }
  });
}
