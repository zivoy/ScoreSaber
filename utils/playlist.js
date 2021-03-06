const fs = require('fs');

class Playlist {
	constructor(options = {}) {
		this.title = options.title || 'Custom playlist';
		this.author = options.authpr || 'ScoreSaber';
		this.image = options.image || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
		this.songs = options.songs || [];
		this.sync = options.sync || '';
	}

	setImage(image) {
		this.image = image;
	}
	async setImageFromFile(filename) {
		let image = await fs.promises.readFile(filename, { encoding: 'base64' });
		this.setImage('data:image/png;base64,' + image);
	}

	async setSongs(list, count) {
		list = list.filter((song, i, self) => self.findIndex(t => t.id === song.id) === i);
		if (count) {
			list = list.slice(0, count);
		}
		this.songs = list.map(e => ({ hash: e.id, songName: e.name }));
	}
	async setSongsFromHashes(list) {
		list = list.filter((song, i, self) => self.indexOf(song) === i);
		this.songs = list.map(e => ({ hash: e }));
	}

	toJSON() {
		return {
			playlistTitle: this.title,
			playlistAuthor: this.author,
			syncURL: this.sync,
			image: this.image,
			songs: this.songs
		};
	}
}

module.exports = Playlist;
