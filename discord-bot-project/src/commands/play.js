const { Client, VoiceChannel } = require('discord.js');
const ytdl = require('ytdl-core');
const queue = require('../utils/queue');

module.exports = {
  name: 'play',
  description: 'Play a song in a voice channel',
  async execute(message, args) {
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

    if (!queue.getQueue(message.guild.id)) {
      const queueConstructor = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
      };

      queue.setQueue(message.guild.id, queueConstructor);
      queue.getQueue(message.guild.id).songs.push(song);

      try {
        const connection = await voiceChannel.join();
        queue.getQueue(message.guild.id).connection = connection;
        this.play(message.guild, queue.getQueue(message.guild.id).songs[0]);
      } catch (error) {
        console.error(`Error joining voice channel: ${error}`);
        queue.deleteQueue(message.guild.id);
        return message.channel.send(`Error joining voice channel: ${error}`);
      }
    } else {
      queue.getQueue(message.guild.id).songs.push(song);
      return message.channel.send(`${song.title} has been added to the queue!`);
    }
  },

  play(guild, song) {
    const queue = queue.getQueue(guild.id);

    if (!song) {
      queue.voiceChannel.leave();
      queue.deleteQueue(guild.id);
      return;
    }

    const dispatcher = queue.connection.play(ytdl(song.url, { filter: 'audioonly' }))
      .on('finish', () => {
        queue.songs.shift();
        this.play(guild, queue.songs[0]);
      })
      .on('error', error => {
        console.error(`Error playing song: ${error}`);
        queue.songs.shift();
        this.play(guild, queue.songs[0]);
      });

    dispatcher.setVolumeLogarithmic(queue.volume / 5);
    queue.textChannel.send(`Now playing: ${song.title}`);
  },
};