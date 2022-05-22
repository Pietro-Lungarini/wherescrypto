/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
	ButtonInteraction,
	CacheType,
	Client,
	CommandInteraction,
	GuildMember,
	Intents,
	Message,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
	TextChannel,
} from 'discord.js';
import * as admin from 'firebase-admin';
import { logger } from '../utils/utils';
import { BOT_TOKEN, configCommands } from './config';
import { ForwardChannel } from './models/forwardChannel.model';

// GLOBAL CONSTs;
const discord: Client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_MESSAGE_TYPING,
	],
});
let forwardChannels: Set<ForwardChannel> = new Set();
let logChannelId = '';
let discordStatus: boolean;
// END GLOBAL CONSTs

// DISCORD LOGIN
export const startDiscordBot = async (): Promise<void> => {
	try {
		if (discordStatus) {
			await syncDatabase();
			return log.info('Bot is already connected, synced DB', 'startDiscordBot');
		}

		discord.on('shardDisconnect', (event) => {
			log.error(event, 'onShardDisconnect');
		});
		await discord.login(BOT_TOKEN);
		discord.once('ready', async (client) => {
			discordStatus = true;
			await startBot();

			client.on('messageCreate', async (m) => {
				if (forwardChannels.size < 1) return;
				forwardChannels.forEach(async (channel) => {
					if (m.channelId !== channel.from) return;
					const toChannel = discord.channels.cache.get(
						channel.to,
					) as TextChannel;
					await sendEmbedMsg(toChannel, m, channel);
				});
			});

			log.info('Il bot è stato avviato.');
		});

		discord.on('error', (err) => {
			log.error(err, 'discord');
		});
	} catch (err) {
		log.error(err, 'startDiscordBot');
	}
};
// END DISCORD LOGIN

// DISCORD COMMANDs
const startBot = async (): Promise<void> => {
	configCommands();
	await syncDatabase();

	discord.on('interactionCreate', async (interaction) => {
		if (interaction.isCommand()) {
			const { commandName } = interaction;
			if (!interaction || !commandName) {
				log.error('Undefined interaction or commandName');
				return log.error(interaction);
			}

			await interaction.reply('Un attimo solo...');
			const isAdmin = (interaction.member as GuildMember).permissions.has(
				'ADMINISTRATOR',
			);
			if (!isAdmin) {
				await interaction.editReply(
					'Non hai il permesso di usare questo comando.',
				);
				return;
			}

			try {
				if (commandName === 'ping') {
					await interaction.editReply('Pong!');
					return;
				} else if (commandName === 'forward') {
					await interaction.editReply('Un attimo solo...');
					await forwardCmd(interaction);
					return;
				} else if (commandName === 'log-channel') {
					await interaction.editReply('Un attimo solo...');
					await setLogChannel(interaction);
					return;
				} else if (commandName === 'forwards-list') {
					await interaction.editReply('Un attimo solo...');
					await forwardsList(interaction);
					return;
				}
				return;
			} catch (err) {
				log.error(err, 'startBot');
				interaction.editReply(
					`C'è stato un errore. Controlla il canale <#${logChannelId}>`,
				);
			}
		} else if (interaction.isButton()) {
			await interaction.reply('Un attimo solo...');

			try {
				// Delete Forwards
				if (interaction.id.includes('fwDel-')) {
					await deleteForward(interaction);
				}
			} catch (err) {
				log.error(err, 'startBot');
				interaction.editReply(
					`C'è stato un errore. Controlla il canale <#${logChannelId}>`,
				);
			}
		}

		return;
	});
};
const log = {
	error: (str?: any, at?: string) => {
		if (!str) return;
		if (typeof str !== 'string') {
			str = JSON.stringify(str);
		}
		const msg = `[LOG] @ ${at} => ${str}`;
		if (!logChannelId) {
			logger.error(msg);
		} else {
			discord.channels.fetch(logChannelId).then((res) => {
				if (!res || !res?.isText()) {
					logChannelId = '';
					log.error('logChannelId is undefined', 'log.info()');
					return log.error(str, at);
				}
				const embed = new MessageEmbed({
					title: ':no_entry: Nuovo ERR',
					color: 13840175,
					description: msg,
					timestamp: new Date(),
				});
				res.send({ embeds: [embed] });
			});
		}
	},
	info: (str?: any, at?: string) => {
		if (!str) return;
		if (typeof str !== 'string') {
			str = JSON.stringify(str);
		}
		const msg = `[LOG] ${!at ? '' : '@ ' + at + ' => '}${str}`;
		if (!logChannelId) {
			logger.info(msg);
		} else {
			discord.channels.fetch(logChannelId).then((res) => {
				if (!res || !res?.isText()) {
					logChannelId = '';
					log.error('logChannelId is undefined', 'log.info()');
					return log.info(str, at);
				}
				const embed = new MessageEmbed({
					title: ':information_source: Nuovo LOG',
					color: 1733608,
					description: msg,
					timestamp: new Date(),
				});
				res.send({ embeds: [embed] });
			});
		}
	},
};
// END DISCORD COMMANDs

