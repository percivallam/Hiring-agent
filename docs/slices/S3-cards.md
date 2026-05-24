# Slice S3 — 10 类卡片 + 四态规范

**Owner**: UI Agent
**前置依赖**: S0(`s0-done` tag,`contracts/cards.ts` 已 locked)
**预计工期**: 1.5 天
**对应 PRD 章节**: Part 3.7(10 卡片定义)、Part 4(优雅失败的 UI 表达)

> ⚠️ 本 spec 是 UI Agent 的合同。卡片 props 不许擅自加字段,字段从 `contracts/cards.ts` 来,要改先 RFC。

---

## 1. 目标(一句话)

实现 **10 类卡片组件 C1-C10**,每张卡片支持 **四态**(Loading / Empty / Error / Demo),并能渲染 `actions[]` 触发用户意图。

> "演示型" demo 态是这个项目的精髓——给老板看的时候右上角有个小标识"演示数据",但视觉上要够惊艳。

---

## 2. 范围(In Scope)

- `src/components/cards/C1_CandidateList.tsx` ~ `C10_ClarifyGuide.tsx`(10 个文件)
- `src/components/cards/states/` — `LoadingSkeleton.tsx` / `EmptyHint.tsx` / `ErrorHint.tsx` / `DemoBadge.tsx`(共享态组件)
- `src/components/cards/index.ts` — `CardRenderer`(根据 `Card.type` 路由到对应组件)
- `src/dev/CardStorybook.tsx` — 一个独立路由 `/dev/cards`,把 10×4=40 个状态全摆出来
- `test/cards/*.test.tsx` — 每张卡片 ≥ 2 个快照测试(正常态 + 一个异常态)

---

## 3. 非范围(Out of Scope)

- ❌ 不接真实 Engine(用 mock data 渲染即可)
- ❌ 不实现路由跳转的目标页面(只触发 `onIntentTrigger` 回调,接由谁接 S4 再说)
- ❌ 不许改 `src/contracts/cards.ts`(要改先 RFC)
- ❌ 不引入复杂 UI 库(Tailwind + headless 已够,要加 shadcn 先问 Spec Owner)
- ❌ 不做暗色模式(Phase 2 再做)

---

## 4. 接口契约(必须遵守)

### 4.1 每张卡片的统一 Props

```ts
// 来自 src/contracts/cards.ts
import type { CardProps, CardState } from '../contracts/cards'

interface BaseCardProps<P> {
  payload: P                                    // 卡片专属数据
  state: CardState                              // 'ready' | 'loading' | 'empty' | 'error'
  hint?: string                                 // empty/error 时 LLM 给的解释文案
  isDemo?: boolean                              // true 时右上角显示"演示数据"标识
  actions?: Array<{ id: string; label: string; intent: string }>
  onIntentTrigger?: (intent: string) => void   // 用户点 action 时触发
}

// C1 示例:
export const C1_CandidateList: React.FC<BaseCardProps<C1Payload>> = (props) => { ... }
```

### 4.2 四态视觉规范(必须一致)

| 状态 | 视觉 | 文案来源 |
|---|---|---|
| `ready` | 正常渲染卡片内容 | payload |
| `loading` | 骨架屏(灰色块占位,微动画) | 无 |
| `empty` | 灰色插画 + LLM hint 文案 | props.hint |
| `error` | 浅红色边框 + 错误图标 + LLM hint 文案 + "重试"按钮 | props.hint |

> Demo 标识(右上角)是 **额外** 的,不替代以上四态。dev mode 下可全局切换显隐。

### 4.3 10 张卡片清单

| ID | 名称 | 触发场景(DSP) |
|---|---|---|
| C1 | 候选人列表卡 | DSP-2 找人 |
| C2 | 候选人画像卡 | DSP-2 详情 |
| C3 | 候选人对比卡 | DSP-2 对比 |
| C4 | 岗位卡 | DSP-1 / DSP-4 |
| C5 | 岗位画像建议卡 | DSP-1(库外岗位创建) |
| C6 | 市场分析卡 | DSP-1 / 通用 |
| C7 | 漏斗周报卡 | DSP-5 |
| C8 | 面试包卡 | DSP-4 |
| C9 | 记忆唤醒卡 | DSP-3(张三回访) |
| C10 | 引导澄清卡 | 通用(LLM 不确定时引导用户补充) |

---

## 5. 验收清单(Definition of Done)

