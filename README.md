# Script

## [sub-store](https://github.com/sub-store-org/Sub-Store)
### subscribe
订阅管理脚本， 目前只实现了 重命名规则
### target
应本人目前只使用 sing-box ，故只编写了sing-box 的规则脚本。
#### sing-box.js
1. 出站节点按照国家进行分组，
2. 将不同的国家分配给不同的应用， 目前只分配了哔哩哔哩和默认代理
3. 是否代理 route.rule_set.url， 根据参数PROXY 和 请求头 headers.proxy_flag 进行判断
4. 根据不同的系统，设置sing-box 不同的规则
5. 根据 headers.adguard 判断是否添加广告功能
