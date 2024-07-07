const ytdl = require('ytdl-core');
const queue = require('../utils/queue');

module.exports = {
  async playMusic(message, args) {
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      return message.channel.send('You need to be in a voice channel to play music!');
    }

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return message.channel.send('I need the permissions to join and speak in your voice channel!');
    }

    const songInfo = await ytdl.getInfo(args[0]);
    const song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    };

    const serverQueue = queue.getQueue(message.guild.id);

    if (!serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
      };

      queue.setQueue(message.guild.id, queueContruct);

      queueContruct.songs.push(song);

      try {
        const connection = await voiceChannel.join();
        queueContruct.connection = connection;
        this.play(message.guild, queueContruct.songs[0]);
      } catch (err) {
        console.error(err);
        queue.deleteQueue(message.guild.id);
        return message.channel.send(err);
      }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`${song.title} has been added to the queue!`);
    }
  },

  play(guild, song) {
    const serverQueue = queue.getQueue(guild.id);

    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.deleteQueue(guild.id);
      return;
    }

    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on('finish', () => {
        serverQueue.songs.shift();
        this.play(guild, serverQueue.songs[0]);
      })
      .on('error', error => console.error(error));
    
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Now playing: **${song.title}**`);
  },

  skipSong(message) {
    const serverQueue = queue.getQueue(message.guild.id);

    if (!message.member.voice.channel) {
      return message.channel.send('You need to be in a voice channel to skip the music!');
    }
    if (!serverQueue) {
      return message.channel.send('There is no song that I could skip!');
    }

    serverQueue.connection.dispatcher.end();
  },

  pauseSong(message) {
    const serverQueue = queue.getQueue(message.guild.id);

    if (!message.member.voice.channel) {
      return message.channel.send('You need to be in a voice channel to pause the music!');
    }
    if (serverQueue && serverQueue.playing) {
      serverQueue.playing = false;
      serverQueue.connection.dispatcher.pause();
      return message.channel.send('Music paused!');
    }
  },

  resumeSong(message) {
    const serverQueue = queue.getQueue(message.guild.id);

    if (!message.member.voice.channel) {
      return message.channel.send('You need to be in a voice channel to resume the music!');
    }
    if (serverQueue && !serverQueue.playing) {
      serverQueue.playing = true;
      serverQueue.connection.dispatcher.resume();
      return message.channel.send('Music resumed!');
    }
  },

  setVolume(message, args) {
    const serverQueue = queue.getQueue(message.guild.id);

    if (!message.member.voice.channel) {
      return message.channel.send('You need to be in a voice channel to set the volume!');
    }
    if (serverQueue) {
      serverQueue.volume = args[0];
      serverQueue.connection.dispatcher.setVolumeLogarithmic(args[0] / 5);
      return message.channel.send(`Volume set to ${args[0]}`);
    }
  },
};