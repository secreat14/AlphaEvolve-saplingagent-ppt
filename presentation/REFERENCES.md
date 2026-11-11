# AlphaTensor 分步说明来源

任务：`TASK-20261105-001`；模块：`presentation/`。第 9–15 页只回放已公开分解，不训练 AI；特定 47 项适用于模 2，不能原样用于普通整数矩阵乘法，也不宣称全局最优或实测加速。

| 资料 | 官方链接与机构 | 用途 | 权限 | 版本 | 最后核对 |
| --- | --- | --- | --- | --- | --- |
| AlphaTensor 官方介绍 | [Google DeepMind](https://deepmind.google/blog/discovering-novel-algorithms-with-alphatensor/) | 单人张量游戏、动作、终点、强化学习与算法发现 | 公开，无需登录 | 2022-10-05 文章 | 2026-11-05，可访问 |
| 公开分解 | [Google DeepMind 作者仓库](https://github.com/google-deepmind/alphatensor) | 作者数据、来源与 Apache 2.0 许可；本地固定版本保存在 `dist/alpha47.js` | 公开，无需登录 | `1949163da3bef7e3eb268a3ac015fd1c2dbfc767`，`algorithms/factorizations_f2.npz` | 2026-11-05，仓库可访问；本地分解经全部 4096 个系数核对 |
| AlphaTensor 论文 | [Nature DOI](https://doi.org/10.1038/s41586-022-05172-4) | 原论文入口，2022 年成果与定义 | 本次工具访问被重定向至 Nature 身份入口，未重新获取全文 | Fawzi 等，Nature 610 (2022) | 2026-11-05，正文访问受限；搜索说明采用可访问的官方介绍，不补写未经核对的细节 |
| 课堂 Demo Notebook | [项目 GitHub 固定版本](https://github.com/secreat14/AlphaEvolve-saplingagent-ppt/blob/6f4ecc89588fcd84b87403b9ee08024e6b6775e0/alphatensor_demo.ipynb) | 最新 main 中的矩阵计算、系数验证、三算法成本图和 NumPy 对照，任务为 `TASK-20261110-002` | 公开仓库，可通过 Git 获取 | `6f4ecc89588fcd84b87403b9ee08024e6b6775e0` | 2026-11-10，通过 git fetch 与 git show 核对文件，执行全部六个代码单元通过 |

本地教学依据：`alphatensor_demo.ipynb`，特别是第 2 项、`coefficient_errors` 和成本计数。讲稿中的数学例子由固定分解计算得到；第 7、13 项在 C₁₂ 中对 A₁₁B₃₁ 的两次贡献在模 2 下抵消。系数检查证明任意二进制输入的恒等式；单个算例的 47 项播放只演示执行过程。

`alpha-explainer.js` 读取现有 `ALPHATENSOR_47`、`MatrixCompareMath` 和 `AiFocusModel`，生成矩阵选取、输出前后状态、累计动画、剩余张量计数及正确性统计；图形由 HTML/CSS/内联 SVG 表达，随三个演讲产物一起离线内嵌。UI 运行无需访问上述外链。
