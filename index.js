import dotenv from 'dotenv';
import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { exec } from 'child_process';
import fs from 'fs';

dotenv.config({path: './config.env'});

const bot = new Telegraf(process.env.Token);

bot.command('start', (ctx) => {
    ctx.reply('Привет! Выберите нужную опцию:', Markup.keyboard([
        ['📊 Информация о системе'],
        ['📸 Сделать скриншот'], 
        ['⏯️ Медиа управление'],
        ['⚡ Выключить систему']
    ]).resize());
});

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

        const metadata = await new Promise((resolve, reject) => {
            exec('playerctl metadata --format "{{ artist }} - {{ title }}"', (error, stdout) => {
                if (error && error.code === 1) {
                    resolve('Нет активного плеера');
                } else if (error) {
                    reject(error);
                } else {
                    resolve(stdout.trim());
                }
            });
        });

        if (metadata === 'Нет активного плеера') {
            ctx.reply(metadata);
        } else {
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

            const message = `🎵 ${metadata}\n(${status})\nГромкость: ${volume}`;
            if (!artUrl) {
                await ctx.reply(message, {
                    reply_markup: {
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
                    }
                });
            } else {
                if (artUrl.startsWith('file://')) {
                    const filePath = artUrl.replace('file://', '');
                    await ctx.replyWithPhoto(
                        { source: filePath },
                        {
                            caption: message,
                            reply_markup: {
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
                            }
                        }
                    );
                } else {
                    await ctx.replyWithPhoto(
                        artUrl,
                        {
                            caption: message,
                            reply_markup: {
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
                            }
                        }
                    );
                }
            }
        }
    } catch (error) {
        console.error(error);
        ctx.reply('Произошла ошибка при получении данных');
    }
});

bot.action('previous', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    exec('playerctl previous', async (error) => {
        if (error) {
            ctx.answerCbQuery('Ошибка при выполнении команды');
            return;
        }
        
        setTimeout(async () => {
            try {
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

                const message = `🎵 ${metadata}\n(${status})\nГромкость: ${volume}`;

                if (!artUrl) {
                    await ctx.editMessageText(message, {
                        reply_markup: {
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
                        }
                    });
                } else {
                    const media = artUrl.startsWith('file://') ? 
                        { source: artUrl.replace('file://', '') } : 
                        artUrl;

                    await ctx.editMessageMedia(
                        {
                            type: 'photo',
                            media: media,
                            caption: message
                        },
                        {
                            reply_markup: {
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
                            }
                        }
                    );
                }

                ctx.answerCbQuery('Переключено на предыдущий трек');
            } catch (error) {
                console.error('Ошибка при обновлении данных:', error);
                ctx.reply('Произошла ошибка при обновлении данных');
            }
        }, 2000);
    });
});

bot.action('playpause', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    exec('playerctl play-pause', async (error) => {
        if (error) {
            ctx.answerCbQuery('Ошибка при выполнении команды');
            return;
        }
        setTimeout(async () => {
            try {
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

                const message = `🎵 ${metadata}\n(${status})\nГромкость: ${volume}`;

                if (!artUrl) {
                    await ctx.editMessageText(message, {
                        reply_markup: {
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
                        }
                    });
                } else {
                    const media = artUrl.startsWith('file://') ? 
                        { source: artUrl.replace('file://', '') } : 
                        artUrl;

                    await ctx.editMessageMedia({
                        type: 'photo',
                        media: media,
                        caption: message
                    }, {
                        reply_markup: {
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
                        }
                    });
                }

                ctx.answerCbQuery('Воспроизведение переключено');
            } catch (error) {
                console.error('Ошибка при обновлении данных:', error);
                ctx.reply('Произошла ошибка при обновлении данных');
            }
        }, 1000);
    });
});

