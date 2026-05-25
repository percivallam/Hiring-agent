# Slice S6 — DSP-4(壳) + DSP-5 闭环

**Owner**: Tools(demo) + UI + Eval
**前置依赖**: S0-S5 ✅
**预计**: 0.5 天

---

## 状态

- ✅ T11 interview_kit_prepare — demo mock
- ✅ T12 generate_report — real tool
- ✅ C8 面试包卡 (S3)
- ✅ C7 周报卡 (S3)

---

## DSP-4: 面试包壳

语料: "帮我准备张三的面试包"
预期: T11 → C8 面试包卡 (算法/系统设计/行为面试题 + 面试官备注)

## DSP-5: 周报洞察

语料: "这周招聘进展怎么样"
预期: T12 → C7 周报卡 (指标/漏斗/洞察 + 异常告警)

---

## 验收

- [ ] DSP-4 3/3 + DSP-5 3/3 路径回归
- [ ] tsc --noEmit + git tag s6-done