// COMMANDs FNs
const forwardCmd = async (i: CommandInteraction<CacheType>): Promise<void> => {
	try {
		await i.editReply('Un attimo solo...');
		if (!i.options.data || !i.options.data.length) {
			return log.error('Invalid Options provided', 'forwardCmd');
		}
		const from = i.options.getChannel('from-channel')?.id;
		const to = i.options.getChannel('to-channel')?.id;
		const roleId = i.options.getRole('role')?.id;
		if (!from || !to) {
			return log.error('Invalid Options provided', 'forwardCmd');
		}
		i.deleteReply();
		let header = '';
		let footer = '';
		i.channel?.send('Vuoi impostare un Header? "TESTO"/"NO"');
		const headerMsg = (
			await i.channel?.awaitMessages({
				filter: (m) => m.author.id === i.member?.user.id,
				max: 1,
				time: 30 * 1000,
				errors: ['time'],
			})
		)?.first();
		const headerContent = headerMsg?.content;
		if (!!headerContent && headerContent.toUpperCase() !== 'NO') {
			header = headerContent;
		}
		i.channel?.send('Vuoi impostare un Footer? "TESTO"/"NO"');
		const footerMsg = (
			await i.channel?.awaitMessages({
				filter: (m) => m.author.id === i.member?.user.id,
				max: 1,
				time: 30 * 1000,
				errors: ['time'],
			})
		)?.first();
		const footerContent = footerMsg?.content;
		if (!!footerContent && footerContent.toUpperCase() !== 'NO') {
			footer = footerContent;
		}
		await saveForwardChannel({ from, to, header, footer, roleId });
		i.channel?.send(`Impostato l'inoltro automatico da <#${from}> a <#${to}>`);
		return;
	} catch (err) {
		log.error(err, 'forwardCmd');
	}
};
const sendEmbedMsg = async (
	c: TextChannel,
	msg: Message,
	fwC: ForwardChannel,
): Promise<void> => {
	if (!c || !msg) {
		return log.error('Arguments are undefined', 'sendEmbedMsg');
	}

	const getTitle = () => {
		const aIndex = msg.content.indexOf('title:{');
		const bIndex = msg.content.indexOf('}');
		if (aIndex === -1 || bIndex === -1) return undefined;
		return msg.content
			.slice(aIndex, bIndex)
			.replace('title:{', '')
			.replace('}', '');
	};
	const getContent = () => {
		return msg.content.replace(`title:{${getTitle()}}`, '');
	};
	const getDesc = () => {
		return `${!fwC.roleId ? '' : `<@${fwC.roleId}>\n\n`}${
			!fwC.header ? '' : `${fwC.header}\n\n`
		}${getContent()}\n\n${!fwC.footer ? '' : `${fwC.footer}`}`;
	};

	const embed = new MessageEmbed({
		color: 15320428,
		author: {
			icon_url: msg.author.avatarURL() || undefined,
			name: msg.author.username,
		},
		title: getTitle(),
		description: getDesc(),
		timestamp: new Date(),
	});

	await c.send({ embeds: [embed] });
};
const setLogChannel = async (
	i: CommandInteraction<CacheType>,
): Promise<void> => {
	try {
		await i.editReply('Un attimo solo...');
		if (!i.options.data || !i.options.data.length) {
			return log.error('Invalid Options provided', 'setLogChannel');
		}
		const id = i.options.getChannel('channel')?.id;
		if (!id) {
			return log.error('Invalid Options provided', 'setLogChannel');
		}
		await saveLogsChannel(id);
		await i.editReply(`Impostato il canale log su <#${id}>`);
	} catch (err) {
		log.error(err, 'setLogChannel');
	}
};
const forwardsList = async (
	i: CommandInteraction<CacheType>,
): Promise<void> => {
	try {
		const res = await admin.firestore().doc('discord/utils/forwards').get();
		const list = res.data() as ForwardChannel[];
		if (!list || !list.length) {
			throw new Error('Non c\'è nessun inoltro impostato.');
		}
		let msg = '';
		const rows: MessageActionRow[] = [];
		let btns: MessageButton[] = [];

		list.forEach((fw, i) => {
			if (!fw.from || !fw.to) return;
			msg += `${i + 1} ➡️ <#${fw.from}> - <#${fw.to}>\n`;
			const btn = new MessageButton()
				.setStyle('SECONDARY')
				.setLabel(`${i + 1}`)
				.setCustomId('fwDel-' + fw.roleId);

			btns.push(btn);
			if (btns.length === 5) {
				const row = new MessageActionRow();
				row.addComponents(btns);
				rows.push(row);
				btns = [];
			}
		});

		const row = new MessageActionRow();
		row.addComponents(btns);
		rows.push(row);

		msg +=
			'\n\nPer eliminare uno degli inoltri, clicca sul pulsante relativo al numero dell\'inoltro.';

		const embed = new MessageEmbed({
			title: 'Ecco la lista dei canali di inoltro:',
			description: msg,
			timestamp: new Date(),
		});

		i.deleteReply();
		i.channel?.send({
			embeds: [embed],
			components: rows,
		});
	} catch (err) {
		i.editReply(`C'è stato un errore. Controlla il canale <#${logChannelId}>.`);
		log.error(err, 'forwardsList');
	}
};
const deleteForward = async (
	i: ButtonInteraction<CacheType>,
): Promise<void> => {
	let fw: ForwardChannel | undefined;
	forwardChannels.forEach((f) => {
		if (f.roleId === i.id) fw = f;
	});
	if (!fw) {
		throw new Error(
			`L'inoltro con l'id ${i.id} non esiste. Impossibile eliminare`,
		);
	}
	forwardChannels.delete(fw);
	log.info({ id: fw.roleId, forwardChannels });
	await admin
		.firestore()
		.doc('discord/utils')
		.set({
			logChannel: logChannelId,
			forwards: Array.from(forwardChannels),
		});
	log.info(`Eliminato l'inoltro con l'id: ${fw.roleId}`);
};
// END COMMANDs FNs

