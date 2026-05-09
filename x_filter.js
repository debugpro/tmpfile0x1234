/**
 * Quantumult X - X (Twitter) For You Timeline Filter
 * 适配数据结构: data.home.home_timeline_urt
 */

const KEYWORDS = ['一模一样']; // 在此添加关键词

let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);
        let instructions = obj.data?.home?.home_timeline_urt?.instructions || [];
        let blockedCount = 0;

        instructions.forEach((instruction) => {
            if (instruction.type === "TimelineAddEntries") {
                instruction.entries = instruction.entries.filter((entry) => {
                    // 1. 提取推文正文 (普通推文或长推文)
                    let tweet = entry.content?.itemContent?.tweet_results?.result;
                    if (!tweet) return true;

                    // 处理被转推或带 Visibility 限制的情况
                    if (tweet.__typename === "TweetWithVisibilityResults") {
                        tweet = tweet.tweet;
                    }

                    let fullText = tweet.legacy?.full_text || "";
                    
                    // 2. 额外处理 Note Tweet (长推文) 的内容提取
                    if (tweet.note_tweet?.note_tweet_results?.result?.text) {
                        fullText += tweet.note_tweet.note_tweet_results.result.text;
                    }

                    // 3. 匹配关键词
                    if (fullText) {
                        const matchedKeyword = KEYWORDS.find(kw => fullText.includes(kw));
                        if (matchedKeyword) {
                            console.log(`[X-Filter] 屏蔽成功! 关键词: [${matchedKeyword}] 内容: ${fullText.substring(0, 30)}...`);
                            blockedCount++;
                            return false; // 过滤该 entry
                        }
                    }
                    return true;
                });
            }
        });

        if (blockedCount > 0) {
            console.log(`[X-Filter] 本次请求共屏蔽推文: ${blockedCount} 条`);
        }
        
        body = JSON.stringify(obj);
    } catch (e) {
        console.log("[X-Filter] JSON 解析失败，跳过处理");
    }
}

$done({ body });
