const request = require("request");
const { Client, GatewayIntentBits, IntentsBitField } = require('discord.js');

const axios = require('axios');
const fs = require('fs');


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
        if (message.content === "" && message.attachments.size == 0) return;
        message.channel.sendTyping()

        let base64Image = "";

        if (message.attachments.size > 0) {
            console.log('Image Attached');
            const attachment = message.attachments.first();

            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                try {
                    const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(response.data, 'binary');

                    // Load the image to get its dimensions
                    const dimensions = await getImageDimensions(buffer);

                    if (dimensions.width <= 4032 && dimensions.height <= 4032) {
                        base64Image = buffer.toString('base64');
                        console.log('Base64 Image Created');

                        if (message.content === "") {
                            message.content = "この画像の意味を理解して、その解釈にあった返答をして";
                        }
                    } else {
                        console.log('Image exceeds the size limit');
                    }
                } catch (error) {
                    console.error('Error fetching or processing image:', error);
                }
            }
        }

        message.channel.sendTyping()


        let maxRetries = 8; // 再試行の最大回数
        let meboResult;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            meboResult = await meboApi.chat(message.content, base64Image);

            if (meboResult.bestResponse.utterance != "") {
                message.reply(meboResult.bestResponse.utterance.replaceAll("<br />", "\n"));
                return; // 成功したので関数を終了
            } else if (attempt < maxRetries) {
                if (attempt % 3 == 0) {
                    message.reply(`混雑中です。再試行します。${attempt}回目/最大${maxRetries}回`);
                }

                message.channel.sendTyping()
            } else {
                message.reply("現在混雑中です。回答を取得できませんでした。");
            }
        }

    } catch (error) {
        console.error(error);
        try {
            message.reply("エラーが発生しました。初期化します。");
            await meboApi.initChat();
        } catch (error) {
            console.error(error);
        }
    }
});

function getImageDimensions(buffer) {
    return new Promise((resolve, reject) => {
        const sizeOf = require('image-size');
        try {
            const dimensions = sizeOf(buffer);
            resolve(dimensions);
        } catch (error) {
            reject(error);
        }
    });
}
