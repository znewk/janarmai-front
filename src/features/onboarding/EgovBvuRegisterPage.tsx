import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { WizardShell } from './steps/WizardShell';
import { ConsentStep } from './steps/ConsentStep';
import { SmsStep } from './steps/SmsStep';
import { VehicleCheckStep, type VehicleCheckResult } from './steps/VehicleCheckStep';
import { LimitResultStep } from './steps/LimitResultStep';
import { CardIssueStep } from './steps/CardIssueStep';
import type { Card } from '@/types/entities';
import { generateDemoFio, generateDemoIin, generateDemoPhone } from '@/lib/demoIdentity';
import { deriveFlCardSpecs } from '@/lib/cardRules';
import { finalizeFlRegistration } from './registrationActions';
import { maskIdentifier } from '@/lib/mask';

type Step = 'identity' | 'consent' | 'sms' | 'vehicle' | 'result' | 'card';
const STEP_ORDER: Step[] = ['identity', 'consent', 'sms', 'vehicle', 'result', 'card'];

const CHANNEL_LABEL: Record<string, string> = { egov: 'eGov Mobile', bvu: 'Приложение БВУ (Kaspi/Halyk)' };

/** Быстрый путь резидента через eGov/БВУ — S-01/S-02 + общий хвост S-08..S-10 (ТЗ 4.1). */
export function EgovBvuRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const channel = (location.state as { channel?: 'egov' | 'bvu' } | null)?.channel ?? 'egov';

  const [identity] = useState(() => ({ fio: generateDemoFio(), iin: generateDemoIin(), phone: generateDemoPhone() }));
  const [step, setStep] = useState<Step>('identity');
  const [vehicleResult, setVehicleResult] = useState<VehicleCheckResult | null>(null);
  const [issuedCards, setIssuedCards] = useState<Card[]>([]);

  const stepIndex = STEP_ORDER.indexOf(step);

  const handleIssueCard = () => {
    const { cards } = finalizeFlRegistration({
      residency: 'resident',
      fio: identity.fio,
      phone: identity.phone,
      channel,
      iin: identity.iin,
      vehicle: vehicleResult?.vehicle,
    });
    setIssuedCards(cards);
    setStep('card');
  };

  return (
    <WizardShell title={`Регистрация · ${CHANNEL_LABEL[channel]}`} stepIndex={stepIndex} stepCount={STEP_ORDER.length} onBack={() => navigate('/')}>
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
          <button type="button" onClick={() => setStep('consent')} className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white">
            Продолжить
          </button>
        </div>
      )}

      {step === 'consent' && <ConsentStep onAgree={() => setStep('sms')} />}

      {step === 'sms' && <SmsStep phone={identity.phone} onVerified={() => setStep('vehicle')} />}

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

      {step === 'card' && (
        <CardIssueStep holderName={identity.fio} cards={issuedCards} onContinue={() => navigate('/cabinet')} />
      )}
    </WizardShell>
  );
}
