let common = require("./utils/common");
let $ = new common.env('宠汪汪兑换京豆');
let fs = require("fs"); 
const UA = `jdapp;iPhone;10.0.8;13.7;${randomString()};network/wifi;model/iPhone8,1;addressid/4666062376;appBuild/167741;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`
function randomString() {
  return Math.random().toString(16).slice(2, 10) +
    Math.random().toString(16).slice(2, 10) +
    Math.random().toString(16).slice(2, 10) +
    Math.random().toString(16).slice(2, 10) +
    Math.random().toString(16).slice(2, 10)
}

$.setOptions({
    headers: {
        'content-type': 'application/json',
        'user-agent': UA,
        'referer': 'https://happy.m.jd.com/babelDiy/',
    }
});
eval(common.eval.mainEval($));
async function prepare() {
    $.thread = 1; 
    //await $.timer("00 00 */8",120)
}
async function main(id) {
    let txt = await fs.readFileSync('./jdvalidate.txt', 'utf-8');
    let lists = txt.split("\n");
    let validate = lists[id.index - 1];
    let params = {
        'url': `https://jdjoy.jd.com/common/gift/getBeanConfigs?reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F&validate=${validate}`,
        'cookie': id.cookie
    }
    try {
        await $.curl(params)
        let h = new Date().getHours();
        if (h >= 0 && h < 8) {
            config = $.source.data['beanConfigs0']
        } else if (h >= 8 && h < 16) {
            config = $.source.data['beanConfigs8']
        } else {
            config = $.source.data['beanConfigs16']
        } 
        for (let i of config.reverse()) {
            params = {
                'url': `https://jdjoy.jd.com/common/gift/new/exchange?reqSource=h5&invokeKey=qRKHmL4sna8ZOP9F&validate=${validate}`,
                'body': `{"buyParam":{"orderSource":"pet","saleInfoId":${i.id}},"deviceInfo":{}}`,
                'cookie': id.cookie
            }
            await $.curl(params)
            let log = '';
            switch ($.source.errorCode) {
                case 'stock_empty':
                    log = "库存为空"
                    break
                case 'insufficient':
                    log = "积分不足"
                    break
                case 'buy_limit':
                    log = "已兑换过"
                    break;
                case 'buy_success':
                    log = "兑换成功"
                    break;
                case 'H0001':
                    log = "刷新验证"
                    break;
                default:
                    log = "未知状态"
                    break
            }
            console.log(id.user, log, i.giftValue)
            $.notices(log, id.user)
        }
    } catch (e) {}
}
