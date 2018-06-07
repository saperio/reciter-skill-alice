const { json } = require('micro');
const providerManager = require('./providers/manager');
const { getSession, putSession, getPoem } = require('./cache');

// init providers this is async, but run only on service start, so we can
// skip returned promise
providerManager.init();


module.exports = async req => {
	const { request, session, version } = await json(req);
	const response = await think(request, session);

	return { version, session, response };
};

function checkCommand(command, list) {
	return list.some(word => command.indexOf(word) !== -1);
}

async function think(request, session) {
	if (session.new) {
		return sayHello();
	}

	const command = request.command.toLowerCase();

	const continueComands = [
		'да',
		'дальше',
		'далее',
		'давай',
		'еще',
		'ещё',
		'продолжай',
		'начинаем',
		'поехали',
		'конечно'
	];
	if (checkCommand(command, continueComands)) {
		return await sayContinue(session);
	}

	const changeComands = [
		'другое',
		'новое',
		'новая',
		'другой',
		'новый',
		'иной',
		'иное'
	];
	if (checkCommand(command, changeComands)) {
		return await sayChange(session);
	}

	const endComands = [
		'хватит',
		'остановись',
		'достаточно'
	];
	if (checkCommand(command, endComands)) {
		return sayBye();
	}

	// save unknown command
	console.log(`Unknown command: ${request.original_utterance}`);

	return sayUnknown();
}

function sayHello() {
	return {
		text: 'Привет! Я выбираю случайно и читаю классические стихотворения. Ты всегда можешь сказать «дальше», чтобы продолжить или «другое», чтобы начать новое стихотворение. Начинаем?',
		end_session: false
	};
}

async function sayContinue(session) {
	const { session_id } = session;

	const sessionData = getSession(session_id);
	if (sessionData) {
		const { poemId } = sessionData;
		const blockIdx = sessionData.blockIdx + 1;
		const poem = getPoem(poemId);
		if (poem && blockIdx < poem.blocks.length) {
			putSession(
				session_id,
				{
					...sessionData,
					blockIdx
				}
			);

			return {
				text: poem.blocks[blockIdx],
				end_session: false
			};
		}
	}

	return await sayChange(session);
}

async function sayChange(session) {
	const { session_id } = session;
	const { id, blocks } = await providerManager.fetchRandomPoem();

	putSession(
		session_id,
		{
			poemId: id,
			blockIdx: 0
		}
	);

	return {
		text: blocks[0],
		end_session: false
	};
}

function sayBye() {
	return {
		text: 'Надеюсь тебе понравилось, приходи ещё!',
		end_session: true
	};
}

function sayUnknown() {
	return {
		text: 'Прости, я не понимаю. давай новое?',
		end_session: false
	};
}