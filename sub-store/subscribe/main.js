const outbound_urltest_tag = {
    "hk" : /港|HK|🇭🇰|hong/i ,
    "us": /美国|US|🇺🇲/i ,
    "tw": /台湾|TW|🇹🇼/i ,
    "sg": /新|SG|🇸🇬|狮城/i ,
    "kr": /韩|KR|🇰🇷/i ,  
    "gb": /英国|GB|🇬🇧/i ,
    "jp": /日本|JP|🇯🇵/i,
}

const copy_proxies = JSON.parse(JSON.stringify(proxies));

// 重命名
for (const key in outbound_urltest_tag) {  
  copy_proxies.map((node, index) => {
    if (outbound_urltest_tag[key].test(node.name)) {
      proxies[index].name = key
    }
  })
}