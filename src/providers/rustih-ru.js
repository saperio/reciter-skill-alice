const fetch = require('node-fetch');
const htmlParser = require('fast-html-parser');
const cache = require('../cache');

const bestListId = 'bestListRustihi';

module.exports = { init, fetchRandomPoem };


async function init() {
	const url = 'https://rustih.ru/luchshie-stixi-i-poety';
	const raw = await fetch(url);
	const text = await raw.text();
	const dom = htmlParser.parse(text);

	const body = dom.querySelector('.post-body');
	if (!body || !body.childNodes || !body.childNodes.length) {
		throw 'Can\'t parse best list';
	}

	let listRoot;
	for (let node of body.childNodes) {
		if (node.tagName === 'ol') {
			listRoot = node;
			break;
		}
	}

	if (!listRoot || !listRoot.childNodes || !listRoot.childNodes.length) {
		throw 'Can\'t find best list';
	}

	const list = listRoot.childNodes
		.filter(node => node.firstChild && node.firstChild.tagName === 'a')
		.map(node => node.firstChild.attributes.href)
	;
	cache.put(bestListId, list);
}

async function fetchRandomPoem() {
	const list = cache.get(bestListId);
	const url = list[(Math.random() * list.length) | 0];
	const poem = await fetchPoem(url);

	return poem;
}

async function fetchPoem(url) {
	const poem = cache.getPoem(url);
	if (poem) {
		return poem;
	}

	const raw = await fetch(url);
	const text = await raw.text();
	const dom = htmlParser.parse(text);

	return cache.putPoem(url, parse(dom));
}

function parse(dom) {
	const text = parseText(dom);
	const { author, title } = parseHead(dom);

	return { author, title, text };
}

function parseHead(dom) {
	const headRoot = dom.querySelector('.breadcrumbs');
	if (!headRoot || !headRoot.lastChild) {
		return { author: '', title: '' };
	}

	const { text } = headRoot.lastChild;
	if (!text) {
		return { author: '', title: '' };
	}

	let [author, title] = text.split('—');
	author = author ? author.trim() : '';
	title = title ? title.trim() : '';

	return { author, title };
}

function parseText(dom) {
	const textRoot = dom.querySelector('.poem-text')
	if (!textRoot || !textRoot.childNodes || !textRoot.childNodes.length) {
		throw 'Can\'t find poem text';
	}

	let text = '';
	for (let node of textRoot.childNodes) {
		const { tagName, rawText } = node;

		// stop scan on style node
		if (tagName === 'style') {
			break;
		}

		// skip unknown tags
		if (tagName && tagName !== 'p') {
			continue;
		}

		// remove junk
		if (rawText.indexOf('Оригинальное название стихотворения') !== -1) {
			continue;
		}

		// simple nodes with endline usualy
		if (!tagName && rawText) {
			text += rawText;
			continue;
		}

		text += node.text;
	}

	return text.trim();
}