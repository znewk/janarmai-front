import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Wallet, Building2, User as UserIcon } from 'lucide-react';
import { ChannelCard } from '@/components/ui/ChannelCard';
import { OtpInput } from '@/components/ui/OtpInput';
import { SmsStep } from '@/features/onboarding/steps/SmsStep';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user.store';

type Method = 'method' | 'egov-bvu' | 'kmg-phone' | 'kmg-sms' | 'ul-bin' | 'ul-code';

/** /login — авторизация в уже созданный аккаунт, все способы (S-15..S-17, ТЗ 4.6). */
export function LoginPage() {
  const navigate = useNavigate();
  const users = useUserStore((s) => s.users);
  const companies = useUserStore((s) => s.companies);
  const login = useUserStore((s) => s.login);

  const [step, setStep] = useState<Method>('method');
  const [signingInId, setSigningInId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneUserId, setPhoneUserId] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [binOrRegNumber, setBinOrRegNumber] = useState('');
  const [foundCompanyId, setFoundCompanyId] = useState<string | null>(null);
  const [binError, setBinError] = useState<string | null>(null);
  const [ecpCode, setEcpCode] = useState('');
  const [ecpError, setEcpError] = useState<string | null>(null);

  const egovBvuUsers = users.filter((u) => u.channel === 'egov' || u.channel === 'bvu');

  const finishLogin = (userId: string, companyId?: string) => {
    login(userId, companyId);
    navigate('/home');
  };

  const handleEgovBvuPick = (userId: string) => {
    setSigningInId(userId);
    setTimeout(() => finishLogin(userId), 500);
  };

  const handlePhoneSubmit = () => {
    const found = users.find((u) => u.phone === phone && u.channel === 'kmg');
    if (!found) {
      setPhoneError('Пользователь с таким номером не найден среди зарегистрированных через приложение КМГ');
      return;
    }
    setPhoneError(null);
    setPhoneUserId(found.id);
    setStep('kmg-sms');
  };

  const handleBinSubmit = () => {
    const found = companies.find((c) => c.bin === binOrRegNumber || c.registrationNumber === binOrRegNumber);
    if (!found) {
      setBinError('Компания с таким БИН/рег. номером не найдена');
      return;
    }
    setBinError(null);
    setFoundCompanyId(found.id);
    setStep('ul-code');
  };

  const handleEcpCodeChange = (value: string) => {
    setEcpCode(value);
    if (value.length !== 4) return;
    if (value !== '1234') {
      setEcpError('Неверный код подтверждения');
      setEcpCode('');
      return;
    }
    const company = companies.find((c) => c.id === foundCompanyId);
    if (company) finishLogin(company.directorId, company.id);
  };

  return (
    <div className="flex min-h-screen flex-col p-6">
      <h1 className="mb-6 text-lg font-bold text-gray-900">Вход в аккаунт</h1>

      {step === 'method' && (
        <div className="space-y-3">
          <ChannelCard icon={Smartphone} title="eGov Mobile / БВУ" subtitle="Войти через приложение eGov или Банк" onClick={() => setStep('egov-bvu')} />
          <ChannelCard icon={Wallet} title="По номеру телефона" subtitle="Вход по SMS-коду" onClick={() => setStep('kmg-phone')} />
          <ChannelCard icon={Building2} title="Для бизнеса" subtitle="Вход по БИН и электронной подписи" onClick={() => setStep('ul-bin')} />
          <p className="mt-6 text-center text-xs text-gray-400">Демо-режим: доступны все способы входа на тестовых данных — подсказки будут на следующем экране</p>
        </div>
      )}

      {step === 'egov-bvu' && (
        <div className="space-y-3">
          {egovBvuUsers.length === 0 && <p className="text-sm text-gray-400">Нет зарегистрированных аккаунтов eGov/БВУ. Пройдите регистрацию.</p>}
          {egovBvuUsers.map((u) => (
            <ChannelCard
              key={u.id}
              icon={UserIcon}
              title={u.fio}
              subtitle={signingInId === u.id ? 'Вход...' : `Канал: ${u.channel === 'egov' ? 'eGov Mobile' : 'БВУ'}`}
              onClick={() => handleEgovBvuPick(u.id)}
              disabled={signingInId !== null}
            />
          ))}
          <Button type="button" variant="link" size="sm" onClick={() => setStep('method')} className="mt-2 h-auto p-0 text-gray-500">
            ← Назад
          </Button>
        </div>
      )}

      {step === 'kmg-phone' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-phone">Номер телефона</Label>
            <Input id="login-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+77011234502" />
            <p className="text-xs text-gray-400">Демо: +77011234502 (ФЛ-резидент) · +79261234567 (иностранец)</p>
            {phoneError && <p className="text-xs text-status-blocked">{phoneError}</p>}
          </div>
          <Button type="button" onClick={handlePhoneSubmit} disabled={!phone} className="w-full">
            Продолжить
          </Button>
          <Button type="button" variant="link" size="sm" onClick={() => setStep('method')} className="h-auto p-0 text-gray-500">
            ← Назад
          </Button>
        </div>
      )}

      {step === 'kmg-sms' && phoneUserId && <SmsStep phone={phone} onVerified={() => finishLogin(phoneUserId)} />}

      {step === 'ul-bin' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-bin">БИН / регистрационный номер компании</Label>
            <Input id="login-bin" value={binOrRegNumber} onChange={(e) => setBinOrRegNumber(e.target.value)} placeholder="123456789012" />
            <p className="text-xs text-gray-400">Демо: 123456789012 (резидент) · RU-7743012345 (нерезидент)</p>
            {binError && <p className="text-xs text-status-blocked">{binError}</p>}
          </div>
          <Button type="button" onClick={handleBinSubmit} disabled={!binOrRegNumber} className="w-full">
            Продолжить
          </Button>
          <Button type="button" variant="link" size="sm" onClick={() => setStep('method')} className="h-auto p-0 text-gray-500">
            ← Назад
          </Button>
        </div>
      )}

      {step === 'ul-code' && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">Подтвердите вход электронной подписью</p>
          <OtpInput length={4} value={ecpCode} onChange={handleEcpCodeChange} error={!!ecpError} />
          <p className="text-xs text-gray-400">Демо-код: 1234</p>
          {ecpError && <p className="text-xs text-status-blocked">{ecpError}</p>}
        </div>
      )}
    </div>
  );
}
