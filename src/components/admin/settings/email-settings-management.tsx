'use client';

import { useState, useTransition } from 'react';
import { Save, Send, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  updateSmtpSettingsAction,
  sendTestEmailAction,
} from '@/server/actions/settings.actions';

interface Props {
  initialSettings: {
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpFromName: string | null;
    smtpFromEmail: string | null;
    notificationEmails: string[];
  };
}

export function EmailSettingsManagement({ initialSettings }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [host, setHost] = useState(initialSettings.smtpHost ?? '');
  const [port, setPort] = useState(initialSettings.smtpPort?.toString() ?? '');
  const [user, setUser] = useState(initialSettings.smtpUser ?? '');
  const [password, setPassword] = useState('');
  const [fromName, setFromName] = useState(initialSettings.smtpFromName ?? '');
  const [fromEmail, setFromEmail] = useState(initialSettings.smtpFromEmail ?? '');
  const [emails, setEmails] = useState<string[]>(initialSettings.notificationEmails);
  const [newEmail, setNewEmail] = useState('');

  function addEmail() {
    const email = newEmail.trim();
    if (email && !emails.includes(email)) {
      setEmails([...emails, email]);
      setNewEmail('');
    }
  }

  function removeEmail(email: string) {
    setEmails(emails.filter((e) => e !== email));
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateSmtpSettingsAction({
        smtpHost: host || null,
        smtpPort: port ? parseInt(port) : null,
        smtpUser: user || null,
        smtpPassword: password || undefined,
        smtpFromName: fromName || null,
        smtpFromEmail: fromEmail || null,
        notificationEmails: emails,
      });
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  function handleTestEmail() {
    startTransition(async () => {
      const res = await sendTestEmailAction();
      setTestResult(res.success ? '测试邮件已发送' : (res.error as string));
      setTimeout(() => setTestResult(null), 5000);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">邮件配置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            配置 SMTP 服务器用于询盘通知和客户确认邮件
          </p>
        </div>
        {saved && <span className="text-sm text-green-400">已保存</span>}
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">SMTP 服务器</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">服务器地址</label>
            <Input
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">端口</label>
            <Input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="587"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">用户名</label>
            <Input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="user@gmail.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">密码</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="留空则不更新"
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold pt-4">发件人</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">发件人名称</label>
            <Input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Vela"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">发件人邮箱</label>
            <Input
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="no-reply@example.com"
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold pt-4">询盘通知接收邮箱</h2>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {emails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
              >
                {email}
                <button type="button" onClick={() => removeEmail(email)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="添加邮箱..."
              className="max-w-xs"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
            />
            <Button type="button" variant="outline" size="sm" onClick={addEmail}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button onClick={handleSave} disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
          <Button variant="outline" onClick={handleTestEmail} disabled={isPending}>
            <Send className="mr-2 h-4 w-4" />
            发送测试邮件
          </Button>
          {testResult && (
            <span className="text-sm text-muted-foreground">{testResult}</span>
          )}
        </div>
      </div>
    </div>
  );
}
