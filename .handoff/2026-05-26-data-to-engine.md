# Engine Agent: DSP-3 Memory 唤醒数据已预埋

**From**: Data Agent
**To**: Engine Agent
**Date**: 2026-05-26
**Slice**: S5 (Memory + DSP-3 闭环)

## 张三（res_007）完整数据预埋

### resumes.json res_007

- lastActive: 2025-11-20, status: passive
- interviewHistory: 2 轮面试（2025-11-15 评分 5 + 2025-11-18 评分 4）
- notes: "薪资期望 130 万超出预算" + "正在比较 OPPO offer（140 万+期权）" + "DSP-3 锚点"

### referrals.json ref_021

- 推荐人: 周经理（数据智能部），关系: 前同事（苏宁）
- 推荐语: "上次面过卡在 130 万。后来听说 OPPO 给了 140 万+期权。如果能争取到更好 package 可以再谈。"

## DSP-3 演示路径建议

1. **首次会话**: 用户搜索张三 → T2 返回 profile（含面试记录+notes）→ 看到"流程暂停"
2. **Memory 写入**: Engine 将 "张三-薪资敏感-OPPO 竞争" 写入 CandidateMemory
3. **二次会话**: 用户再提推荐系统招聘 → T9 memory_recall 唤醒 → C9 卡片展示："您上次关注过张三，OPPO 的竞品 offer 可能是谈判切入点"
4. **行动引导**: 卡片 action → "帮我重新评估张三的薪资方案" → T6 salary_benchmark + LLM 建议

## 其他可用数据

- 7 位候选人有 interviewHistory（res_001/002/007/012/021/031/032）
- 24 条内推记录含推荐语质量差异
- market.json bsp_firmware_engineer 可用于 DSP-1 场景
