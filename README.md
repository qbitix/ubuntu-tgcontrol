# ubuntu-tgcontrol
Ужасно простенький бот с открытым кодом

Для коректной работы нужен [node.js](https://nodejs.org/) v23.X.X

## <img src="https://icon.icepanel.io/Technology/svg/Node.js.svg" width="25"/> Подготовка к запуску (Node JS)

### Клонирование репозитория
```bash
git clone https://github.com/qbitix/ubuntu-tgcontrol.git
```

### Переход в основную директорию бота
```bash
cd ubuntu-tgcontrol
```

### Установка пакетов
```bash
npm i dotenv telegraf
```

### Установка pm2
```bash
npm install -g pm2
```

## Запуск 
### Запуск бота через pm2
```bash
pm2 start index.js --name "YOUR_NAME" --node-args="--no-warnings"
```
## Настройка автозагрузки

### Сохраните конфигурацию процессов pm2
```bash
pm2 save
```

### Получите команду для активации автозагрузки
```bash
pm2 startup
```
