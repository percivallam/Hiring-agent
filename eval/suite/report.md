# HireAgent 评测报告

> 时间: 2026-05-27T18:34:48.472Z
> 模型: deepseek-chat
> 用例总数: 110

## 结论

总通过率 51.8% (57/110, 95% CI 42.6-60.9%)，门槛 90%。当前不建议作为真实可用 demo 放行。

## 总体结果

| 指标 | 值 | 95% CI | 阈值 | 状态 |
|------|-----|--------|------|------|
| 总通过率 | 51.8% (57/110) | 42.6-60.9% | 90% | ❌ |
| 意图召回率 | 82.0% (41/50) | 69.2-90.2% | 90% | ❌ |
| 参数准确率 | 89.3% (92/103) | 81.9-93.9% | 85% | ✅ |
| 卡片渲染稳定性 | 52.1% (49/94) | 42.1-61.9% | 95% | ❌ |
| 动作稳定性 | 40.0% (4/10 groups) | 16.8-68.7% | 85% | ❌ |
| 无crash率 | 90.9% (100/110) | 84.1-95.0% | 99% | ❌ |

## 维度分解

| 维度 | 通过 | 总数 | 通过率 | 95% CI |
|------|------|------|--------|--------|
| intent_recall | 18 | 50 | 36.0% | 24.1-49.9% |
| action_stability | 22 | 30 | 73.3% | 55.6-85.8% |
| multi_turn | 4 | 10 | 40.0% | 16.8-68.7% |
| card_render | 13 | 20 | 65.0% | 43.3-81.9% |

## 意图分解

| 意图 | 通过 | 总数 | 通过率 | 标记 |
|------|------|------|--------|------|
| analyze_candidate_risk | 4 | 6 | 66.7% | weak_slice |
| analyze_pipeline | 4 | 7 | 57.1% | weak_slice |
| analyze_team | 3 | 6 | 50.0% | weak_slice |
| compare_candidates | 6 | 8 | 75.0% | weak_slice |
| decision_brief | 0 | 1 | 0.0% | weak_slice |
| dsp1_chain | 0 | 1 | 0.0% | weak_slice |
| dsp1_fallback | 2 | 4 | 50.0% | weak_slice |
| emoji_input | 0 | 1 | 0.0% | weak_slice |
| empty_input | 1 | 1 | 100.0% |  |
| generate_interview_questions | 1 | 7 | 14.3% | weak_slice |
| generate_message_template | 5 | 7 | 71.4% | weak_slice |
| get_candidate_profile | 6 | 7 | 85.7% |  |
| get_job_detail | 1 | 3 | 33.3% | weak_slice |
| invalid_id | 1 | 1 | 100.0% |  |
| job_advice | 0 | 1 | 0.0% | weak_slice |
| jobs_then_pipeline_then_advice | 0 | 1 | 0.0% | weak_slice |
| list_jobs | 0 | 6 | 0.0% | weak_slice |
| long_repeat_input | 1 | 1 | 100.0% |  |
| market_analysis | 1 | 4 | 25.0% | weak_slice |
| market_then_salary_then_advice | 1 | 1 | 100.0% |  |
| memory_recall_then_update | 0 | 1 | 0.0% | weak_slice |
| multi_intent | 0 | 1 | 0.0% | weak_slice |
| out_of_scope | 1 | 2 | 50.0% | weak_slice |
| pipeline_risk_triage | 0 | 1 | 0.0% | weak_slice |
| pipeline_then_detail_then_candidates | 0 | 1 | 0.0% | weak_slice |
| privacy_exfiltration | 1 | 1 | 100.0% |  |
| profile_then_risk_then_interview | 1 | 1 | 100.0% |  |
| salary_benchmark | 7 | 7 | 100.0% |  |
| salary_benchmark_empty | 1 | 1 | 100.0% |  |
| search_and_salary | 0 | 1 | 0.0% | weak_slice |
| search_candidates | 5 | 11 | 45.5% | weak_slice |
| search_extreme | 1 | 1 | 100.0% |  |
| search_then_detail_then_compare | 1 | 1 | 100.0% |  |
| search_then_profile_then_reach | 0 | 1 | 0.0% | weak_slice |
| search_then_salary_then_offer | 1 | 1 | 100.0% |  |
| self_intro | 1 | 1 | 100.0% |  |
| team_then_search_then_compare | 0 | 1 | 0.0% | weak_slice |
| unsafe_discrimination | 0 | 1 | 0.0% | weak_slice |
| unsupported_scheduling | 0 | 1 | 0.0% | weak_slice |

## 失败用例 (53)

