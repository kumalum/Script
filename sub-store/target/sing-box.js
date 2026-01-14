/* 
 引用模板和节点数组
*/
let config = JSON.parse($files[0])
const { type, name } = $arguments
let proxies = await produceArtifact({
    name: 'CDN',
    type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
    platform: 'sing-box',
    produceType: 'internal',
})

const name_mapping = {
    "hk": "🇭🇰 中国香港",
    "tw": "🇹🇼 中国台湾",
    "sg": "🇸🇬 新加坡",
    "us": "🇺🇲 美国",
    "kr": "🇰🇷 韩国",
    "gb": "🇬🇧 英国",
    "jp": "🇯🇵 日本",
}

const app_mapping = {
    // 出站要添加的国家或者地区节点
    "bilibili": ["hk", "tw"]
}

const index_map = {
    // 需要修改值的所在的列表位置
    // 广告的路由规则位置
    dns_rules_ad: 0,
    route_rules_ad: 2,
    // 哔哩哔哩和全球代理出站，在 outbouns 中的位置 
    outbouns_bilibili: 4,
    outbouns_proxy: 0,
    // tun 在 inbounds 中的位置
    inbounds_tun: 0,
    // resolver 在 dns.servers 中的位置
    server_resolver: 0
}

/*
以下两个为模板
complete_outbounds_urltest outbounds 的 urltest 类型模板
complete_rule_set route 的 rule_set 模板
 */
const complete_outbounds_urltest = {
    tag: "",
    type: "urltest",
    outbounds: [],
    url: "https://www.gstatic.com/generate_204  ",
    interval: "3m"
}

const complete_dns_servers_resolver = {
    type: "local",
    tag: "dns-resolver"
}

let complete_rule_set = {
    "type": "",
    "tag": "remote",
    "format": "binary",
    "url": ""
}

/**
 * 按照国家进行分组
 */

const region = {}
proxies.map(node => {
    const region_name = node.tag.split("-")[0]
    if (region_name in region) {
        region[region_name].outbounds.push(node.tag)
    } else {
        region[region_name] = JSON.parse(JSON.stringify(complete_outbounds_urltest));
        region[region_name].tag = name_mapping[region_name]
    }
})

/**
添加节点
**/
for (const outbound_urltest in region) {
    // 将 中国香港 和 中国台湾分配给 哔哩哔哩

    if (app_mapping.bilibili.includes(outbound_urltest)) {
        config.outbounds[index_map.outbouns_bilibili].outbounds.push(region[outbound_urltest].tag)
    }

    // 将所有国家或者地区节点都分配给 🚀手动选择
    config.outbounds[index_map.outbouns_proxy].outbounds.push(region[outbound_urltest].tag)

    config.outbounds.push(region[outbound_urltest])

}

const ALL_NODE = $arguments.ALL_NODE.split(",")
// ALL_NODE 环境变量/参数， 需要在 sub-store 添加参数
config.outbounds.map(outbound => {
    if (ALL_NODE.includes(outbound.tag)) {
        // 将 tag 为🚀手动选择 和 ♻️自动选择 的出站添加所有节点
        outbound.outbounds.push(...getTags(proxies))
    }
})

config.outbounds.push(...proxies)
// 将所有的节点 添加到出站 outbounds

/**
 * 根据请求参数进行定制化 sing-box 配置
 */

try {
    const { headers, url, path } = $options?._req
    // 获取请求头、网址以及路径

    system_rule(headers)
    open_adguard(headers, path)
    open_proxy_rule_set(headers, path)


} catch {
    console.log("test");

}

function system_rule(headers) {

    const ua = headers["user-agent"]

    if (/Linux/i.test(ua)) {
        // 在 Linux 设备下的规则
        // 使用 nftables 改善 TUN 路由和性能
        config.inbounds[index_map.inbounds_tun].auto_redirect = true
        if ("exclude_uid" in headers) {
            // 不代理该 uid， 仅在 linux 下生效
            const exclude_uid = headers.exclude_uid.split(",").map(Number)
            config.inbounds[index_map.inbounds_tun].exclude_uid = exclude_uid
        }
    } else if (/sfa|android|phone/i.test(ua)) {
        // 在 Android 设备下的规则
        // 接受 Android VPN 作为上游网卡
        config.route.override_android_vpn = true
        // 使用非 local 类型的dns 服务器 在安卓客户端会不工作
        // 将 alidns 解析器 替换为本地解析器
        config.dns.servers[index_map.server_resolver] = complete_dns_servers_resolver
    } else if (/windows|nt|mingw/i.test(ua)) {
        return
    }

}

function open_adguard(headers, path) {
    // 开启 adguard 规则

    if (! if_flag(headers, path, "adguard")) {
        return
    }

    const rule_set_adguard = JSON.parse(JSON.stringify(complete_rule_set));
    rule_set_adguard.tag = "site-adguard"
    rule_set_adguard.url = "https://raw.githubusercontent.com/kumalum/GFW/rule-set/adguard.srs"

    config.route.rule_set.push(rule_set_adguard)
    config.route.rules[index_map.route_rules_ad].rule_set.push(rule_set_adguard.tag)
    config.dns.rules[index_map.dns_rules_ad].rule_set.push(rule_set_adguard.tag)

}

function open_proxy_rule_set(headers, path) {
    // 给rule_set.url添加代理

    if (! if_flag(headers, path, "proxy")) {
        return
    }

    config.route.rule_set.map(rule_set => {
        if (! /githubusercontent/i.test(rule_set.url)) {
            // 若不是github 的连接 则跳出本次循环
            return
        }
        rule_set.download_detour = "🏡本地代理"
        rule_set.url = $arguments.PROXY + rule_set.url
    })

}

function if_flag(headers, path, string) {

    const flag = false
    if (string in headers && headers[string] === "true") {
        flag = true
    }

    if (string in path && path[string] === "true") {
        flag = true
    }

    return flag

}

// JSON
$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
    return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}