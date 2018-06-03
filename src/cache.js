const poems = {};
const common = {};
const sessions = {};

module.exports = { get, put, getPoem, putPoem, getSession, putSession };


function get(id) {
	return common[id];
}

function put(id, payload) {
	common[id] = payload;
}

function getPoem(id) {
	return poems[id];
}

function putPoem(id, poem) {
	// split text to 1024-char long blocks
	const { title, author, text } = poem;
	const lines = text.split('\n');

	let blocks = [];
	let curBlock = `${author}. ${title}.\n`;
	for (let line of lines) {
		if (curBlock.length + line.length + 1>= 1024) {
			blocks.push(curBlock);
			curBlock = '';
		}

		curBlock += line + '\n';
	}
	blocks.push(curBlock);

	poems[id] = {
		...poem,
		id,
		blocks
	};

	return poems[id];
}

function getSession(id) {
	return sessions[id];
}
function putSession(id, session) {
	sessions[id] = session;
}