| ID | 意图 | 问题 | 详情 |
|-----|------|------|------|
| IR02 | search_candidates | 有没有做过千万DAU推荐系统的高级工程师... | CARD_MISS: expected [candidate_list] got []; NO_TEXT; CRASH |
| IR03 | search_candidates | 找个既懂Go又懂Flink还做过实时计算的人... | CARD_MISS: expected [candidate_list] got [market_analysis,salary_benchmark,quick_actions] |
| IR04 | search_candidates | 搜一下大模型应用开发的候选人... | CARD_MISS: expected [candidate_list] got []; NO_TEXT; CRASH |
| IR05 | search_candidates | 我想看看有没有从字节跳动出来的后端架构师... | CARD_MISS: expected [candidate_list] got []; NO_TEXT; CRASH |
| IR06 | compare_candidates | 张明远和李雨桐谁更适合推荐算法岗位... | CARD_MISS: expected [comparison] got [] |
| IR08 | compare_candidates | 这两个人各有什么优劣势，帮我分析下... | TOOL_MISS: expected [compare_candidates] got [list_jobs,search_candidates,search_candidates]; PARAM_MISS: expected required params for [compare_candidates] got [{"tool":"list_jobs","args":{}},{"tool":"search_candidates","args":{"query":"候选人"}},{"tool":"search_candidates","args":{"query":"推荐算法 工程师"}}]; CARD_MISS: expected [comparison] got [] |
| IR09 | analyze_pipeline | 目前招聘进展怎么样... | CARD_MISS: expected [pipeline_overview] got [] |
| IR10 | analyze_pipeline | 哪些岗位的招聘卡住了... | CARD_MISS: expected [pipeline_overview] got [] |
| IR11 | analyze_pipeline | 推荐算法岗的pipeline到哪一步了... | CARD_MISS: expected [pipeline_overview] got [] |
| IR15 | market_analysis | 推荐方向的人才市场什么情况... | CARD_MISS: expected [market_analysis] got [] |
| IR16 | market_analysis | 大模型工程师现在好招吗... | CARD_MISS: expected [market_analysis] got []; NO_TEXT; CRASH |
| IR18 | list_jobs | 现在有哪些在招的岗位... | CARD_MISS: expected [jd_card] got [] |
| IR19 | list_jobs | 看看我们团队目前开放的HC... | CARD_MISS: expected [jd_card] got [] |
| IR22 | get_candidate_profile | 那个从美团来的做搜索的候选人，详细看看... | TOOL_MISS: expected [search_candidates,get_candidate_profile] got [search_candidates,search_candidates,search_candidates,search_candidates,search_candidates,list_jobs,market_analysis,salary_benchmark,market_analysis,salary_benchmark]; PARAM_MISS: expected required params for [search_candidates,get_candidate_profile] got [{"tool":"search_candidates","args":{"query":"美团 搜索"}},{"tool":"search_candidates","args":{"company":"美团","skills":["搜索","搜索引擎","搜索推荐"]}},{"tool":"search_candidates","args":{"query":"搜索算法 搜索引擎","company":"美团"}},{"tool":"search_candidates","args":{"query":"搜索 排序 召回"}},{"tool":"search_candidates","args":{"query":"搜索"}},{"tool":"list_jobs","args":{}},{"tool":"market_analysis","args":{"role":"搜索算法工程师"}},{"tool":"salary_benchmark","args":{"role":"搜索算法工程师"}},{"tool":"market_analysis","args":{"role":"search_engineer"}},{"tool":"salary_benchmark","args":{"role":"search_engineer"}}]; CARD_MISS: expected [profile_card] got []; NO_TEXT; CRASH |
| IR24 | get_job_detail | 大模型应用开发岗的具体要求... | CARD_MISS: expected [jd_card] got [] |
| IR26 | generate_message_template | 给李四发个拒信，语气委婉一点... | TOOL_MISS: expected [generate_message_template] got [search_candidates,list_jobs]; PARAM_MISS: expected required params for [generate_message_template] got [{"tool":"search_candidates","args":{"query":"李四"}},{"tool":"list_jobs","args":{}}]; CARD_MISS: expected [message_template] got [] |
| IR27 | generate_message_template | 写一个触达消息给陈晓，想挖他过来... | TOOL_MISS: expected [generate_message_template] got [search_candidates,list_jobs,market_analysis,market_analysis,market_analysis,market_analysis]; PARAM_MISS: expected required params for [generate_message_template] got [{"tool":"search_candidates","args":{"query":"陈晓"}},{"tool":"list_jobs","args":{}},{"tool":"market_analysis","args":{"role":"推荐算法工程师"}},{"tool":"market_analysis","args":{"role":"大模型应用开发工程师"}},{"tool":"market_analysis","args":{"role":"recommendation_engineer"}},{"tool":"market_analysis","args":{"role":"llm_engineer"}}]; CARD_MISS: expected [message_template] got [market_analysis,market_analysis,quick_actions] |
| IR28 | generate_interview_questions | 帮我出几道系统设计的面试题，针对推荐算法岗... | CARD_MISS: expected [interview_questions] got [] |
| IR30 | generate_interview_questions | 出一套算法+行为面试的混合题目... | TOOL_MISS: expected [generate_interview_questions] got [list_jobs,analyze_team,salary_benchmark,salary_benchmark,salary_benchmark]; PARAM_MISS: expected required params for [generate_interview_questions] got [{"tool":"list_jobs","args":{}},{"tool":"analyze_team","args":{}},{"tool":"salary_benchmark","args":{"role":"算法工程师"}},{"tool":"salary_benchmark","args":{"role":"recommendation_engineer"}},{"tool":"salary_benchmark","args":{"role":"llm_engineer"}}]; CARD_MISS: expected [interview_questions] got [] |
| IR32 | analyze_candidate_risk | 李雨桐跳槽频率高吗，有什么隐患... | TOOL_MISS: expected [analyze_candidate_risk] got [search_candidates,get_candidate_profile]; PARAM_MISS: expected required params for [analyze_candidate_risk] got [{"tool":"search_candidates","args":{"query":"李雨桐"}},{"tool":"get_candidate_profile","args":{"candidate_id":"res_002"}}]; CARD_MISS: expected [risk_analysis] got [] |

## 延迟

| 指标 | 值 |
|------|-----|
| p50 | 15.1s |
| p95 | 45.4s |
| max | 89.4s |
| p95门槛 | 15.0s |
