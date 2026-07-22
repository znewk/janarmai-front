import { useEffect, useState } from 'react';
import { OtpInput } from '@/components/ui/OtpInput';
import { sendSmsCode, verifySmsCode } from '@/mocks/api';

/** S-02 — отправка и ввод SMS-кода (общий компонент для 4.1, 4.2, 4.6). */
export function SmsStep({ phone, onVerified }: { phone: string; onVerified: () => void }) {
  const [sending, setSending] = useState(true);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSending(true);
    sendSmsCode(phone).then((res) => {
      if (cancelled) return;
      setSending(false);
      if (res.status === 'success') setDemoCode(res.data.demoCode);
    });
    return () => {
      cancelled = true;
    };
  }, [phone]);

  useEffect(() => {
    if (code.length !== 4) return;
    setVerifying(true);
    setError(null);
    verifySmsCode(code).then((res) => {
      setVerifying(false);
      if (res.status === 'success') {
        onVerified();
      } else {
        setError(res.message);
        setCode('');
      }
    });
  }, [code, onVerified]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-navy-600">
          Код подтверждения отправлен на номер <span className="font-semibold text-navy-900">{phone}</span>
        </p>
        {sending && <p className="mt-1 text-xs text-navy-400">Отправка...</p>}
        {demoCode && <p className="mt-1 text-xs text-navy-400">Демо-код (для проверки): {demoCode}</p>}
      </div>
      <OtpInput length={4} value={code} onChange={setCode} error={!!error} disabled={sending || verifying} />
      {verifying && <p className="text-xs text-navy-400">Проверка кода...</p>}
      {error && <p className="text-xs text-status-blocked">{error}</p>}
    </div>
  );
}
