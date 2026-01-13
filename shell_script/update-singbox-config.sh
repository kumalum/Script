#!/bin/bash
CONFIG_FILE="/etc/sing-box/config.json"
WORKING_DIR="/var/lib/sing-box"
UA="User-Agent: $(uname)"
EXUID="uid:${EXCLUDE_UID}"

function downlaod() {
    stop;
    sudo curl -H "$UA" -H "$EXUID"  -o "$CONFIG_FILE" "$SINGBOX_SUBURL";
    start;
}

function clear_cache() {
    stop;
    sudo rm "$WORKING_DIR";
    start;
}

function stop() {
    sudo systemctl stop sing-box.service
}

function start() {
    sudo systemctl stop sing-box.service
}

if [ ! $SINGBOX_SUBURL ] {
    echo "缺少环境变量 SINGBOX_SUBURL";
    exit 1;
}

if [ $1 -eq "-u"] then;
    downlaod
elif [$1 -eq "-c"]
    clear_cache
else
    echo "欢迎使用 sing-box 脚本.\n -c 清除缓存 \n -u 更新脚本功能"
fi