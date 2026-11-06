# AI 如何发现更快的矩阵乘法

这是一个面向约 19 分钟课堂展示的中文交互式 HTML 演讲项目，共 22 页，建议讲解时间 18 分 45 秒。内容从晶体管、寄存器和矩阵乘法的硬件直觉出发，逐步讲解 Strassen、AlphaTensor 与 AlphaEvolve，并用笔记本算例、同一组 4×4 矩阵和大矩阵递归曲线展示算法计算量的差异。

演讲既可以作为离线单文件使用，也已经嵌入 Saplingagent 页面，便于一边预览、一边通过右侧 AI 对话继续修改。

## 直接使用

- 离线演讲：[矩阵与AI-20分钟演讲.html](矩阵与AI-20分钟演讲.html)（保留兼容文件名，当前内容约 19 分钟）
- 应用内演讲：运行 `bash Saplingagent.sh`，演讲显示在主区域
- 演讲源码：`presentation/`
- 应用内静态副本：`front/public/presentation/index.html`

演讲快捷键：

- `←` / `→`：翻页
- `F`：全屏
- `N`：显示或隐藏演讲备注
- `O`：打开目录
- `T`：开始或暂停计时
- `R`：重置当前页动画

## AlphaTensor 分步图解（第 9–15 页）

原第 9 页现拆为七页，建议按顺序讲解：

1. 完整路线：输入组合 → 一次乘法 → 输出分配。
2. 从同一组 A、B 中按第 2 项的规则取数，得到 L₂、R₂。
3. 一次乘法 p₂ = 1 × 1 = 1，复用到两个输出。
4. 对照前后矩阵，解释 C₁₄ 的 0→1 与 C₂₁ 的 1→0。
5. 播放、单步或拖动 47 项，核对完整输出。
6. 检查全部 4096 个系数，说明对任意二进制输入成立。
7. 用状态、动作与终点流程解释 AI 如何搜索固定规则。

第 13 页可点击“第 1 项”“第 2 项”“完整结果”，或拖动滑块；翻页自动暂停播放。图形、样式和数据都嵌入离线 HTML，无需联网加载。详细来源见 `presentation/REFERENCES.md`。

## 构建与验证

构建只使用 Node.js 内置模块：

```bash
node scripts/build-presentation.mjs
```

该命令会同步生成：

- `dist/slides.html`
- `矩阵与AI-20分钟演讲.html`
- `front/public/presentation/index.html`

数学、数据和页面结构验证：

```bash
node scripts/verify-ai-focus.mjs
node scripts/verify-comparison.mjs
node scripts/verify-hardware-lesson.mjs
node scripts/verify-register-physics.mjs
node scripts/verify-strassen-derivation.mjs
cd front && npm run build
```

## 内容口径

- 在统一的 **4×4、模 2** 条件下，直接法、Strassen 和 AlphaTensor 的标量乘法次数分别为 **64 / 49 / 47**。
- AlphaTensor 相比直接法减少 17 次乘法，即 **26.56%**；相比 Strassen 减少 2 次，即 **4.08%**。
- 加法、数据搬运、并行度和具体硬件都会影响真实耗时，因此乘法次数减少不能直接等同于运行时间减少。
- 页面执行作者公开的 rank-47 分解，不在浏览器中训练 AlphaTensor。
- AlphaEvolve 的相关结果采用不同数域与计数设定，演讲中不会与模 2 的 47 次结论直接混比。

## 目录

```text
presentation/                         演讲模板、样式和动画源码
dist/                                 静态教程、算法数据和演讲构建结果
scripts/build-presentation.mjs        演讲构建入口
scripts/verify-*.mjs                  数学与内容验证
front/features/alpha-tensor-presentation/  应用内演讲容器
front/public/presentation/            应用内静态演讲
docs/                                 项目说明与引用
矩阵与AI-20分钟演讲.html              可离线打开的完整单文件演讲
```

Saplingagent 运行内核、AI 对话和本地配置仍保留在本项目中，但不是演讲主题本身。本地凭据、会话、日志、依赖、缓存和原生应用不会提交到仓库。

## 来源与许可

主要论文和官方技术资料见 [docs/references.html](docs/references.html)。AlphaTensor 公开分解数据的 Apache 2.0 许可保存在 `dist/alphatensor-LICENSE.txt`，并嵌入离线演讲。项目自有代码与文档遵循仓库中的 MIT `LICENSE` 和 `NOTICE`。

目标仓库：<https://github.com/secreat14/AlphaEvolve-saplingagent-ppt>
