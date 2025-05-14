import { exec } from 'child_process';

const CONFIG = {
    TRACK_CHANGE_DELAY: 2000,
    VOLUME_STEP: 10
};

const mediaKeyboard = {
    inline_keyboard: [
        [
            { text: '⏮️ Предыдущий', callback_data: 'previous' },
            { text: '⏯️ Пауза/Воспр.', callback_data: 'playpause' },
            { text: '⏭️ Следующий', callback_data: 'next' }
        ],
        [
            { text: '🔈 Тише', callback_data: 'volumedown' },
            { text: '🔊 Громче', callback_data: 'volumeup' },
            { text: '🔇 Без звука', callback_data: 'mute' }
        ]
    ]
};

async function getPlayerInfo() {
    const metadata = await new Promise((resolve, reject) => {
        exec('playerctl metadata --format "{{ artist }} - {{ title }}"', (error, stdout) => {
            if (error) reject(error);
            else resolve(stdout.trim());
        });
    });

    const status = await new Promise((resolve, reject) => {
        exec('playerctl status', (error, stdout) => {
            if (error) reject(error);
            else resolve(stdout.trim());
        });
    });

    const volume = await new Promise((resolve, reject) => {
        exec('pactl get-sink-volume @DEFAULT_SINK@ | grep Volume | awk \'{print $5}\'', (error, stdout) => {
            if (error) reject(error);
            else resolve(stdout.trim());
        });
    });

    const artUrl = await new Promise((resolve, reject) => {
        exec('playerctl metadata mpris:artUrl', (error, stdout) => {
            if (error) reject(error);
            else resolve(stdout.trim());
        });
    });

    return { metadata, status, volume, artUrl };
}

function isSameMessage(oldMessage, newMessage, oldArtUrl, newArtUrl) {
    return oldMessage === newMessage && oldArtUrl === newArtUrl;
}

async function updateMessage(ctx, newMetadata, newStatus, newVolume, newArtUrl) {
    try {
        const currentMessage = ctx.callbackQuery.message;
        const currentText = currentMessage.caption || currentMessage.text;
        const currentArtUrl = currentMessage.photo ? 
            (currentMessage.photo[0].file_id || '') : '';

        const newMessage = `🎵 ${newMetadata}\n(${newStatus})\nГромкость: ${newVolume}`;

        if (isSameMessage(currentText, newMessage, currentArtUrl, newArtUrl)) {
            return;
        }

        if (!newArtUrl) {
            await ctx.editMessageText(newMessage, { reply_markup: mediaKeyboard });
        } else {
            const media = newArtUrl.startsWith('file://') ? 
                { source: newArtUrl.replace('file://', '') } : 
                newArtUrl;
            await ctx.editMessageMedia({
                type: 'photo',
                media: media,
                caption: newMessage
            }, { reply_markup: mediaKeyboard });
        }
    } catch (error) {
        if (!error.message.includes('message is not modified')) {
            console.error('Error updating message:', error);
            ctx.reply('Ошибка при обновлении сообщения');
        }
    }
}

