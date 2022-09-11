// ==UserScript==
// @name         bilibili 视频评论区关键字用户标签
// @namespace    com.bilibili.CustomizeCommentUserTag
// @version      1.0
// @description  B站评论区自定义标注用户标签，依据是动态里是否有关键字的相关内容（参考：https://greasyfork.org/zh-CN/scripts/450720-%E5%8E%9F%E7%A5%9E%E7%8E%A9%E5%AE%B6%E6%8C%87%E7%A4%BA%E5%99%A8）
// @author       tamshen(https://github.com/Tamshen)
// @match        https://www.bilibili.com/video/*
// @icon         https://static.hdslb.com/images/favicon.ico
// @connect      bilibili.com
// @grant        GM_xmlhttpRequest
// @license      MIT
// @run-at document-end
// ==/UserScript==


(function() {
    'use strict';
    //配置JSON 更细记得保存JSON
    const json = `
[
    {
        "keyword": [
            "明日方舟",
            "崩坏"
        ],
        "tga": "米哈游"
    },
    {
        "keyword": [
            "胡桃",
            "原神"
        ],
        "tga": "原神玩家"
    },
    {
        "keyword": [
            "抽奖测试11111"
        ],
        "tga": "抽奖用户"
    },
    {
        "keyword": [
            "汉服",
            "明制"
        ],
        "tga": "古风爱好者"
    }
]
`
    const fenge_text = '：' //分割符号 检测是否加载的符号 必须是特殊的 不能用于用户名的 建议(比如冒号、emoji等)：:
    const fenge_text_b = '#'
    const fenge_text_a = ''
    const fenge_text_key = ' '
    const fenge_text_key_b = '【'
    const fenge_text_key_a = '】'
    const time = 1200 // 测试800会过快 会赋值两次
    const unknown = new Set()
    const yuanyou = new Set()
    const no_yuanyou = new Set()
    const blog = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?&host_mid='
    const is_new = document.getElementsByClassName('item goback').length != 0 // 检测是不是新版



    const get_pid = (c) => {
        if (is_new) {
            return c.dataset['userId']
        } else {
            return c.children[0]['href'].replace(/[^\d]/g, "")
        }
    }

    const get_comment_list = () => {
        if (is_new) {
            let lst = new Set()
            for (let c of document.getElementsByClassName('user-name')) {
                lst.add(c)
            }
            for (let c of document.getElementsByClassName('sub-user-name')) {
                lst.add(c)
            }
            return lst
        } else {
            return document.getElementsByClassName('user')
        }
    }

    const ifkeyword = (c) => {
        let list = JSON.parse(json)
        //遍历第一次 循环
        let outdata = '';
        list.forEach(e_list => {
            //遍历第二次 检测
            //console.log(e_list)
            let tga_list = new Array();
            e_list.keyword.forEach(e_keyword => {
                //includes
                if (c.includes(e_keyword)) {
                    //console.log("包含关键字，给予tga：" + e_list.tga)
                    tga_list.push(e_list.tga)
                } else {
                    //console.log("not")
                }
            })
            //这里肯定会有重复的 需要去重 利用了Set结构不能接收重复数据的特点
            tga_list = new Set(tga_list);
            //赋值function
            for (var v of tga_list) {
                //console.log("用户的tga有：" + v)
                outdata += fenge_text_b + v + fenge_text_a + fenge_text_key
            }
        })
        //删掉只有一个标签的时候
        if(outdata){
            outdata = fenge_text_key_b + outdata.substring(0,outdata.length-fenge_text_key.length) + fenge_text_key_a
        }
        return outdata;
    }

    console.log(is_new)

    console.log("正常加载")

    let jiance = setInterval(()=>{
        let commentlist = get_comment_list()
        if (commentlist.length != 0){
            // clearInterval(jiance)
            commentlist.forEach(c => {
                let pid = get_pid(c)
                if (yuanyou.has(pid)) {
                    //检测有没有标签 重复检测
                    //console.log(c.textContent)
                    if (c.textContent.includes(fenge_text)){

                    }else{
                        c.append(ifkeyword(c.textContent) + '')
                    }
                    return
                } else if (no_yuanyou.has(pid)) {
                    // do nothing
                    return
                }
                unknown.add(pid)
                //console.log(pid)
                let blogurl = blog + pid
                // let xhr = new XMLHttpRequest()
                GM_xmlhttpRequest({
                    method: "get",
                    url: blogurl,
                    data: '',
                    headers:  {
                        'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
                    },
                    onload: function(res){
                        if(res.status === 200){
                            //console.log('成功')
                            let st = JSON.stringify(JSON.parse(res.response).data)
                            unknown.delete(pid)
                            //检测有没有标签
                            if (ifkeyword(st) != ""){
                                c.append(fenge_text + ifkeyword(st))
                                yuanyou.add(pid)
                            } else {
                                no_yuanyou.add(pid)
                            }
                        }else{
                            console.log('失败')
                            console.log(res)
                        }
                    },
                });
            });
        }
    }, time)
})();
