const { queue } = require('../utils/queue');

module.exports = {
  name: 'pause',
  description: 'Pause the current song',

  execute(message) {
    const serverQueue = queue.get(message.guild.id);

    if (!message.member.voice.channel) {
      return message.channel.send('You need to be in a voice channel to pause music!');
    }

    if (!serverQueue) {
      return message.channel.send('There is no song currently playing to pause!');
    }

    if (serverQueue.playing) {
      serverQueue.playing = false;
      serverQueue.connection.dispatcher.pause();
      message.channel.send('Music paused');
    } else {
      message.channel.send('The music is already paused');
    }
  },
};