# AlphaTensor 演讲前端

主页面在应用区域嵌入 21 页《AI 如何发现更快的矩阵乘法》演讲，并保留右侧 Saplingagent AI 对话、语言选择、设置入口和页面检查桥接。

演讲 iframe 内右上角的“中文 / English”菜单切换页面、动态说明与讲稿。语言选择保存在浏览器中，切换时保留当前演示状态。英文目录位于根目录 `presentation/locales/en.json`。

## 关键文件

- `App.tsx`：挂载演讲应用。
- `features/alpha-tensor-presentation/AlphaTensorPresentation.tsx`：演讲容器和独立打开入口。
- `public/presentation/index.html`：由根目录构建脚本生成的自包含演讲。
- `styles.css`：应用演讲容器样式。

## 构建

先在项目根目录运行 `node scripts/build-presentation.mjs` 同步演讲，再运行：

```bash
cd front
npm run build
```

聊天、设置和页面检查仍使用现有 Saplingagent 前端合同；演讲本身不新增后端 API。
