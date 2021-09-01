(() => {
    // 青龙token
    let token = localStorage.getItem('token');
    // 筛选只保留该类型的配置
    let globalConfigName = "JD_COOKIE";
    // qjd运行结果：拥有筛选失效CK
    let qjdRunResult = ``;

    // 定义个请求函数
    function req (url, method = 'get', token, data = {}, call = (res) => { }, async = true) {
        if (!url.includes('htt')) url = window.origin + url;
        //实例化xhr对象
        var xhr = new XMLHttpRequest();
        //载入请求open方法：请求方式，请求地址，是否异步
        //eg.
        //get:
        switch (method.toLowerCase()) {
            case 'get':
                xhr.open('GET', url, async);
                break;
            case 'post':
                xhr.open('POST', url, async);
                break;
            default:
                xhr.open(method.toUpperCase() || 'GET', url, async);
                break;
        }
        // post需要在请求头里指定发送数据的类型，下面是表单类型
        // send里填参数即可
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.send(JSON.stringify(data));
        //监听状态变化
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                // 处理响应正文responseText，多数是json数据
                // alert('删除成功：',xhr.responseText)
                call(xhr.responseText);
            }
        }
        if (!async) {
            if (xhr.readyState === 4 && xhr.status === 200) {
                // 处理响应正文responseText，多数是json数据
                // alert('删除成功：',xhr.responseText)
                call(xhr.responseText);
            }
        }
    }
    if (!token) {
        alert('未配置或者获取到token！');
        return;
    }
    if (!qjdRunResult) {
        let scriptsName = '';
        req('/api/crons?searchValue=_qjd.py', '', token, {}, (res) => {
            const data = JSON.parse(res).data.filter(item => item.name.includes('抢京豆') && item.command.includes('qjd.py'));
            // console.log('data：', data)
            if (data && data.length) scriptsName = data[0]._id;
        }, false);
        // console.log('scriptsName:', scriptsName)
        req('/api/crons/' + (scriptsName || '4PjMjONUvakuIRLu') + '/log', '', token, {}, (res) => {
            qjdRunResult = JSON.parse(res).data;
        }, false);
    }

    let arrs = [];
    // 获取青龙面板的配置变量列表
    req('/api/envs', '', token, {}, (res) => {
        // console.log('请求结果：',res)
        JSON.parse(res).data.forEach(arr => {
            arrs = arrs.concat(arr);
        });
        console.log('变量长度：', arrs.length);
        arrs = arrs.filter(arr => arr.name == globalConfigName);
        console.log(globalConfigName + '筛选后长度：', arrs.length);
        const isDeletedAccount = [];
        const needDeletedAccount = getExecStrsForCkIndex(qjdRunResult);
        if (!needDeletedAccount || !needDeletedAccount.length) {
            alert('暂无需要删除的账户！');
            return;
        }
        // console.log('needDeletedAccount：', qjdRunResult, needDeletedAccount)
        needDeletedAccount.forEach(item => {
            try {
                if (arrs.length >= item) {
                    console.log('item - 1：', item - 1, arrs.length, item)
                    const currentEnvItem = arrs[item - 1];
                    let paramsId = currentEnvItem._id;
                    let isLast = (qjdRunResult[qjdRunResult.length - 1] == item);
                    req('/api/envs', 'DELETE', token, [paramsId], (res) => {
                        isDeletedAccount.push({
                            账户名: currentEnvItem.value.split('pt_pin=')[1],
                            原始数据: currentEnvItem,
                        });
                        if ((isDeletedAccount.length == arrs.length) || isLast) console.log('失效账户全部删除完毕：', isDeletedAccount, '成功删除的账户数：', isDeletedAccount.length)
                    });
                } else {
                    console.log('发送删除请求完毕，等待服务器响应！');
                }
            } catch (error) {
                console.log('出现未知的情况：', error);
            }
        });
    });
    function getExecStrsForCkIndex (rawString = '', reg = /账号(.+?)【.+?】Cookie 已失效/g) {
        return rawString.split(reg).filter(i => (!isNaN(Number(i))));
    }
})();