bot.action('next', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    exec('playerctl next', async (error) => {
        if (error) {
            ctx.answerCbQuery('Ошибка при выполнении команды');
            return;
        }
        setTimeout(async () => {
            try {
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

                const message = `🎵 ${metadata}\n(${status})\nГромкость: ${volume}`;

                if (!artUrl) {
                    await ctx.editMessageText(message, {
                        reply_markup: {
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
                        }
                    });
                } else {
                    const media = artUrl.startsWith('file://') ? 
                        { source: artUrl.replace('file://', '') } : 
                        artUrl;

                    await ctx.editMessageMedia({
                        type: 'photo',
                        media: media,
                        caption: message
                    }, {
                        reply_markup: {
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
                        }
                    });
                }

                ctx.answerCbQuery('Переключено на следующий трек');
            } catch (error) {
                console.error('Ошибка при обновлении данных:', error);
                ctx.reply('Произошла ошибка при обновлении данных');
            }
        }, 2000);
    });
});

bot.action('volumedown', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    
    try {
        exec('pactl set-sink-volume @DEFAULT_SINK@ -10%', async (error) => {
            if (error) {
                ctx.answerCbQuery('Ошибка при изменении громкости');
                return;
            }

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

            const message = `🎵 ${metadata}\n(${status})\nГромкость: ${volume}`;

            await ctx.editMessageCaption(message, {
                reply_markup: {
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
                }
            });

            ctx.answerCbQuery('Громкость уменьшена');
        });
    } catch (err) {
        console.error(err);
        ctx.answerCbQuery('Произошла ошибка');
    }
});

bot.action('volumeup', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    
    try {
        exec('pactl set-sink-volume @DEFAULT_SINK@ +10%', async (error) => {
            if (error) {
                ctx.answerCbQuery('Ошибка при изменении громкости');
                return;
            }

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

            const message = `🎵 ${metadata}\n(${status})\nГромкость: ${volume}`;

            await ctx.editMessageCaption(message, {
                reply_markup: {
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
                }
            });

            ctx.answerCbQuery('Громкость увеличена');
        });
    } catch (err) {
        console.error(err);
        ctx.answerCbQuery('Произошла ошибка');
    }
});

