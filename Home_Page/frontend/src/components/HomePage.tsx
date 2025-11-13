import React, { useEffect, useMemo, useState } from 'react';

export type HomePageProps = {
  onNavigate?: (path: string) => void;
  onLoginRequired?: () => void;
  onError?: (error: Error) => void;
};

type Metadata = {
  logoText: string;
  welcomeText: string;
  serviceHours: string;
  officialSafetyTip: string;
  friendLinks: { name: string; url: string }[];
  compliance: { policeRecord: string; icpRecord: string };
  accessibility: { elderlyServiceEntry: string; description: string };
};

const FALLBACK_METADATA: Metadata = {
  logoText: '中国铁路12306',
  welcomeText: '欢迎登录12306',
  serviceHours: '购票相关业务每日 5:00 至次日 1:00（周二为 5:00 至 24:00）',
  officialSafetyTip:
    '官方 APP 为“铁路12306”，目前铁路未授权其他网站或 APP 开展类似服务内容，请注意辨识。',
  friendLinks: [
    { name: '铁路12306', url: 'https://kyfw.12306.cn/' },
    { name: '中国铁路', url: 'https://www.china-railway.com.cn/' },
  ],
  compliance: {
    policeRecord: '京公网安备 XXXXXX 号',
    icpRecord: '京ICP备XXXXXX号-1',
  },
  accessibility: {
    elderlyServiceEntry: '/accessibility',
    description: '适老化无障碍服务入口说明',
  },
};

export function HomePage(props: HomePageProps) {
  const [metadata, setMetadata] = useState<Metadata>(FALLBACK_METADATA);
  const [metadataLoading, setMetadataLoading] = useState<boolean>(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // 推断登录态：在未提供统一会话状态前，依据回调存在性进行推断
  const isLoggedIn = useMemo(() => {
    if (props.onLoginRequired && !props.onNavigate) return false;
    if (props.onNavigate && !props.onLoginRequired) return true;
    return false;
  }, [props.onNavigate, props.onLoginRequired]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/site/metadata');
        if (!res.ok) throw new Error('Failed to load metadata');
        const body = (await res.json()) as Metadata;
        if (mounted) setMetadata(body);
      } catch (err: any) {
        setMetadataError(err?.message || '加载站点信息失败');
      } finally {
        if (mounted) setMetadataLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleNavigate = (path: string, href?: string) => (e: React.MouseEvent) => {
    if (href) {
      // 允许默认跳转，同时触发内部路由回调
    }
    if (props.onNavigate) props.onNavigate(path);
  };

  const handleProtectedNavigate = (path: string) => (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      if (props.onLoginRequired) props.onLoginRequired();
      return;
    }
    if (props.onNavigate) props.onNavigate(path);
  };

  return (
    <div aria-label="HomePage" className="mobile-stack">
      <header>
        <div aria-label="brand">{metadata.logoText}</div>
        <div aria-label="welcome">{metadata.welcomeText}</div>
      </header>

      <section aria-label="hero-info">
        <p aria-label="service-hours">{metadata.serviceHours}</p>
        <p aria-label="official-tip">{metadata.officialSafetyTip}</p>
        {metadataLoading && <span>加载中...</span>}
        {metadataError && (
          <div role="alert">
            <span>{metadataError}</span>
          </div>
        )}
      </section>

      <nav aria-label="main-actions">
        <a href="http://localhost:8082/login.html" aria-label="登录注册">
          <button type="button" onClick={handleNavigate('/auth', 'http://localhost:8082/login.html')}>
            登录注册
          </button>
        </a>
        <a href="http://localhost:5173/index.html" aria-label="车票查询">
          <button type="button" onClick={handleNavigate('/tickets/search', 'http://localhost:5173/index.html')}>
            车票查询
          </button>
        </a>
        <button type="button" onClick={handleProtectedNavigate('/orders')}>订单管理</button>
        <button type="button" onClick={handleProtectedNavigate('/passengers')}>乘客管理</button>
        <button type="button" onClick={handleProtectedNavigate('/profile')}>个人信息</button>
      </nav>

      <section aria-label="error-actions">
        <button type="button">重试</button>
        <button type="button">返回首页</button>
      </section>

      <footer>
        <div aria-label="links">友情链接</div>
        <ul>
          {metadata.friendLinks.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noreferrer">
                {l.name}
              </a>
            </li>
          ))}
        </ul>
        <div aria-label="compliance">
          备案：{metadata.compliance.policeRecord} / {metadata.compliance.icpRecord}
        </div>
        <div aria-label="accessibility">适老化无障碍服务</div>
      </footer>
    </div>
  );
}

export default HomePage;