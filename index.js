const request = require("request");
const { Client, GatewayIntentBits, IntentsBitField } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent] });

const { MeboApi } = require("./MeboApi")
const config = require('./config.json');

const meboApi = new MeboApi(config.key, config.botid, config.version, config.botname)



client.on('ready', () => {
    console.log(`${client.user.tag}でログインしました。`);
});

client.login(config.discord_token);

client.on('messageCreate', async message => {
    try {
        if (message.author.bot) return;
        message.channel.sendTyping()

        let maxRetries = 5; // 再試行の最大回数
        let meboResult;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            meboResult = await meboApi.chat(message.content);

            if (meboResult.bestResponse.utterance != "") {
                console.dir(meboResult, { depth: null });
                message.reply(meboResult.bestResponse.utterance.replaceAll("<br />", "\n"));
                return; // 成功したので関数を終了
            } else if (attempt < maxRetries && attempt % 2 == 0) {
                message.reply("エラーが発生しました。再試行します。");
            } else if (attempt < maxRetries) {
                message.channel.sendTyping()
            } else {
                message.reply("エラーが発生しました。");
            }
        }

    } catch (error) {
        console.error(error);
    }
});
