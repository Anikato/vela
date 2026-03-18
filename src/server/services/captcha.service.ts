import { decryptSecret } from '@/lib/crypto';
import { db } from '@/server/db';

interface CaptchaConfig {
  provider: 'turnstile';
  siteKey: string;
  secretKey: string;
}

/** 从数据库读取验证码配置，未配置则返回 null（跳过验证） */
export async function getCaptchaConfig(): Promise<CaptchaConfig | null> {
  const row = await db.query.siteSettings.findFirst();
  if (!row?.captchaProvider || !row.captchaSiteKey || !row.captchaSecretKey) {
    return null;
  }
  return {
    provider: 'turnstile',
    siteKey: row.captchaSiteKey,
    secretKey: decryptSecret(row.captchaSecretKey),
  };
}

/** 获取公开的 site key（给前端使用） */
export async function getCaptchaSiteKey(): Promise<string | null> {
  const config = await getCaptchaConfig();
  return config?.siteKey ?? null;
}

/** 服务端验证 Cloudflare Turnstile token */
export async function verifyCaptchaToken(token: string): Promise<boolean> {
  const config = await getCaptchaConfig();
  if (!config) return true;

  if (!token) return false;

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: config.secretKey,
        response: token,
      }),
    });

    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
