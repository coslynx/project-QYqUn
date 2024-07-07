const { playSong } = require('../../services/youtube');
const { addToQueue } = require('../../utils/queue');

module.exports = {
  name: 'search',
  description: 'Search and play a song from YouTube',
  async execute(message, args) {
    const query = args.join(' ');

    if (!query) {
      return message.reply('Please provide a search query for the song.');
    }

    try {
      const song = await playSong(query);

      if (!song) {
        return message.reply('No results found for the search query.');
      }

      addToQueue(message, song);
    } catch (error) {
      console.error('Error searching and playing song:', error);
      message.reply('An error occurred while searching and playing the song.');
    }
  },
};