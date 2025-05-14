import { exec } from 'child_process';

export function setupSysInfo(bot, requireOwner) {
    bot.hears('📊 Информация о системе', requireOwner(async (ctx) => {
        try {
            exec('uname -a', async (error, stdout, stderr) => { 
                if (error) {
                    ctx.reply('Ошибка при получении информации о системе');
                    return;
                }
                exec('lsb_release -d && dpkg -l | wc -l && flatpak list | wc -l && snap list | wc -l && uptime -p && lscpu | grep "Model name" && lspci | grep -i vga && free -m | grep "^Mem:" | awk \'{print $2","$3}\'', async (error, stdout, stderr) => {
                    const [system, dpkg, flatpak, snap, uptime, cpu, gpu, ram] = stdout.split('\n');
                    const [totalRam, usedRam] = ram.trim().split(',').map(Number);
                    const ramPercentage = ((usedRam/totalRam) * 100).toFixed(1);

                    // Get network traffic
                    let trafficInfo;
                    try {
                        const iface = await new Promise((resolve, reject) => {
                            exec('ip route | grep default | cut -d" " -f5', (error, stdout) => {
                                if (error) reject(error);
                                resolve(stdout.trim());
                            });
                        });

                        const traffic = await new Promise((resolve, reject) => {
                            exec(`cat /sys/class/net/${iface}/statistics/rx_bytes /sys/class/net/${iface}/statistics/tx_bytes`, (error, stdout) => {
                                if (error) reject(error);
                                const [rx, tx] = stdout.split('\n').map(Number);
                                resolve(`\n⬇️ ${(rx / (1024 * 1024)).toFixed(2)}MB \n⬆️ ${(tx / (1024 * 1024)).toFixed(2)}MB`);
                            });
                        });
                        trafficInfo = traffic;
                    } catch (err) {
                        trafficInfo = 'Ошибка получения трафика';
                    }

                    ctx.reply(
                        `*Система:* ${system.replace('Description:', '').trim()}\n` +
                        `*Пакеты:* ${dpkg.trim()} (dpkg), ${flatpak.trim()} (flatpak), ${snap.trim()} (snap)\n` +
                        `*Время работы:* ${uptime.replace('up ', '')}\n` +
                        `*CPU:* ${cpu.replace('Model name:', '').trim()}\n` +
                        `*GPU:* ${gpu.split(':')[2].trim()}\n` +
                        `*RAM:* ${(usedRam/1024).toFixed(1)}GB/${(totalRam/1024).toFixed(1)}GB (${ramPercentage}%)\n` +
                        `*Трафик (За данную сессию):* ${trafficInfo}\n`,
                        { parse_mode: 'Markdown' }
                    );
                });
            });
        } catch (err) {
            ctx.reply('Произошла ошибка при выполнении команды');
            console.error(err);
        }
    }));
}
