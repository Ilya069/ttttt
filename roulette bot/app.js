const mongo = require("mongoose");
mongo.connect("mlab.com - создайте БД тут");

const User = mongo.model("User", {
	id: Number,
	partner: Number
});

const Telegram = require("node-telegram-bot-api");
const bot = new Telegram("1311565912:AAH_sF3wudNfrGJ4I6XLrNu5e_On3lWE7zk", { polling: true });

const keyboards = {
	main: [
		["🔎 Поиск"],
		["📊 Статистика", "📃 Правила"]
	],
	main_search: [
		["🚫 Остановить поиск"],
		["📊 Статистика", "📃 Правила"]
	],
	main_in_dialog: [
		["🚫 Остановить диалог"],
		["📊 Статистика", "📃 Правила"]
	]
}

let queue = [];

bot.on("message", async (message) => {
	message.send = (text, params) => bot.sendMessage(message.chat.id, text, params);

	let $user = await User.findOne({ id: message.from.id });
	if( !$user ) {
		let user = new User({
			id: message.from.id,
			partner: 0
		});

		await user.save();
		return message.send(`Меню.`, {
			reply_markup: {
				keyboard: keyboards.main,
				resize_keyboard: true
			}
		});
	}

	message.user = await User.findOne({ id: message.from.id });
	if(message.text.startsWith("/start")) {
		return message.send(`Меню.`, {
			reply_markup: {
				keyboard: message.user.partner ? keyboards.main_in_dialog : queue.indexOf(message.from.id) === -1 ? keyboards.main : keyboards.main_search,
				resize_keyboard: true
			}
		});
	}

	if(message.text === "🔎 Поиск") {
		if(message.user.partner) return message.send(`Вы уже в диалоге!`, {
			reply_markup: {
				keyboard: keyboards.main_in_dialog,
				resize_keyboard: true
			}
		});

		if(queue.indexOf(message.from.id) !== -1) return message.send(`Вы уже в поиске.`, {
			reply_markup: {
				keyboard: keyboards.main_search,
				resize_keyboard: true
			}
		});

		if(queue[0]) {
			queue.push(message.from.id);
			let partner = await User.findOne({ id: queue[0] });

			await partner.set("partner", queue[1]);
			await message.user.set("partner", queue[0]);

			bot.sendMessage(queue[0], "Собеседник найден, общайтесь!", {
				reply_markup: {
					keyboard: keyboards.main_in_dialog,
					resize_keyboard: true
				}
			});

			message.send("Собеседник найден, общайтесь!", {
				reply_markup: {
					keyboard: keyboards.main_in_dialog,
					resize_keyboard: true
				}
			});

			queue = [];
		} else {
			queue.push(message.from.id);
			return message.send(`Вы добавлены в очередь поиска, ожидайте собеседника.`, {
				reply_markup: {
					keyboard: keyboards.main_search,
					resize_keyboard: true
				}
			});
		}
	}

	if(message.text === "🚫 Остановить поиск") {
		if(queue.indexOf(message.from.id) === -1) return message.send(`Вы не в очереди!`, {
			reply_markup: {
				keyboard: message.user.partner ? keyboards.main_in_dialog : keyboards.main,
				resize_keyboard: true
			}
		});

		queue = [];
		return message.send(`Вы вышли из очереди.`, {
			reply_markup: {
				keyboard: keyboards.main,
				resize_keyboard: true
			}
		});
	}

	if(message.text === "🚫 Остановить диалог") {
		if(!message.user.partner) return message.send(`Вы не в диалоге!`, {
			reply_markup: {
				keyboard: queue.indexOf(message.from.id) !== -1 ? keyboards.main_search : keyboards.main,
				resize_keyboard: true
			}
		});

		let partner = await User.findOne({ partner: message.from.id });
		
		await partner.set("partner", 0);
		await message.user.set("partner", 0);

		bot.sendMessage(partner.id, "Ваш собеседник отключился.", {
			reply_markup: {
				keyboard: keyboards.main,
				resize_keyboard: true
			}
		});

		message.send(`Вы отключились.`, {
			reply_markup: {
				keyboard: keyboards.main,
				resize_keyboard: true
			}
		});
	}

	if(message.text === "📊 Статистика") {
		return message.send(
			`📊 Статистика бота:`
			+ `\n`
			+ `\n`
			+ `Пользователей в боте: ${ await User.countDocuments() }`
		);
	}

	if(message.text === "📃 Правила") {
		return message.send(`Администрация Бота «Chat Roulette Bot» предоставляет всем пользователям мессенджера возможность пообщаться со случайным собеседником.

Администрация не несет ответственности за контент распространяемый пользователями. При выявлении нарушений Администрация имеет право забанить на бессрочный срок любого пользователя, нарушающего данные правила. Администрация не может гарантировать, что запрещенная информация будет отсутствовать в сообщениях.

Запрещено распространять:
— Порнографический контент.
— Оружие, наркотики, психотропные вещества.
— Сообщения призывающие к суициду.
— Сообщения призывающие к массовым беспорядкам.
— Оскорбительные сообщения.
— Экстремистский контент.
— Любые иные вещи, документы или информацию запрещенную к распространению законодательством.
— Наш telegram канал - @slivmenss`);
	}

	if(message.user.partner) {
		if(message.photo) {
			bot.sendPhoto(message.user.partner, message.photo[message.photo.length - 1].file_id, {
				caption: message.caption ? message.caption : ""
			})
		}

		if(message.audio) {
			bot.sendAudio(message.user.partner, message.audio.file_id, {
				caption: message.caption ? message.caption : ""
			});
		}

		if(message.video) {
			bot.sendVideo(message.user.partner, message.video.file_id, {
				caption: message.caption ? message.caption : ""
			});
		}

		if(message.voice) {
			bot.sendVoice(message.user.partner, message.voice.file_id, {
				caption: message.caption ? message.caption : ""
			});
		}

		if(message.video_note) {
			bot.sendVideoNote(message.user.partner, message.video_note.file_id, {
				caption: message.caption ? message.caption : ""
			});
		}

		if(message.sticker) {
			bot.sendSticker(message.user.partner, message.sticker.file_id, {
				caption: message.caption ? message.caption : ""
			});
		}

		if(message.document) {
			return message.send(`Ошибка! Запрещено отправлять документы.`);
		}

		if(message.text) {
			bot.sendMessage(message.user.partner, message.text);
		}
	}
});

User.prototype.inc = function(field, value = 1) {
	this[field] += value;
	return this.save();
}

User.prototype.dec = function(field, value = 1) {
	this[field] -= value;
	return this.save();
}

User.prototype.set = function(field, value) {
	this[field] = value;
	return this.save();
}