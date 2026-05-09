/**
 * Quantumult X - X (Twitter) 关键词物理过滤脚本 (正式版)
 */

const KEYWORDS = ['蓝v互关', '互关', '求互关', '互粉', '关注回关', '秒回关', '贬值', 'AI'];
// 预编译正则，提高匹配效率
const REG_EX = new RegExp(KEYWORDS.join('|'), 'i');

let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);
        let instructions = obj.data?.home?.home_timeline_urt?.instructions || [];
        let blockedTotal = 0;

        instructions.forEach((instruction) => {
            if (instruction.type === "TimelineAddEntries") {
                const originalCount = instruction.entries.length;
                
                instruction.entries = instruction.entries.filter((entry) => {
                    let result = entry.content?.itemContent?.tweet_results?.result;
                    if (!result) return true;

                    // 剥离 Visibility 层级
                    if (result.__typename === "TweetWithVisibilityResults") result = result.tweet;

                    // 获取推文文本 (普通推文 + 长推文)
                    let text = result.legacy?.full_text || "";
                    if (result.note_tweet?.note_tweet_results?.result?.text) {
                        text += result.note_tweet.note_tweet_results.result.text;
                    }

                    // 正则匹配
                    if (text && REG_EX.test(text)) {
                        // console.log(`[X-Filter] 物理屏蔽成功: ${text.substring(0, 15)}...`);
                        return false; // 彻底从数组中删除
                    }
                    return true;
                });

                blockedTotal += (originalCount - instruction.entries.length);
            }
        });

        if (blockedTotal > 0) console.log(`[X-Filter] 本次请求物理屏蔽推文: ${blockedTotal} 条`);
        body = JSON.stringify(obj);
    } catch (e) {
        // 解析失败不处理，直接返回原包
    }
}

$done({ body });
