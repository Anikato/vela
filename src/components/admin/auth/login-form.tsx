'use client';

/**
 * 登录表单组件
 * 暗色科技感风格，使用 Auth.js signIn
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password.trim()) {
      setError('请输入账号和密码');
      return;
    }

    setIsLoading(true);

    try {
      const health = await fetch('/api/health/db', { method: 'GET' });
      if (!health.ok) {
        setError('数据库连接异常，请联系管理员');
        return;
      }

      const result = await signIn('credentials', {
        identifier: identifier.trim(),
        password: password.trim(),
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CallbackRouteError') {
          setError('数据库连接异常，请联系管理员');
          return;
        }
        setError('账号或密码错误');
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 账号 */}
      <div className="space-y-2">
        <Label htmlFor="identifier" className="text-sm text-foreground/80">
          账号
        </Label>
        <Input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="用户名或邮箱"
          autoComplete="username"
          disabled={isLoading}
          className="h-11 border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground/40 focus-visible:border-primary/50 focus-visible:ring-primary/20"
        />
      </div>

      {/* 密码 */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm text-foreground/80">
          密码
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            autoComplete="current-password"
            disabled={isLoading}
            className="h-11 border-border/50 bg-background/50 pr-10 text-foreground placeholder:text-muted-foreground/40 focus-visible:border-primary/50 focus-visible:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* 提交按钮 */}
      <Button
        type="submit"
        className="h-11 w-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,200,255,0.15)] transition-all hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(0,200,255,0.25)]"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            登录中...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            登录
          </>
        )}
      </Button>
    </form>
  );
}