bot.action('mute', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    exec('pactl set-sink-mute @DEFAULT_SINK@ toggle', async (error) => {
        if (error) {
            ctx.answerCbQuery('Ошибка при выполнении команды');
            return;
        }

        try {
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

            const isMuted = await new Promise((resolve, reject) => {
                exec('pactl get-sink-mute @DEFAULT_SINK@', (error, stdout) => {
                    if (error) reject(error);
                    else resolve(stdout.includes('yes'));
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

            const message = `🎵 ${metadata}\n(${status})\nГромкость: ${volume}${isMuted ? ' (muted)' : ''}`;

            if (!artUrl) {
                await ctx.editMessageText(message, {
                    reply_markup: {
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
                    }
                });
            } else {
                const media = artUrl.startsWith('file://') ? 
                    { source: artUrl.replace('file://', '') } : 
                    artUrl;

                await ctx.editMessageMedia({
                    type: 'photo',
                    media: media,
                    caption: message
                }, {
                    reply_markup: {
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
                    }
                });
            }

            ctx.answerCbQuery('Звук переключен');
        } catch (err) {
            console.error(err);
            ctx.answerCbQuery('Произошла ошибка');
        }
    });
});

bot.action('ignore', async (ctx) => {
    try {
        await ctx.deleteMessage();
        
        await ctx.answerCbQuery('Сообщение удалено');
    } catch (error) {
        console.error('Ошибка при удалении сообщения:', error);
        await ctx.answerCbQuery('Ошибка при удалении сообщения');
    }
});

bot.hears('Назад', (ctx) => {
    ctx.reply('Главное меню:', Markup.keyboard([
        ['📊 Информация о системе'],
        ['📸 Сделать скриншот'],
        ['⏯️ Медиа управление'],
        ['⚡ Выключить систему']
    ]).resize());
});

bot.hears('📸 Сделать скриншот', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    try {
        exec('import -window root screenshot.png', async (error, stdout, stderr) => {
            if (error) {
                ctx.reply('Ошибка при создании скриншота: ' + error.message);
                return;
            }
            try {
                await ctx.replyWithPhoto({ source: './screenshot.png' });
                exec('rm screenshot.png');
            } catch (err) {
                ctx.reply('Ошибка при отправке скриншота');
                console.error(err);
                exec('rm screenshot.png');
            }
        });
    } catch (err) {
        ctx.reply('Произошла ошибка при выполнении команды');
        console.error(err);
    }
});

bot.command('id', (ctx) => {
    ctx.reply(`Ваш ID: ${ctx.from.id}`);
});

bot.hears('📊 Информация о системе', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    try {
        exec('uname -a', (error, stdout, stderr) => {
            if (error) {
                ctx.reply('Ошибка при получении информации о системе');
                return;
            }
            exec('lsb_release -d && dpkg -l | wc -l && flatpak list | wc -l && snap list | wc -l && uptime -p && lscpu | grep "Model name" && lspci | grep -i vga && free -m | grep "^Mem:" | awk \'{print $2","$3}\'', (error, stdout, stderr) => {
                const [system, dpkg, flatpak, snap, uptime, cpu, gpu, ram] = stdout.split('\n');
                const [totalRam, usedRam] = ram.trim().split(',').map(Number);
                const ramPercentage = ((usedRam/totalRam) * 100).toFixed(1);
                ctx.reply(
                    `*Система:* ${system.replace('Description:', '').trim()}\n` +
                    `*Пакеты:* ${dpkg.trim()} (dpkg), ${flatpak.trim()} (flatpak), ${snap.trim()} (snap)\n` +
                    `*Время работы:* ${uptime.replace('up ', '')}\n` +
                    `*CPU:* ${cpu.replace('Model name:', '').trim()}\n` +
                    `*GPU:* ${gpu.split(':')[2].trim()}\n` +
                    `*RAM:* ${(usedRam/1024).toFixed(1)}GB/${(totalRam/1024).toFixed(1)}GB (${ramPercentage}%)\n` +
                    `*Трафик:* ⬇️ ${(parseInt(stdout.match(/RX bytes:(\d+)/) ? stdout.match(/RX bytes:(\d+)/)[1] : 0) / (1024 * 1024)).toFixed(2)}MB ⬆️ ${(parseInt(stdout.match(/TX bytes:(\d+)/) ? stdout.match(/TX bytes:(\d+)/)[1] : 0) / (1024 * 1024)).toFixed(2)}MB\n`,
                    { parse_mode: 'Markdown' }
                );
            });
        });
    } catch (err) {
        ctx.reply('Произошла ошибка при выполнении команды');
        console.error(err);
    }
});

bot.hears('⚡ Выключить систему', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    try {
        await ctx.reply('Выключение компьютера...');
        exec('sudo shutdown now', (error, stdout, stderr) => {
            if (error) {
                ctx.reply('Ошибка при выключении: ' + error.message + '\nПопробуйте добавить пользователя в sudoers или настроить shutdown без пароля');
                return;
            }
        });
    } catch (err) {
        ctx.reply('Произошла ошибка при выполнении команды');
        console.error(err);
    }
});

bot.action('shutdown', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    try {
        await ctx.editMessageText('Выключение компьютера...');
        await ctx.answerCbQuery('Выключение компьютера...');
        exec('sudo shutdown now', (error, stdout, stderr) => {
            if (error) {
                ctx.reply('Ошибка при выключении: ' + error.message + '\nПопробуйте добавить пользователя в sudoers или настроить shutdown без пароля');
                return;
            }
        });
    } catch (err) {
        ctx.reply('Произошла ошибка при выполнении команды');
        console.error(err);
    }
});

bot.action('ignore', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    await ctx.answerCbQuery('Уведомление проигнорировано');
    await ctx.deleteMessage();
});

async function startBot() {
    try {
        await bot.launch();
        const botInfo = await bot.telegram.getMe();
        console.log('Bot is running as @' + botInfo.username);
    } catch (error) {
        console.log('Ошибка запуска бота:', error);
        console.log('Попытка переподключения через 5 секунд...');
        setTimeout(startBot, 5000);
    }
}

try {
    startBot();
    const botInfo = await bot.telegram.getMe();
    console.log('Bot is running as @' + botInfo.username);
    await bot.telegram.sendMessage(process.env.Me, 'Ваш компьютер был запущен', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '⚡ Выключить', callback_data: 'shutdown' },
                    { text: '❌ Игнорировать', callback_data: 'ignore' }
                ]
            ]
        }
    });
} catch (error) {
    console.error('Ошибка при запуске бота:', error);
}