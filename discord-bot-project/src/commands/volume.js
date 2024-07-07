const { Command } = require('discord.js');

module.exports = {
  name: 'volume',
  description: 'Adjust the volume of the music playback',
  execute(message, args) {
    const serverQueue = message.client.queue.get(message.guild.id);

    if (!serverQueue) {
      return message.channel.send('There is no song playing currently.');
    }

    if (!args[0]) {
      return message.channel.send(`The current volume is: ${serverQueue.volume}%`);
    }

    const volume = parseInt(args[0]);

    if (isNaN(volume) || volume < 0 || volume > 100) {
      return message.channel.send('Please enter a valid volume level between 0 and 100.');
    }

    serverQueue.volume = volume;
    serverQueue.connection.dispatcher.setVolumeLogarithmic(volume / 100);

    return message.channel.send(`Volume set to: ${volume}%`);
  }
};