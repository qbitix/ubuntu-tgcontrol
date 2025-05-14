#!/bin/bash

set -e

TARGET_DIR="/var/lib/ubuntu-tgcontrol"
REPO_URL="https://github.com/qbitix/ubuntu-tgcontrol.git"
NVM_INSTALL_SCRIPT_URL="https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh"

check_command_exists() {
    command -v "$1" >/dev/null 2>&1
}

ensure_sudo() {
    if [ "$(id -u)" -ne 0 ]; then
        echo "Этот скрипт необходимо запускать с правами sudo."
        echo 'Пожалуйста, выполните: sudo bash -c "$(curl -sL https://github.com/qbitix/ubuntu-tgcontrol/raw/main/install.sh)"'
        exit 1
    fi
}

install_prerequisites() {
    apt-get update -y
    if ! check_command_exists git; then
        apt-get install -y git
    fi
    if ! check_command_exists curl; then
        apt-get install -y curl
    fi
}

install_nodejs_v23() {
    export NVM_DIR="$HOME/.nvm"

    if [ -s "$NVM_DIR/nvm.sh" ]; then
        . "$NVM_DIR/nvm.sh"
    fi

    if ! check_command_exists nvm; then
        curl -o- "$NVM_INSTALL_SCRIPT_URL" | bash
        
        if [ -s "$NVM_DIR/nvm.sh" ]; then
            . "$NVM_DIR/nvm.sh"
        else
            echo "ОШИБКА: nvm.sh не найден в $NVM_DIR после установки."
            exit 1
        fi
    fi
    
    if ! check_command_exists nvm; then
        echo "ОШИБКА: команда nvm все еще не доступна после установки."
        exit 1
    fi

    NODE_VERSION_NVM_CURRENT=$(nvm current 2>/dev/null)
    NODE_VERSION_NVM_MAJOR=$(echo "$NODE_VERSION_NVM_CURRENT" | sed -E 's/v([0-9]+)\..*/\1/' || echo "none")

    if [ "$NODE_VERSION_NVM_MAJOR" == "23" ]; then
        return
    fi

    SYSTEM_NODE_VERSION_MAJOR="none"
    if check_command_exists node; then
        SYSTEM_NODE_VERSION=$(node -v 2>/dev/null)
        SYSTEM_NODE_VERSION_MAJOR=$(echo "$SYSTEM_NODE_VERSION" | sed -E 's/v([0-9]+)\..*/\1/' || echo "none")
        if [ "$SYSTEM_NODE_VERSION_MAJOR" == "23" ]; then
            return
        fi
    fi
    
    if ! nvm ls-remote 23 | grep -q "v23"; then
        echo "ОШИБКА: nvm не может найти Node.js v23."
        exit 1
    fi
    
    nvm install 23
    if [ $? -ne 0 ]; then
        echo "ОШИБКА при установке Node.js v23."
        exit 1
    fi
    nvm use 23
    nvm alias default 23
}

install_playerctl() {
    if ! check_command_exists playerctl; then
        apt-get install -y playerctl
    fi
}

clone_repo_and_install_deps() {
    if [ -d "$TARGET_DIR" ]; then
        rm -rf "$TARGET_DIR"
    fi
    mkdir -p "$(dirname "$TARGET_DIR")"
    git clone "$REPO_URL" "$TARGET_DIR"
    
    cd "$TARGET_DIR"

    if check_command_exists npm; then
        npm install dotenv telegraf
    else
        echo "ОШИБКА: npm не найден."
        exit 1
    fi
    
    if [ -f "config.env" ] && [ ! -f ".env" ]; then
        cp config.env .env
    fi
}

create_systemd_service() {
    cat > /etc/systemd/system/ubuntu-tgcontrol.service << EOL
[Unit]
Description=Ubuntu Telegram Control Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$TARGET_DIR
ExecStart=/bin/bash -c 'source $HOME/.nvm/nvm.sh && node index.js'
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

    systemctl daemon-reload
}

main() {
    ensure_sudo
    echo "Установка ubuntu-tgcontrol..."
    
    install_prerequisites
    install_nodejs_v23
    install_playerctl
    clone_repo_and_install_deps
    create_systemd_service

    echo "Установка завершена!"
    echo ""
    echo "ВАЖНЫЕ СЛЕДУЮЩИЕ ШАГИ:"
    echo "1. Отредактируйте конфигурацию:"
    echo "   sudo nano $TARGET_DIR/.env"
    echo ""
    echo "2. Запустите бота:"
    echo "   sudo systemctl start ubuntu-tgcontrol"
    echo ""
    echo "3. Включите автозапуск:"
    echo "   sudo systemctl enable ubuntu-tgcontrol"
    echo ""
    echo "4. Просмотр логов:"
    echo "   sudo journalctl -u ubuntu-tgcontrol"
    echo ""
    echo "5. Остановка бота:"
    echo "   sudo systemctl stop ubuntu-tgcontrol"
}

# --- Execute Main Function ---
main
