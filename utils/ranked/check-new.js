const { promiseSequence, timetag, setLastUpdate, ranked } = require('../../utils');
const beatsaver = require('../beatsaver');
const scoresaber = require('../scoresaber');

// Approximation (shoud rather take a bunch of scores for each song and deduce it from that)
const PP_PER_STAR = 42.114296;

async function addNew(songsRaw) {
	const existing = (await ranked.find({ uid: { $in: songsRaw.map(e => e.uid) } })).map(e => e.uid);
	let newRanked = songsRaw.filter(e => !existing.includes(e.uid));
	if (!newRanked.length) {
		return 0;
	}
	let songs = newRanked.map(song => {
		// Only Standard for now
		let diffMatch = song.diff.match(/^_(Easy|Normal|Hard|Expert|ExpertPlus)_SoloStandard$/);
		if (!diffMatch || !song.stars) {
			return;
		}
		let scores = song.scores;
		if (typeof scores === 'string') {
			scores = +scores.replace(/,/g, '') || scores;
		}
		return {
			uid: song.uid,
			id: song.id,
			name: song.name,
			artist: song.songAuthorName,
			mapper: song.levelAuthorName,
			bpm: song.bpm,
			diff: diffMatch[1],
			scores: scores,
			recentScores: song['24hr'],
			stars: song.stars,
			pp: song.stars * PP_PER_STAR
		};
	}).filter(e => e);
	await promiseSequence(songs, beatsaver.addData);
	if (songs.length) {
		await ranked.insert(songs);
		await setLastUpdate();
		let desc = songs.map(song => '  + ' + [song.mapper, song.name, song.diff].join(' - ') + ' (' + song.uid + ')');
		console.log(timetag(), songs.length + ' new ranked map' + (songs.length > 1 ? 's' : '') + ':\n' + desc.join('\n'));
	}
	return songs.length;
}

async function checkFromPage(page, log) {
	if (log === true) {
		console.log(timetag(), 'Checking new ranks page ' + page);
	}
	let data;
	try {
		data = await scoresaber.recentRanks(page, ~~(Date.now() / 3600000));
	} catch(e) {}
	if (!data || !data.songs || !data.songs.length) {
		return;
	}
	if (await addNew(data.songs)) {
		return checkFromPage(page + 1, log);
	}
}

async function checkFull(page, log) {
	if (log === true) {
		console.log(timetag(), 'Checking new ranks (full) page ' + page);
	}
	let data;
	try {
		data = await scoresaber.ranked(page);
	} catch(e) {}
	if (!data || !data.songs || !data.songs.length) {
		return;
	}
	await addNew(data.songs);
	return checkFull(page + 1, log);
}

if (require.main === module) {
	checkFromPage(1, true);
} else {
	module.exports = async (log) => checkFromPage(1, log);
	module.exports.full = async (log) => checkFull(1, log);
}