function setupMediaControls(bot, requireOwner) {
    bot.hears('⏯️ Медиа управление', async (ctx) => {
        if (ctx.from.id.toString() !== process.env.Me) return;
        
        try {
            const playerctlCheck = await new Promise((resolve) => {
                exec('which playerctl', (error) => {
                    resolve(!error);
                });
            });

            if (!playerctlCheck) {
                ctx.reply('Пакет playerctl не установлен\\. Установите его с помощью:\n\`\`\`bash\nsudo apt install playerctl\`\`\`', {
                    parse_mode: 'MarkdownV2'
                });
                return;
            }

            const { metadata, status, volume, artUrl } = await getPlayerInfo();

            if (metadata === 'Нет активного плеера') {
                ctx.reply(metadata);
            } else {
                const message = `🎵 ${metadata}\n(${status})\nГромкость: ${volume}`;
                if (!artUrl) {
                    await ctx.reply(message, { reply_markup: mediaKeyboard });
                } else {
                    const media = artUrl.startsWith('file://') ? 
                        { source: artUrl.replace('file://', '') } : 
                        artUrl;

                    await ctx.replyWithPhoto(media, {
                        caption: message,
                        reply_markup: mediaKeyboard
                    });
                }
            }
        } catch (error) {
            console.error(error);
            ctx.reply('Произошла ошибка при получении данных');
        }
    });

    bot.action('previous', requireOwner(async (ctx) => {
        try {
            await exec('playerctl previous');
            setTimeout(async () => {
                const { metadata, status, volume, artUrl } = await getPlayerInfo();
                await updateMessage(ctx, metadata, status, volume, artUrl);
            }, CONFIG.TRACK_CHANGE_DELAY);
        } catch (error) {
            console.error(error);
            ctx.reply('Ошибка при переключении трека');
        }
    }));

    bot.action('playpause', requireOwner(async (ctx) => {
        try {
            const currentMessage = ctx.callbackQuery.message;
            const currentText = currentMessage.caption || currentMessage.text;
            
            const currentStatus = currentText.match(/\((.*?)\)/)[1];
            
            const newStatus = currentStatus === 'Playing' ? 'Paused' : 'Playing';
            
            const newText = currentText.replace(`(${currentStatus})`, `(${newStatus})`);
            if (currentMessage.photo) {
                await ctx.editMessageCaption(newText, { reply_markup: mediaKeyboard });
            } else {
                await ctx.editMessageText(newText, { reply_markup: mediaKeyboard });
            }
        
            await exec('playerctl play-pause');
            
            setTimeout(async () => {
                const { metadata, status, volume, artUrl } = await getPlayerInfo();
                await updateMessage(ctx, metadata, status, volume, artUrl);
            }, 500);
        } catch (error) {
            console.error(error);
            ctx.reply('Ошибка при воспроизведении/паузе');
        }
    }));

    bot.action('next', requireOwner(async (ctx) => {
        try {
            await exec('playerctl next');
            setTimeout(async () => {
                const { metadata, status, volume, artUrl } = await getPlayerInfo();
                await updateMessage(ctx, metadata, status, volume, artUrl);
            }, CONFIG.TRACK_CHANGE_DELAY);
        } catch (error) {
            console.error(error);
            ctx.reply('Ошибка при переключении трека');
        }
    }));

    bot.action('volumeup', requireOwner(async (ctx) => {
        try {
            await exec(`pactl set-sink-volume @DEFAULT_SINK@ +${CONFIG.VOLUME_STEP}%`);
            const { metadata, status, volume, artUrl } = await getPlayerInfo();
            await updateMessage(ctx, metadata, status, volume, artUrl);
        } catch (error) {
            console.error(error);
            ctx.reply('Ошибка при изменении громкости');
        }
    }));

    bot.action('volumedown', requireOwner(async (ctx) => {
        try {
            await exec(`pactl set-sink-volume @DEFAULT_SINK@ -${CONFIG.VOLUME_STEP}%`);
            const { metadata, status, volume, artUrl } = await getPlayerInfo();
            await updateMessage(ctx, metadata, status, volume, artUrl);
        } catch (error) {
            console.error(error);
            ctx.reply('Ошибка при изменении громкости');
        }
    }));

    bot.action('mute', requireOwner(async (ctx) => {
        try {
            await exec('pactl set-sink-mute @DEFAULT_SINK@ toggle');
            
            setTimeout(async () => {
                const muteStatus = await new Promise((resolve, reject) => {
                    exec('pactl get-sink-mute @DEFAULT_SINK@', (error, stdout) => {
                        if (error) reject(error);
                        else resolve(stdout.includes('yes'));
                    });
                });

                const { metadata, status, volume, artUrl } = await getPlayerInfo();
                
                const muteIndicator = muteStatus ? ' 🔇' : '';
                await updateMessage(
                    ctx, 
                    metadata, 
                    status, 
                    volume + muteIndicator, 
                    artUrl
                );
            }, 200);
        } catch (error) {
            console.error(error);
            ctx.reply('Ошибка при отключении звука');
        }
    }));
}

export { setupMediaControls };