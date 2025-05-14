import { exec } from 'child_process';
import { Markup } from 'telegraf';

export function setupShutdown(bot, requireOwner) {
    bot.hears('⚡ Выключить компьютер', requireOwner(async (ctx) => {
        try {
            await ctx.reply('Через сколько минут выключить компьютер? (Введите число минут)', 
                Markup.keyboard([
                    ['⚡ Отключить немедленно'],
                    ['❌ Отменить выключения'],
                    ['⬅️ Назад']
                ]).resize()
            );
        } catch (err) {
            ctx.reply('Произошла ошибка при выполнении команды');
            console.error(err);
        }
    }));

    bot.hears(/^(\d+|now)$/, requireOwner(async (ctx) => {
        try {
            const time = ctx.match[1];
            let command;
            let message;
            
            if (isNaN(time)) {
                ctx.reply('Введите целое число минут');
                return;
            }

            const minutes = parseInt(time);
            command = `sudo shutdown +${minutes}`;
            message = `Компьютер будет выключен через ${minutes} минут`;

            await ctx.reply(message);
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    ctx.reply('Ошибка при выключении: ' + error.message + '\nПопробуйте добавить пользователя в sudoers или настроить shutdown без пароля');
                    return;
                }
            });
        } catch (err) {
            ctx.reply('Произошла ошибка при выполнении команды');
            console.error(err);
        }
    }));

    bot.hears('⚡ Отключить немедленно', requireOwner(async (ctx) => {
        await ctx.reply('Выключение компьютера...');
        exec('sudo shutdown now', (error, stdout, stderr) => {
            if (error) {
                ctx.reply('Ошибка при выключении: ' + error.message + '\nПопробуйте добавить пользователя в sudoers или настроить shutdown без пароля');
                return;
            }
        });
    }));

    bot.hears('❌ Отменить выключения', requireOwner(async (ctx) => {
        await ctx.reply('Все операции выключения отменены', 
            Markup.keyboard([
                ['📊 Cистема'],
                ['📸 Сделать скриншот'], 
                ['⏯️ Медиа управление']
            ]).resize()
        );
    }));

    bot.action('offit', requireOwner(async (ctx) => {
        try {
            await ctx.answerCbQuery();
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
    }));

    bot.action('ignore', requireOwner(async (ctx) => {
        try {
            await ctx.answerCbQuery('Уведомление проигнорировано');
            await ctx.deleteMessage();
        } catch (err) {
            console.error(err);
        }
    }));
} 