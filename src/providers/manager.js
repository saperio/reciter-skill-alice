const providerRustihi = require('./rustih-ru');

module.exports = { init, fetchRandomPoem };

async function init() {
	await providerRustihi.init();
}

async function fetchRandomPoem() {
	const poem = await providerRustihi.fetchRandomPoem();

	return poem;
}