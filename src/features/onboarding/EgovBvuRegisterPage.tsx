import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { WizardShell } from './steps/WizardShell';
import { VehicleCheckStep, type VehicleCheckResult } from './steps/VehicleCheckStep';
import { LimitResultStep } from './steps/LimitResultStep';
import { generateDemoFio, generateDemoIin, generateDemoPhone } from '@/lib/demoIdentity';
import { deriveFlCardSpecs } from '@/lib/cardRules';
import { finalizeFlRegistration } from './registrationActions';
import { maskIdentifier } from '@/lib/mask';

type Step = 'identity' | 'vehicle' | 'result';
const STEP_ORDER: Step[] = ['identity', 'vehicle', 'result'];

/**
 * Быстрый путь резидента через объединённый канал «eGov / банковское приложение» (ТЗ 4.1).
 * Согласие на ПД уже получено на S-00; SMS-подтверждение не требуется — канал уже верифицировал данные.
 */
export function EgovBvuRegisterPage() {
  const navigate = useNavigate();

  const [identity] = useState(() => ({ fio: generateDemoFio(), iin: generateDemoIin(), phone: generateDemoPhone() }));
  const [step, setStep] = useState<Step>('identity');
  const [vehicleResult, setVehicleResult] = useState<VehicleCheckResult | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step);

  const handleIssueCard = () => {
    finalizeFlRegistration({
      residency: 'resident',
      fio: identity.fio,
      phone: identity.phone,
      channel: 'egov',
      iin: identity.iin,
      vehicle: vehicleResult?.vehicle,
    });
    navigate('/card', { state: { justIssued: true } });
  };

  return (
    <WizardShell title="Регистрация · Через eGov / банковское приложение" stepIndex={stepIndex} stepCount={STEP_ORDER.length} onBack={() => navigate('/')}>
      {step === 'identity' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-navy-100 bg-navy-50 p-4">
            <div className="flex items-center gap-2 text-status-ok">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Данные подтверждены каналом</span>
            </div>
            <dl className="mt-3 space-y-1 text-sm text-navy-700">
              <div className="flex justify-between">
                <dt className="text-navy-400">ФИО</dt>
                <dd>{identity.fio}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-400">ИИН</dt>
                <dd>{maskIdentifier(identity.iin)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-400">Телефон</dt>
                <dd>{identity.phone}</dd>
              </div>
            </dl>
          </div>
          <button type="button" onClick={() => setStep('vehicle')} className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white">
            Продолжить
          </button>
        </div>
      )}

      {step === 'vehicle' && (
        <VehicleCheckStep
          identifier={identity.iin}
          onComplete={(result) => {
            setVehicleResult(result);
            setStep('result');
          }}
        />
      )}

      {step === 'result' &&
        vehicleResult &&
        (() => {
          const spec = deriveFlCardSpecs({ residency: 'resident', vehicleCategories: vehicleResult.vehicle ? [vehicleResult.category] : [] })[0];
          return <LimitResultStep category={vehicleResult.category} dailyLimitL={spec.dailyLimitL} priceEligible={spec.priceEligible} onContinue={handleIssueCard} />;
        })()}
    </WizardShell>
  );
}
