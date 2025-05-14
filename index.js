import dotenv from 'dotenv';
import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { exec } from 'child_process';
import fs from 'fs';
import { setupMediaControls } from './modules/media.js';
import { setupSysInfo } from './modules/sys_info.js';
import { setupShutdown } from './modules/shutdown.js';

dotenv.config({path: './.env'});

const bot = new Telegraf(process.env.Token);

const CONFIG = {
    TRACK_CHANGE_DELAY: 2000,
    VOLUME_STEP: 10,
    RECONNECT_DELAY: 5000
};

function requireOwner(handler) {
    return async (ctx) => {
        if (ctx.from.id.toString() !== process.env.Me) return;
        try {
            await handler(ctx);
        } catch (error) {
            console.error('Error:', error);
            await ctx.reply('Произошла ошибка при выполнении команды');
        }
    };
}

setupMediaControls(bot, requireOwner);
setupSysInfo(bot, requireOwner);
setupShutdown(bot, requireOwner);

bot.command('start', (ctx) => {
    ctx.reply('Привет! Выберите нужную опцию:', Markup.keyboard([
        ['📊 Cистема'],
        ['📸 Сделать скриншот'], 
        ['⏯️ Медиа управление']
    ]).resize());
});

bot.hears('📊 Cистема', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    ctx.reply('Выберете действие:', Markup.keyboard([
        ['📊 Информация о системе'],
        ['⚡ Выключить компьютер'],
        ['⚡ Перезагрузить компьютер'],
        ['⬅️ Назад']
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

bot.hears('⚡ Перезагрузить компьютер', async (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    try {
        await ctx.reply('Перезагрузка компьютера...');
        exec('sudo reboot', (error, stdout, stderr) => {
            if (error) {
                ctx.reply('Ошибка при перезагрузке: ' + error.message + '\nПопробуйте добавить пользователя в sudoers или настроить reboot без пароля');
                return;
            }
        });
    } catch (err) {
        ctx.reply('Произошла ошибка при выполнении команды');
        console.error(err);
    }
});

bot.hears('⬅️ Назад', (ctx) => {
    if (ctx.from.id.toString() !== process.env.Me) return;
    ctx.reply('Главное меню:', Markup.keyboard([
        ['📊 Cистема'],
        ['📸 Сделать скриншот'], 
        ['⏯️ Медиа управление']
    ]).resize());
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
                    { text: '⚡ Выключить', callback_data: 'offit' },
                    { text: '❌ Игнорировать', callback_data: 'ignore' }
                ]
            ]
        }
    });
} catch (error) {
    console.error('Ошибка при запуске бота:', error);
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));