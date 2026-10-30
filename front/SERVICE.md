# Frontend service

## 责任

- 在主应用区域显示自包含的 AlphaTensor 演讲。
- 保留右侧 AI 对话、语言选择、设置入口和 `PageContextBridge`。
- 提供独立打开演讲的入口，支持演讲自身的目录、备注、计时和全屏功能。

## 演讲资源

`front/public/presentation/index.html` 由根目录 `scripts/build-presentation.mjs` 生成，不独立手工维护。演讲源码位于 `presentation/`，数学和页面检查位于 `scripts/verify-*.mjs`。

## 技术与运行

前端继续使用项目锁定的 React、TypeScript 和 Vite 依赖。依赖安装在 `front/node_modules/`，构建输出位于 `front/dist/`，二者均不提交。使用 `bash Saplingagent.sh` 启动完整应用，或在已有后端环境下运行 Vite。

## 验证

- `node scripts/build-presentation.mjs`
- `node scripts/verify-*.mjs`
- `cd front && npm run build`
- 使用 `page_read` 检查实际渲染页面

平台聊天和运行时接口定义继续以 `front/CONTRACT.md`、`front/DEPLOY.md` 和相关后端合同为准。
