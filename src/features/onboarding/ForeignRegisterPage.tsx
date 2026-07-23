import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { WizardShell } from './steps/WizardShell';
import { PassportLivenessStep } from './steps/PassportLivenessStep';
import { BerkutStep } from './steps/BerkutStep';
import { VehicleCheckStep, type VehicleCheckResult } from './steps/VehicleCheckStep';
import { LimitResultStep } from './steps/LimitResultStep';
import { generateDemoFio, generateDemoPhone } from '@/lib/demoIdentity';
import { finalizeFlRegistration } from './registrationActions';

type Step = 'passport' | 'berkut' | 'rejected' | 'phone' | 'vehicle' | 'result';
const STEP_ORDER: Step[] = ['passport', 'berkut', 'phone', 'vehicle', 'result'];

/** Ветка ФЛ-иностранец (только приложение КМГ) — S-06/S-07 + S-08/S-09 (ТЗ 4.3). Согласие на ПД получено на S-00. */
export function ForeignRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('passport');
  const [passportNumber, setPassportNumber] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [fio] = useState(() => generateDemoFio());
  const [phone, setPhone] = useState(() => generateDemoPhone());
  const [vehicleResult, setVehicleResult] = useState<VehicleCheckResult | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step === 'rejected' ? 'berkut' : step);

  const handleIssueCard = () => {
    finalizeFlRegistration({
      residency: 'nonresident',
      fio,
      phone,
      channel: 'kmg',
      passportNumber,
      vehicle: vehicleResult?.vehicle,
    });
    navigate('/card', { state: { justIssued: true } });
  };

  return (
    <WizardShell
      title="Регистрация · ФЛ-иностранец"
      stepIndex={stepIndex}
      stepCount={STEP_ORDER.length}
      onBack={() => (step === 'passport' ? navigate('/register/kmg') : setStep('passport'))}
    >
      {step === 'passport' && (
        <PassportLivenessStep passportNumber={passportNumber} onPassportNumberChange={setPassportNumber} onComplete={() => setStep('berkut')} />
      )}

      {step === 'berkut' && (
        <BerkutStep
          passportNumber={passportNumber}
          onSuccess={() => setStep('phone')}
          onRejected={(message) => {
            setRejectReason(message);
            setStep('rejected');
          }}
        />
      )}

      {step === 'rejected' && (
        <div className="space-y-6 text-center">
          <XCircle className="mx-auto h-12 w-12 text-status-blocked" />
          <p className="text-lg font-bold text-gray-900">Отказ в регистрации</p>
          <p className="text-sm text-gray-500">{rejectReason}</p>
          <button
            type="button"
            onClick={() => {
              setPassportNumber('');
              setStep('passport');
            }}
            className="w-full rounded-2xl bg-white py-3 font-semibold text-gray-700 shadow-sm shadow-gray-200/60"
          >
            Попробовать снова
          </button>
        </div>
      )}

      {step === 'phone' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Для иностранцев принимается любой номер как канал связи — просто контакт, без SMS-подтверждения</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Номер телефона</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" />
          </div>
          <button type="button" onClick={() => setStep('vehicle')} className="w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white shadow-sm shadow-orange-500/30">
            Продолжить
          </button>
        </div>
      )}

      {step === 'vehicle' && (
        <VehicleCheckStep
          identifier={passportNumber}
          onComplete={(result) => {
            setVehicleResult(result);
            setStep('result');
          }}
        />
      )}

      {step === 'result' && vehicleResult && (
        <LimitResultStep category={vehicleResult.category} dailyLimitL={null} priceEligible={false} onContinue={handleIssueCard} />
      )}
    </WizardShell>
  );
}
