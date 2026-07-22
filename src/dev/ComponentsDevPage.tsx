import { useState } from 'react';
import { Building2, Smartphone, Wallet } from 'lucide-react';
import { CardMunai } from '@/components/ui/CardMunai';
import { LimitProgressBar } from '@/components/ui/LimitProgressBar';
import { StepperStatus, type StepperStep } from '@/components/ui/StepperStatus';
import { OtpInput } from '@/components/ui/OtpInput';
import { ChannelCard } from '@/components/ui/ChannelCard';
import { showToast } from '@/components/ui/toastStore';

const demoSteps: StepperStep[] = [
  { id: '1', label: 'Проверка ГБД ФЛ', status: 'success' },
  { id: '2', label: 'Проверка БМГ', status: 'in_progress' },
  { id: '3', label: 'Проверка ИС «Автомобиль»', status: 'pending' },
  { id: '4', label: 'Проверка ИС «Беркут»', status: 'error', detail: 'Обнаружен дубликат паспорта' },
];

export function ComponentsDevPage() {
  const [otp, setOtp] = useState('');

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-xl font-bold text-navy-900">/dev/components — базовая компонентная библиотека (Этап 2)</h1>

      <section>
        <h2 className="mb-3 font-semibold text-navy-700">CardMunai</h2>
        <div className="space-y-3">
          <CardMunai
            holderName="Асанов Ануар Бахытович"
            maskedIdentifier="••••••0123"
            cardLabel="ФЛ · легковая"
            qrToken="DEMOQRTOKEN1"
            remainingLabel="58 л"
          />
          <CardMunai
            holderName="ТОО «Жолжелдер Логистикс»"
            maskedIdentifier="••••••9012"
            cardLabel="ЮЛ · грузовая · 778EEE01"
            qrToken="DEMOQRTOKEN2"
            remainingLabel="300 л"
          />
          <CardMunai
            holderName="Smirnov Ivan Petrovich"
            maskedIdentifier="P1234567"
            cardLabel="ФЛ · иностранец"
            qrToken="DEMOQRTOKEN3"
            remainingLabel="без лимита"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-navy-700">LimitProgressBar</h2>
        <div className="space-y-4">
          <LimitProgressBar usedL={40} limitL={100} />
          <LimitProgressBar usedL={92} limitL={100} />
          <LimitProgressBar usedL={58} limitL={null} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-navy-700">StepperStatus</h2>
        <StepperStatus steps={demoSteps} />
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-navy-700">OtpInput</h2>
        <OtpInput value={otp} onChange={setOtp} />
        <p className="mt-2 text-xs text-navy-400">Введено: {otp || '—'}</p>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-navy-700">ToastNotification</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded border border-navy-300 px-2 py-1 text-xs"
            onClick={() => showToast({ variant: 'info', message: 'Информационное уведомление' })}
          >
            info
          </button>
          <button
            className="rounded border border-navy-300 px-2 py-1 text-xs"
            onClick={() => showToast({ variant: 'success', message: 'Заправка подтверждена', description: '40 л · АИ-92 · остаток 60 л' })}
          >
            success
          </button>
          <button
            className="rounded border border-navy-300 px-2 py-1 text-xs"
            onClick={() => showToast({ variant: 'warning', message: 'Достигнуто 80% суточного лимита' })}
          >
            warning (80%)
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-navy-700">ChannelCard</h2>
        <div className="space-y-2">
          <ChannelCard icon={Smartphone} title="eGov Mobile" subtitle="Данные уже верифицированы" onClick={() => showToast({ variant: 'info', message: 'eGov Mobile' })} />
          <ChannelCard icon={Wallet} title="Приложение БВУ" subtitle="Kaspi, Halyk и др." onClick={() => showToast({ variant: 'info', message: 'БВУ' })} />
          <ChannelCard icon={Building2} title="Приложение КМГ" subtitle="Полная проверка" onClick={() => showToast({ variant: 'info', message: 'КМГ' })} />
          <ChannelCard icon={Smartphone} title="eGov Mobile" subtitle="Недоступно для этой роли" disabled />
        </div>
      </section>
    </div>
  );
}
