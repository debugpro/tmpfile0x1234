/**
 * Quantumult X - X (Twitter) 关键词替换脚本
 * 效果: 将命中推文替换为 *** [屏蔽命中: 关键词] ***，并清理引用内容
 */

const KEYWORDS = ['蓝v互关', '蓝V互关', '互关', '求互关', '互粉', '关注回关', '秒回关'];
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

                    // 2. 提取文本用于检测 (合并普通推文和长推文)
                    let text = result.legacy?.full_text || "";
                    if (result.note_tweet?.note_tweet_results?.result?.text) {
                        text += result.note_tweet.note_tweet_results.result.text;
                    }

                    // 3. 正则匹配判断
                    if (text) {
                        const match = text.match(REG_EX);
                        if (match) {
                            const matchedKeyword = match[0];
                            const replacementText = `⚠️ [屏蔽命中: ${matchedKeyword}] ⚠️`;

                            //console.log(`[X-Filter] 物理屏蔽成功: ${text}`);

                            // --- 执行改写逻辑 ---

                            // A. 修改核心文本
                            if (result.legacy) {
                                result.legacy.full_text = replacementText;
                                result.legacy.display_text_range = [0, replacementText.length];
                                
                                // B. 清理媒体与附件实体 (防止图片和链接预览残留)
                                result.legacy.entities = { "hashtags": [], "symbols": [], "user_mentions": [], "urls": [], "media": [] };
                                if (result.legacy.extended_entities) delete result.legacy.extended_entities;
                                
                                // C. 【新增】清理引用推文逻辑
                                // 彻底删除引用推文的对象，防止下方挂着一个被引用的卡片
                                if (result.legacy.is_quote_status) {
                                    result.legacy.is_quote_status = false;
                                    if (result.quoted_status_result) delete result.quoted_status_result;
                                }
                            }

                            // D. 清理长推文渲染对象
                            if (result.note_tweet) delete result.note_tweet;
                            
                            // E. 清理其他卡片对象 (如广告卡片、链接预览卡片)
                            if (result.card) delete result.card;

                            hitTotal++;
                        }
                    }
                });
            }
        });

        if (hitTotal > 0) console.log(`[X-Filter] 本次响应共标记屏蔽推文: ${hitTotal} 条`);
        body = JSON.stringify(obj);
    } catch (e) {
        // 解析失败不处理
    }
}

$done({ body });