- [ ] 10 个卡片组件齐备,props 符合 `BaseCardProps<P>` + 各自 payload 类型
- [ ] 四态全实现:每个卡片在 ready / loading / empty / error 四种 state 下都能正常渲染
- [ ] Demo 标识:`isDemo=true` 时右上角显示"演示数据"小标(dev mode 默认 true,prod 默认 false)
- [ ] `actions[]` 渲染为按钮,点击触发 `onIntentTrigger(intent)` 回调
- [ ] `CardRenderer` 根据 `Card.type` 正确路由到对应组件,未知类型走 fallback
- [ ] `/dev/cards` 路由可访问,40 个状态(10×4)肉眼可见
- [ ] 每张卡片 ≥ 2 个快照测试(`npx vitest run` 全绿)
- [ ] `tsc --noEmit` 零报错
- [ ] 投递 `S3-done` handoff

---

## 6. 参考示例

### 6.1 C1 候选人列表卡(ready 态)

```tsx
<C1_CandidateList
  state="ready"
  isDemo={true}
  payload={{
    candidates: [
      { id: 'res_001', name: '李雷', company: '字节', years: 6, match_score: 0.92 },
      { id: 'res_007', name: '张三', company: '阿里', years: 7, match_score: 0.88 },
    ],
    total: 12,
  }}
  actions={[
    { id: 'view_all', label: '查看全部 12 位', intent: 'list_more_candidates' },
    { id: 'compare', label: '对比 Top 3', intent: 'compare_top3' },
  ]}
  onIntentTrigger={(intent) => engine.chat({ message: intent, ... })}
/>
```

### 6.2 C1 empty 态(LLM hint)

```tsx
<C1_CandidateList
  state="empty"
  hint="没找到匹配候选人。建议:1) 放宽司龄至 3 年 2) 加入相邻技能栈"
  actions={[
    { id: 'relax', label: '放宽筛选', intent: 'relax_search' },
  ]}
/>
```

### 6.3 C9 记忆唤醒卡(DSP-3 杀手锏)

```tsx
<C9_MemoryRecall
  state="ready"
  payload={{
    candidate: { id: 'res_007', name: '张三' },
    last_interaction: '2025-11-20',
    last_status: '二面后流程暂停',
    suggestion: '当时因为薪酬未对齐流程暂停,现在新岗位预算上浮 15%,建议重新触达',
  }}
  actions={[
    { id: 'reopen', label: '重启流程', intent: 'reopen_candidate_res_007' },
    { id: 'reach', label: '生成触达话术', intent: 'gen_reach_res_007' },
  ]}
/>
```

> 这张卡片是 DSP-3 的视觉爆点,UI 要做出"AI 主动想起来"的感觉(轻微 pulse 动画 / 微金边)。

---

## 7. 开工自检

不要立刻写代码,先按 CLAUDE.md 启动仪式,在 `.handoff/2026-05-25-S3-kickoff.md` 回答:

1. 复述四态规范:你怎么理解 loading/empty/error/demo 的视觉差异
2. 10 张卡片的视觉风格统一方案:间距 / 圆角 / 阴影 / 字号 / 配色(给一个 Tailwind class 模板)
3. C5/C7/C8/C9 这 4 张"内容密度高"的卡片,你打算怎么布局,贴 ASCII 草图或低保真
4. CardRenderer 的路由实现方式(switch / map / dynamic import?)
5. 疑问 ≤ 5 条(重点:哪些 payload 字段不确定、哪些交互不确定)

Spec Owner 审完 → 放行。

---

## 8. 收尾仪式

```bash
npx vitest run && tsc --noEmit
# 手动 visual check: pnpm dev → 打开 http://localhost:5173/dev/cards
# 确认 40 个状态肉眼无误

git add src/components/cards/ src/dev/ test/cards/ STATE.md
git commit -m "S3: 10 cards × 4 states + storybook + 20+ snapshot tests"
git tag s3-done

cat > .handoff/$(date +%Y-%m-%d)-S3-done.md <<'EOF'
# S3 Done — 10 Cards Ready

From: UI Agent
To: Engine Agent / Spec Owner / 后续 S4 owner

## 交付
- C1-C10 全实现,四态全覆盖,demo 标识可切
- /dev/cards storybook 可访问
- 20+ 快照测试全绿

## 解锁
- DSP-1/2/3 可以接 ChatView 集成(S4 起)
- 业务方可以 review 视觉,提改进建议

## 已知 TODO
- 暗色模式 Phase 2
- (其他)
EOF
git add .handoff/ && git commit -m "handoff: S3 done"
```

---

## 9. Spec Owner 介入边界

| 问题类型 | 必须问 | 你自己定 |
|---|---|---|
| 卡片 payload 字段缺什么 | ✅(改契约要 RFC) | |
| 演示数据写什么 | ✅(产品决策) | |
| 四态文案统一规则 | ✅ | |
| Tailwind 配色 | | ✅(写进 design tokens) |
| 动画用 framer-motion 还是 CSS | | ✅ |

---

**一句话**:卡片是这个 demo 的脸,惊艳度 = UI Agent 的 KPI。但脸再漂亮,字段对不上 contracts 就是无效——契约第一,视觉第二。
