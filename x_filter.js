/**
 * Quantumult X - X 内容标记调试脚本 (保留原内容)
 */

const KEYWORDS = ['蓝v互关', '互关', '求互关', '互粉', '关注回关', '秒回关', '贬值', 'AI', '帮助', '收益']; 

let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);
        let instructions = obj.data?.home?.home_timeline_urt?.instructions || [];
        let hitCount = 0;

        instructions.forEach((instruction) => {
            if (instruction.type === "TimelineAddEntries") {
                instruction.entries.forEach((entry) => {
                    // 1. 定位 Tweet 核心层级
                    let result = entry.content?.itemContent?.tweet_results?.result;
                    if (!result) return;

                    // 处理特殊 typename
                    if (result.__typename === "TweetWithVisibilityResults") {
                        result = result.tweet;
                    }

                    // 2. 检查普通推文正文 (legacy.full_text)
                    if (result.legacy?.full_text) {
                        const matched = KEYWORDS.find(kw => result.legacy.full_text.includes(kw));
                        if (matched) {
                            console.log(`[X-Debug] 命中: ${matched}`);
                            // 在内容开头注入标记
                            result.legacy.full_text = `❌ 屏蔽命中 [${matched}] ❌\n${result.legacy.full_text}`;
                            hitCount++;
                        }
                    }

                    // 3. 检查长推文正文 (note_tweet)
                    if (result.note_tweet?.note_tweet_results?.result?.text) {
                        let noteText = result.note_tweet.note_tweet_results.result.text;
                        const matchedNote = KEYWORDS.find(kw => noteText.includes(kw));
                        if (matchedNote) {
                            console.log(`[X-Debug] 长推文命中: ${matchedNote}`);
                            // 标记长推文正文
                            result.note_tweet.note_tweet_results.result.text = `❌ 长推文屏蔽 [${matchedNote}] ❌\n${noteText}`;
                            
                            // 同时也更新一下 legacy 的预览图文本
                            if (result.legacy) {
                                result.legacy.full_text = `❌ 长推文屏蔽 [${matchedNote}] ❌\n${result.legacy.full_text}`;
                            }
                            hitCount++;
                        }
                    }
                });
            }
        });

        if (hitCount > 0) {
            console.log(`[X-Debug] 本次处理共标记了 ${hitCount} 条推文`);
        }
        
        body = JSON.stringify(obj);
    } catch (e) {
        console.log("[X-Debug] 解析异常: " + e);
    }
}

$done({ body });
