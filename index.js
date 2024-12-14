import dotenv from 'dotenv';
import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { exec } from 'child_process';

dotenv.config({path: './config.env'});

const bot = new Telegraf(process.env.Token);

bot.command('start', (ctx) => {
    ctx.reply('Привет! Выберите нужную опцию:', Markup.keyboard([
        ['📊 Информация о системе'],
        ['📸 Сделать скриншот'], 
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

async function startBot() {
    try {
        await bot.launch();
        const botInfo = await bot.telegram.getMe();
        console.log('Bot is running as @' + botInfo.username);
        await bot.telegram.sendMessage(process.env.Me, 'Ваш компьютер был запущен');
    } catch (error) {
        console.log('Ошибка запуска бота:', error);
        console.log('Попытка переподключения через 5 секунд...');
        setTimeout(startBot, 5000);
    }
}

startBot();