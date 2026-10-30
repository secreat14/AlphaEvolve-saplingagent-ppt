import { ExternalLink, Presentation } from 'lucide-react';

const presentationUrl = '/presentation/index.html?v=14-slides';

export function AlphaTensorPresentation() {
  return <section className="presentation-workspace" aria-labelledby="presentation-title">
    <header className="presentation-workspace-header">
      <div className="presentation-workspace-title">
        <span className="presentation-workspace-icon" aria-hidden="true"><Presentation size={16} /></span>
        <div>
          <span>课程演讲</span>
          <h1 id="presentation-title">AI 如何发现更快的矩阵乘法</h1>
        </div>
      </div>
      <a href={presentationUrl} target="_blank" rel="noopener noreferrer">
        独立打开
        <ExternalLink size={13} aria-hidden="true" />
      </a>
    </header>
    <iframe
      className="presentation-frame"
      src={presentationUrl}
      title="矩阵与 AI：12 分钟演讲"
      allow="fullscreen"
      allowFullScreen
    />
  </section>;
}
