/**
 * Quantumult X - X (Twitter) 关键词替换脚本
 * 效果: 将命中推文替换为 *** [屏蔽名字: 关键词] ***
 */

const KEYWORDS = ['蓝v互关', '互关', '求互关', '互粉', '关注回关', '秒回关', '贬值', 'AI'];
// 预编译正则用于匹配
const REG_EX = new RegExp(KEYWORDS.join('|'), 'i');

let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);
        let instructions = obj.data?.home?.home_timeline_urt?.instructions || [];
        let hitTotal = 0;

        instructions.forEach((instruction) => {
            if (instruction.type === "TimelineAddEntries") {
                instruction.entries.forEach((entry) => {
                    let result = entry.content?.itemContent?.tweet_results?.result;
                    if (!result) return;

                    // 1. 剥离 Visibility 层级
                    if (result.__typename === "TweetWithVisibilityResults") result = result.tweet;

                    // 2. 提取文本用于检测
                    let text = result.legacy?.full_text || "";
                    if (result.note_tweet?.note_tweet_results?.result?.text) {
                        text += result.note_tweet.note_tweet_results.result.text;
                    }

                    // 3. 正则匹配判断
                    if (text) {
                        const match = text.match(REG_EX);
                        if (match) {
                            const matchedKeyword = match[0];
                            const userName = result.core?.user_results?.result?.legacy?.name || "未知用户";
                            const replacementText = `*** [屏蔽命中: ${matchedKeyword}] ***`;

                            console.log(`[X-Filter] 物理屏蔽成功: ${text}`);

                            // --- 执行改写逻辑 ---

                            // 修改普通文本字段
                            if (result.legacy) {
                                result.legacy.full_text = replacementText;
                                // 必须同步修正显示范围索引，否则会导致渲染截断/乱码
                                result.legacy.display_text_range = [0, replacementText.length];
                                // 清空实体（图片、链接、提到），防止前端在错误位置渲染附件
                                result.legacy.entities = { "hashtags": [], "symbols": [], "user_mentions": [], "urls": [], "media": [] };
                                if (result.legacy.extended_entities) delete result.legacy.extended_entities;
                            }

                            // 移除长推文对象，强制推特使用 legacy.full_text 渲染
                            if (result.note_tweet) delete result.note_tweet;
                            
                            // 移除卡片（如广告卡片、链接预览）
                            if (result.card) delete result.card;

                            hitTotal++;
                        }
                    }
                });
            }
        });

        if (hitTotal > 0) console.log(`[X-Filter] 本次请求共标记屏蔽推文: ${hitTotal} 条`);
        body = JSON.stringify(obj);
    } catch (e) {
        // 解析失败不处理
    }
}

$done({ body });
