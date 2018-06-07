const fetch = require('node-fetch');
const htmlParser = require('fast-html-parser');
const cache = require('../cache');


module.exports = { init, fetchRandomPoem };


async function init() {
	const url = 'http://poetory.ru/content/list?sort=rate&page=1';
	const raw = await fetch(url);
	const text = await raw.text();
	const dom = htmlParser.parse(text);

	const items = dom.querySelectorAll('.item-text');

	console.log(items[0]);
}

async function fetchRandomPoem() {
}

init();