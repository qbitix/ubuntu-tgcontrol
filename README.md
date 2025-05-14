# ubuntu-tgcontrol
Ужасно простенький бот с открытым кодом


## <img src="https://icon.icepanel.io/Technology/svg/Node.js.svg" width="25"/> Установка

### Скрипт для установки
```bash
sudo bash -c "$(curl -sL https://github.com/qbitix/ubuntu-tgcontrol/raw/main/install.sh)"
```

### Для редактирования конфига
```bash
sudo nano /var/lib/ubuntu-tgcontrol/.env
```

### Для включения автозагрузки
```bash
sudo systemctl enable ubuntu-tgcontrol
```

### Для включения бота
```bash
sudo systemctl start ubuntu-tgcontrol
```
