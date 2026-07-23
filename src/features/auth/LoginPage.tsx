import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Wallet, Building2, User as UserIcon } from 'lucide-react';
import { ChannelCard } from '@/components/ui/ChannelCard';
import { OtpInput } from '@/components/ui/OtpInput';
import { SmsStep } from '@/features/onboarding/steps/SmsStep';
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
          <p className="mb-1 text-sm text-gray-500">eGov Mobile / БВУ — резидент, мгновенный вход</p>
          <ChannelCard icon={Smartphone} title="eGov Mobile / БВУ" subtitle="Выбрать из ранее зарегистрированных" onClick={() => setStep('egov-bvu')} />
          <p className="mb-1 mt-4 text-sm text-gray-500">Приложение КМГ — резидент/иностранец</p>
          <ChannelCard icon={Wallet} title="Телефон + SMS-код" onClick={() => setStep('kmg-phone')} />
          <p className="mb-1 mt-4 text-sm text-gray-500">ЮЛ — резидент и нерезидент</p>
          <ChannelCard icon={Building2} title="БИН / рег. номер + код" onClick={() => setStep('ul-bin')} />
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
          <button type="button" onClick={() => setStep('method')} className="mt-2 text-sm text-gray-500">
            ← Назад
          </button>
        </div>
      )}

      {step === 'kmg-phone' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Номер телефона</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" placeholder="+77011234502" />
            <p className="mt-1 text-xs text-gray-400">Демо: +77011234502 (ФЛ-резидент) · +79261234567 (иностранец)</p>
            {phoneError && <p className="mt-1 text-xs text-status-blocked">{phoneError}</p>}
          </div>
          <button type="button" onClick={handlePhoneSubmit} disabled={!phone} className="w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white shadow-sm shadow-orange-500/30 disabled:opacity-40 disabled:shadow-none">
            Продолжить
          </button>
          <button type="button" onClick={() => setStep('method')} className="text-sm text-gray-500">
            ← Назад
          </button>
        </div>
      )}

      {step === 'kmg-sms' && phoneUserId && <SmsStep phone={phone} onVerified={() => finishLogin(phoneUserId)} />}

      {step === 'ul-bin' && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">БИН / регистрационный номер компании</label>
            <input value={binOrRegNumber} onChange={(e) => setBinOrRegNumber(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" placeholder="123456789012" />
            <p className="mt-1 text-xs text-gray-400">Демо: 123456789012 (резидент) · RU-7743012345 (нерезидент)</p>
            {binError && <p className="mt-1 text-xs text-status-blocked">{binError}</p>}
          </div>
          <button type="button" onClick={handleBinSubmit} disabled={!binOrRegNumber} className="w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white shadow-sm shadow-orange-500/30 disabled:opacity-40 disabled:shadow-none">
            Продолжить
          </button>
          <button type="button" onClick={() => setStep('method')} className="text-sm text-gray-500">
            ← Назад
          </button>
        </div>
      )}

      {step === 'ul-code' && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">Подтвердите вход кодом (имитация ЭЦП/кода админа)</p>
          <OtpInput length={4} value={ecpCode} onChange={handleEcpCodeChange} error={!!ecpError} />
          <p className="text-xs text-gray-400">Демо-код: 1234</p>
          {ecpError && <p className="text-xs text-status-blocked">{ecpError}</p>}
        </div>
      )}
    </div>
  );
}
