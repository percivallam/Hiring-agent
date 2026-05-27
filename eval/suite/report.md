# HireAgent 评测报告

> 时间: 2026-05-27T14:27:31.153Z
> 模型: deepseek-chat
> 用例总数: 100

## 总体结果

| 指标 | 值 | 阈值 | 状态 |
|------|-----|------|------|
| 总通过率 | 61.0% (61/100) | 90% | ❌ |
| 意图召回率 | 85.0% (34/40) | 90% | ❌ |
| 卡片渲染稳定性 | N/A% (0/0) | 95% | ❌ |
| 动作稳定性 | 40.0% (4/10 groups) | 85% | ❌ |
| 无crash率 | 94.0% | 99% | ❌ |

## 维度分解

| 维度 | 通过 | 总数 | 通过率 |
|------|------|------|--------|
| intent_recall | 21 | 40 | 52.5% |
| action_stability | 19 | 30 | 63.3% |
| multi_turn | 6 | 10 | 60.0% |
| card_render | 15 | 20 | 75.0% |

## 失败用例 (39)

| ID | 意图 | 问题 | 详情 |
|-----|------|------|------|
| IR02 | search_candidates | 有没有做过千万DAU推荐系统的高级工程师... | CARD_MISS: expected [candidate_list] got []; NO_TEXT; CRASH |
| IR03 | search_candidates | 找个既懂Go又懂Flink还做过实时计算的人... | CARD_MISS: expected [candidate_list] got []; NO_TEXT; CRASH |
| IR05 | search_candidates | 我想看看有没有从字节跳动出来的后端架构师... | CARD_MISS: expected [candidate_list] got [market_analysis,salary_benchmark] |
| IR08 | compare_candidates | 这两个人各有什么优劣势，帮我分析下... | TOOL_MISS: expected [compare_candidates] got [list_jobs]; CARD_MISS: expected [comparison] got [] |
| IR10 | analyze_pipeline | 哪些岗位的招聘卡住了... | CARD_MISS: expected [pipeline_overview] got [] |
| IR18 | list_jobs | 现在有哪些在招的岗位... | CARD_MISS: expected [jd_card] got [] |
| IR19 | list_jobs | 看看我们团队目前开放的HC... | CARD_MISS: expected [jd_card] got [] |
| IR22 | get_candidate_profile | 那个从美团来的做搜索的候选人，详细看看... | CARD_MISS: expected [profile_card] got [market_analysis,salary_benchmark] |
| IR24 | get_job_detail | 大模型应用开发岗的具体要求... | CARD_MISS: expected [jd_card] got [] |
| IR25 | generate_message_template | ... | ERROR: The operation was aborted due to timeout |
| IR26 | generate_message_template | 给李四发个拒信，语气委婉一点... | TOOL_MISS: expected [generate_message_template] got [search_candidates,list_jobs]; CARD_MISS: expected [message_template] got [] |
| IR27 | generate_message_template | 写一个触达消息给陈晓，想挖他过来... | TOOL_MISS: expected [generate_message_template] got [search_candidates]; CARD_MISS: expected [message_template] got [] |
| IR28 | generate_interview_questions | 帮我出几道系统设计的面试题，针对推荐算法岗... | CARD_MISS: expected [interview_questions] got [jd_card] |
| IR29 | generate_interview_questions | 给张明远准备一套面试题，难度中等... | CARD_MISS: expected [interview_questions] got [] |
| IR30 | generate_interview_questions | 出一套算法+行为面试的混合题目... | TOOL_MISS: expected [generate_interview_questions] got [list_jobs,get_job_detail,market_analysis,market_analysis]; CARD_MISS: expected [interview_questions] got [] |
| IR32 | analyze_candidate_risk | 李雨桐跳槽频率高吗，有什么隐患... | TOOL_MISS: expected [analyze_candidate_risk] got [search_candidates,get_candidate_profile]; CARD_MISS: expected [risk_analysis] got [] |
| IR34 | analyze_team | 团队缺什么能力，需要补什么人... | CARD_MISS: expected [team_diagnosis] got [] |
| IR36 | self_intro | 你是谁，你能做什么... | CARD_MISS: expected [quick_actions] got [] |
| IR38 | dsp1_fallback | 帮我找BSP固件工程师... | NO_TEXT; CRASH |
| AS05a | list_jobs | 现在有哪些在招的岗位... | CARD_MISS: expected [jd_card] got [] |

## 延迟

| 指标 | 值 |
|------|-----|
| p50 | 16.6s |
| p95 | 50.5s |
| max | 63.0s |
