# HireAgent 评测报告

> 时间: 2026-05-27T15:02:28.927Z
> 模型: deepseek-chat
> 用例总数: 100

## 总体结果

| 指标 | 值 | 阈值 | 状态 |
|------|-----|------|------|
| 总通过率 | 61.0% (61/100) | 90% | ❌ |
| 意图召回率 | 87.5% (35/40) | 90% | ❌ |
| 卡片渲染稳定性 | N/A% (0/0) | 95% | ❌ |
| 动作稳定性 | 30.0% (3/10 groups) | 85% | ❌ |
| 无crash率 | 96.0% | 99% | ❌ |

## 维度分解

| 维度 | 通过 | 总数 | 通过率 |
|------|------|------|--------|
| intent_recall | 24 | 40 | 60.0% |
| action_stability | 16 | 30 | 53.3% |
| multi_turn | 6 | 10 | 60.0% |
| card_render | 15 | 20 | 75.0% |

## 失败用例 (39)

| ID | 意图 | 问题 | 详情 |
|-----|------|------|------|
| IR03 | search_candidates | 找个既懂Go又懂Flink还做过实时计算的人... | CARD_MISS: expected [candidate_list] got []; NO_TEXT; CRASH |
| IR04 | search_candidates | 搜一下大模型应用开发的候选人... | CARD_MISS: expected [candidate_list] got []; NO_TEXT; CRASH |
| IR08 | compare_candidates | 这两个人各有什么优劣势，帮我分析下... | TOOL_MISS: expected [compare_candidates] got [search_candidates,list_jobs]; CARD_MISS: expected [comparison] got [] |
| IR10 | analyze_pipeline | 哪些岗位的招聘卡住了... | CARD_MISS: expected [pipeline_overview] got [] |
| IR11 | analyze_pipeline | 推荐算法岗的pipeline到哪一步了... | CARD_MISS: expected [pipeline_overview] got [] |
| IR15 | market_analysis | 推荐方向的人才市场什么情况... | CARD_MISS: expected [market_analysis] got [] |
| IR16 | market_analysis | 大模型工程师现在好招吗... | CARD_MISS: expected [market_analysis] got []; NO_TEXT; CRASH |
| IR18 | list_jobs | 现在有哪些在招的岗位... | CARD_MISS: expected [jd_card] got [] |
| IR19 | list_jobs | 看看我们团队目前开放的HC... | CARD_MISS: expected [jd_card] got [] |
| IR24 | get_job_detail | 大模型应用开发岗的具体要求... | CARD_MISS: expected [jd_card] got [] |
| IR26 | generate_message_template | 给李四发个拒信，语气委婉一点... | TOOL_MISS: expected [generate_message_template] got [search_candidates,list_jobs] |
| IR27 | generate_message_template | 写一个触达消息给陈晓，想挖他过来... | TOOL_MISS: expected [generate_message_template] got [search_candidates,list_jobs,market_analysis] |
| IR30 | generate_interview_questions | ... | ERROR: The operation was aborted due to timeout |
| IR32 | analyze_candidate_risk | 李雨桐跳槽频率高吗，有什么隐患... | TOOL_MISS: expected [analyze_candidate_risk] got [search_candidates,get_candidate_profile]; CARD_MISS: expected [risk_analysis] got [] |
| IR34 | analyze_team | 团队缺什么能力，需要补什么人... | CARD_MISS: expected [team_diagnosis] got [] |
| IR36 | self_intro | 你是谁，你能做什么... | CARD_MISS: expected [quick_actions] got [] |
| AS01c | search_candidates | 帮我找推荐算法的人... | CARD_MISS: expected [candidate_list] got [] |
| AS02c | compare_candidates | 张明远和李雨桐谁更合适... | CARD_MISS: expected [comparison] got [] |
| AS03a | analyze_pipeline | 目前招聘进展怎么样... | CARD_MISS: expected [pipeline_overview] got [] |
| AS03b | analyze_pipeline | 目前招聘进展怎么样... | CARD_MISS: expected [pipeline_overview] got [] |

## 延迟

| 指标 | 值 |
|------|-----|
| p50 | 17.0s |
| p95 | 42.3s |
| max | 87.1s |
