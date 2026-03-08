import { LoginForm } from '@/components/admin/auth/login-form';

export const metadata = {
  title: '登录 — Vela 管理后台',
};

/**
 * 登录页面
 * 暗色科技感主题，居中布局
 */
export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* 顶部渐变光晕 */}
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
        {/* 底部渐变光晕 */}
        <div className="absolute -bottom-20 right-1/4 h-[300px] w-[500px] rounded-full bg-primary/3 blur-[100px]" />
        {/* 网格背景 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* 登录卡片 */}
      <div className="relative w-full max-w-md">
        {/* Logo + 标题 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-[0_0_30px_rgba(0,200,255,0.1)]">
            <span className="text-2xl font-bold text-primary">V</span>
          </div>
          <h1 className="text-2xl font-bold tracking-wide text-foreground">
            Vela 管理后台
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            请使用用户名或邮箱登录
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="rounded-xl border border-border/50 bg-card/80 p-8 shadow-[0_0_40px_rgba(0,0,0,0.3)] backdrop-blur-sm">
          <LoginForm />
        </div>

        {/* 底部版权 */}
        <p className="mt-8 text-center text-xs text-muted-foreground/50">
          Vela — 多语言展示型网站系统
        </p>
      </div>
    </div>
  );
}
