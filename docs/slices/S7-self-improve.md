# Slice S7 — Self-Improve 闭环 + Polish

**Owner**: Engine + Eval
**前置依赖**: S0-S6 ✅
**预计**: 0.5 天

---

## 状态

- ✅ self_improve/collector — 样本收集
- ✅ self_improve/classifier — 正负样本分类
- ✅ self_improve/optimizer — LLM-as-Optimizer
- ✅ events.ts SampleClassifiedEvent

---

## 验收

- [ ] Self-Improve 闭环可手动触发
- [ ] 全 DSP 三层 Eval 绿
- [ ] tsc --noEmit + git tag s7-done
