console.log("--- [X-Filter] 脚本已启动 ---");
const KEYWORDS = ['人','帮助','收益','加密']; // 在此添加关键词
const REPLACEMENT = "@@@@@@@@ 屏蔽成功 @@@@@@@@";

let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);
        let instructions = obj.data?.home?.home_timeline_urt?.instructions || [];
        let hitCount = 0;

        instructions.forEach((instruction) => {
            if (instruction.type === "TimelineAddEntries") {
                instruction.entries.forEach((entry) => {
                    // 1. 定位 Tweet 核心数据结构
                    let result = entry.content?.itemContent?.tweet_results?.result;
                    if (!result) return;

                    // 处理带 Visibility 限制的特殊层级
                    if (result.__typename === "TweetWithVisibilityResults") {
                        result = result.tweet;
                    }

                    // 2. 检查普通推文正文 (legacy.full_text)
                    if (result.legacy?.full_text) {
                        const matched = KEYWORDS.find(kw => result.legacy.full_text.includes(kw));
                        if (matched) {
                            console.log(`[X-Debug] 命中关键词 [${matched}]，执行内容替换`);
                            result.legacy.full_text = REPLACEMENT;
                            hitCount++;
                        }
                    }

                    // 3. 检查长推文正文 (note_tweet)
                    if (result.note_tweet?.note_tweet_results?.result?.text) {
                        const noteText = result.note_tweet.note_tweet_results.result.text;
                        const matchedNote = KEYWORDS.find(kw => noteText.includes(kw));
                        if (matchedNote) {
                            console.log(`[X-Debug] 长推文命中 [${matchedNote}]，执行内容替换`);
                            result.note_tweet.note_tweet_results.result.text = REPLACEMENT;
                            // 同时也建议改一下预览文本
                            if(result.legacy) result.legacy.full_text = REPLACEMENT;
                            hitCount++;
                        }
                    }
                });
            }
        });

        if (hitCount > 0) {
            console.log(`[X-Debug] 本次响应共处理并替换了 ${hitCount} 条内容`);
        }
        
        body = JSON.stringify(obj);
    } catch (e) {
        console.log("[X-Debug] 解析或处理出错: " + e);
    }
}

$done({ body });
