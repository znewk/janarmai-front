import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Globe, Building2, Building } from 'lucide-react';
import { WizardShell } from './steps/WizardShell';
import { ChannelCard } from '@/components/ui/ChannelCard';
import { IinPhoneFormStep, type IinPhoneFormValues } from './steps/IinPhoneFormStep';
import { GbdFlBmgStep } from './steps/GbdFlBmgStep';
import { SmsStep } from './steps/SmsStep';
import { VehicleCheckStep, type VehicleCheckResult } from './steps/VehicleCheckStep';
import { LimitResultStep } from './steps/LimitResultStep';
import { CardIssueStep } from './steps/CardIssueStep';
import type { Card } from '@/types/entities';
import { deriveFlCardSpecs } from '@/lib/cardRules';
import { finalizeFlRegistration } from './registrationActions';

type UserTypeChoice = 'fl_resident' | 'fl_foreign' | 'ul_resident' | 'ul_nonresident';
type Step = 'type' | 'iin-phone' | 'gbd-bmg' | 'sms' | 'vehicle' | 'result' | 'card';
const STEP_ORDER: Step[] = ['type', 'iin-phone', 'gbd-bmg', 'sms', 'vehicle', 'result', 'card'];

/** S-03 — выбор типа лица (путь КМГ, ТЗ 4.2–4.5) + полный путь ФЛ-резидента инлайн (4.2). */
export function KmgRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('type');
  const [identity, setIdentity] = useState<IinPhoneFormValues | null>(null);
  const [vehicleResult, setVehicleResult] = useState<VehicleCheckResult | null>(null);
  const [issuedCards, setIssuedCards] = useState<Card[]>([]);

  const stepIndex = STEP_ORDER.indexOf(step);

  const selectType = (choice: UserTypeChoice) => {
    if (choice === 'fl_resident') setStep('iin-phone');
    else if (choice === 'fl_foreign') navigate('/register/kmg/foreign');
    else if (choice === 'ul_resident') navigate('/register/kmg/company');
    else navigate('/register/kmg/company-foreign');
  };

  const handleIssueCard = () => {
    if (!identity) return;
    const { cards } = finalizeFlRegistration({
      residency: 'resident',
      fio: identity.fio,
      phone: identity.phone,
      channel: 'kmg',
      iin: identity.iin,
      vehicle: vehicleResult?.vehicle,
    });
    setIssuedCards(cards);
    setStep('card');
  };

  return (
    <WizardShell
      title="Регистрация · Приложение КМГ"
      stepIndex={stepIndex}
      stepCount={STEP_ORDER.length}
      onBack={() => (step === 'type' ? navigate('/') : setStep('type'))}
    >
      {step === 'type' && (
        <div className="space-y-2">
          <p className="mb-3 text-sm text-navy-600">Выберите тип лица</p>
          <ChannelCard icon={User} title="ФЛ · резидент РК" subtitle="Идентификация по ИИН" onClick={() => selectType('fl_resident')} />
          <ChannelCard icon={Globe} title="ФЛ · иностранец" subtitle="Идентификация по паспорту" onClick={() => selectType('fl_foreign')} />
          <ChannelCard icon={Building2} title="ЮЛ · резидент РК" subtitle="Компания-резидент, автопарк" onClick={() => selectType('ul_resident')} />
          <ChannelCard icon={Building} title="ЮЛ · нерезидент" subtitle="Иностранная компания" onClick={() => selectType('ul_nonresident')} />
        </div>
      )}

      {step === 'iin-phone' && (
        <IinPhoneFormStep
          onSubmit={(values) => {
            setIdentity(values);
            setStep('gbd-bmg');
          }}
        />
      )}

      {step === 'gbd-bmg' && identity && (
        <GbdFlBmgStep iin={identity.iin} fio={identity.fio} phone={identity.phone} onSuccess={() => setStep('sms')} onRetry={() => setStep('iin-phone')} />
      )}

      {step === 'sms' && identity && <SmsStep phone={identity.phone} onVerified={() => setStep('vehicle')} />}

      {step === 'vehicle' && identity && (
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

      {step === 'card' && identity && (
        <CardIssueStep holderName={identity.fio} cards={issuedCards} onContinue={() => navigate('/cabinet')} />
      )}
    </WizardShell>
  );
}
