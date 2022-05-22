import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { ChannelType, Routes } from 'discord-api-types/v9';
import * as ffn from 'firebase-functions';
import { logger } from '../utils/utils';

// GLOBAL CONSTs
export const BOT_TOKEN = ffn.config().discord.bottoken;
export const CLIENT_ID = ffn.config().discord.appid;
export const GUILD_ID = ffn.config().discord.guildid;
export const UID = ffn.config().discord.uid;
// END GLOBAL CONSTs

const commands = [
	new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Verifica la connessione'),
	new SlashCommandBuilder()
		.setName('forward')
		.setDescription('Scegli le opzioni di inoltro.')
		.addChannelOption((option) =>
			option
				.setName('from-channel')
				.setDescription('The channel from where i\'ll forward messages.')
				.addChannelTypes([ChannelType.GuildText, ChannelType.GuildNews])
				.setRequired(true)
		)
		.addChannelOption((option) =>
			option
				.setName('to-channel')
				.setDescription(
					'The channel to where I\'ll send messages of "from-channel".'
				)
				.addChannelTypes([ChannelType.GuildText, ChannelType.GuildNews])
				.setRequired(true)
		)
		.addRoleOption((option) =>
			option
				.setName('role')
				.setDescription('Seleziona un ruolo da menzionare')
				.setRequired(false)
		),
	new SlashCommandBuilder()
		.setName('log-channel')
		.setDescription('Scegli il canale dei Log.')
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('Scegli il canale dei Log.')
				.addChannelTypes([ChannelType.GuildText, ChannelType.GuildNews])
				.setRequired(true)
		),
	new SlashCommandBuilder()
		.setName('forwards-list')
		.setDescription('Ricevi la lista degli inoltri che hai salvato.'),
].map((command) => command.toJSON());

const rest = new REST({ version: '9' }).setToken(BOT_TOKEN);

export const configCommands = (): void => {
	rest
		.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
			body: commands,
		})
		.catch(logger.error);
};