// UTILS FNs
const saveForwardChannel = async (fwC: ForwardChannel): Promise<void> => {
	try {
		const roleId = `${fwC.from + fwC.to}`;
		let isUnique = true;
		forwardChannels.forEach((el) => {
			if (!el.roleId) return;
			if (roleId === el.roleId) isUnique = false;
			return;
		});
		if (!isUnique) throw new Error('Esiste già questo inoltro.');
		log.info(`FW ID is ${roleId}`);
		forwardChannels.add({ roleId, ...fwC });
		await admin
			.firestore()
			.doc('discord/utils')
			.set({
				logChannel: logChannelId,
				forwards: Array.from(forwardChannels),
			});
		return;
	} catch (err) {
		log.error(err, 'saveForwardChannel');
		return;
	}
};
const saveLogsChannel = async (id: string): Promise<void> => {
	try {
		logChannelId = id;
		const res = await admin
			.firestore()
			.doc('discord/utils')
			.set({
				logChannel: id,
				forwards: Array.from(forwardChannels),
			});
		log.info(res, 'saveLogsChannel');
		return;
	} catch (err) {
		log.error(err, 'saveForwardChannel');
		return;
	}
};
const syncForwardChannels = async (): Promise<void> => {
	try {
		forwardChannels.clear();
		const res = await admin.firestore().doc('discord/utils').get();
		const forwards = res.data()?.forwards as ForwardChannel[] | undefined;
		if (!forwards || forwards.length <= 0) {
			return log.error('ForwardChannels is undefined', 'syncForwardChannels');
		}
		forwardChannels = new Set(forwards);
	} catch (err) {
		log.error(err, 'syncForwardChannels');
	}
};
const syncLogChannel = async (): Promise<void> => {
	try {
		const res = await admin.firestore().doc('discord/utils').get();
		if (!res.data() || !res.data()?.logChannel) return;
		logChannelId = res.data()?.logChannel;
	} catch (err) {
		log.error(err, 'syncLogChannel');
	}
};
// END UTILS FNs

const syncDatabase = async (): Promise<void> => {
	try {
		await syncForwardChannels();
		await syncLogChannel();
		log.info(`Synced DB on channel: <#${logChannelId}>`, 'syncDatabase');
		return;
	} catch (err) {
		log.error(err, 'syncDatabase');
		return;
	}
};
