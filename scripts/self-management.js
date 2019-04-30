// Description:
//   Obama self management commands
//
// Commands:
//   uptime
//   reboot

const ms = require('ms')

module.exports = function(hubot) {
  hubot.respond(/uptime/, res => {
    res.send(ms(process.uptime() * 1000, {long: true}))
  })

  hubot.respond(/reboot/, res => {
    res.send('reboot after 1s')

    setTimeout( () => {
      process.exit()
    }, 1000)
  })
}
