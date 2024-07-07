const { queue } = require('../utils/queue');

module.exports = {
    name: 'skip',
    description: 'Skip the currently playing song',
    execute(message, args) {
        const serverQueue = queue.get(message.guild.id);

        if (!message.member.voice.channel) {
            return message.channel.send('You need to be in a voice channel to skip the song');
        }
        if (!serverQueue) {
            return message.channel.send('There is no song that I could skip');
        }

        serverQueue.connection.dispatcher.end();
    },
};