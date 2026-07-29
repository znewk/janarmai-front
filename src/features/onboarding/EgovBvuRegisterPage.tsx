import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { WizardShell } from './steps/WizardShell';
import { VehicleCheckStep, type VehicleCheckResult } from './steps/VehicleCheckStep';
import { LimitResultStep, type ResultCardSpec } from './steps/LimitResultStep';
import { EgovMobileHomeMock } from './EgovMobileHomeMock';
import { EgovOauthConsentMock } from './EgovOauthConsentMock';
import { generateDemoFio, generateDemoIin, generateDemoPhone } from '@/lib/demoIdentity';
import { deriveFlCardSpecs, deriveMonitoringCardSpec } from '@/lib/cardRules';
import { finalizeFlRegistration } from './registrationActions';
import { maskIdentifier } from '@/lib/mask';
import { Card, cardBaseClassName } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type WizardStep = 'identity' | 'vehicle' | 'result';
type Step = 'egov-home' | 'egov-consent' | WizardStep;
const STEP_ORDER: WizardStep[] = ['identity', 'vehicle', 'result'];

/**
 * Быстрый путь резидента через объединённый канал «eGov / банковское приложение» (ТЗ 4.1).
 * Согласие на ПД — внизу первого экрана визарда, там, где уже видны конкретные данные пользователя,
 * подтянутые каналом (не на S-00, где данных ещё нет). SMS-подтверждение не требуется — канал уже верифицировал данные.
 */
export function EgovBvuRegisterPage() {
  const navigate = useNavigate();

  const [identity] = useState(() => ({ fio: generateDemoFio(), iin: generateDemoIin(), phone: generateDemoPhone() }));
  const [step, setStep] = useState<Step>('egov-home');
  const [consentChecked, setConsentChecked] = useState(false);
  const [monitoringOnly, setMonitoringOnly] = useState(false);
  const [vehicleResult, setVehicleResult] = useState<VehicleCheckResult | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step as WizardStep);

  const handleIssueCard = () => {
    finalizeFlRegistration({
      residency: 'resident',
      fio: identity.fio,
      phone: identity.phone,
      channel: 'egov',
      iin: identity.iin,
      vehicles: vehicleResult?.vehicles,
      monitoringOnly,
    });
    navigate('/card', { state: { justIssued: true } });
  };

  if (step === 'egov-home') {
    return <EgovMobileHomeMock onOpenApp={() => setStep('egov-consent')} />;
  }

  if (step === 'egov-consent') {
    return <EgovOauthConsentMock onAllow={() => setStep('identity')} onDeny={() => setStep('egov-home')} onClose={() => navigate('/')} />;
  }

  return (
    <WizardShell title="Регистрация · Через eGov / банковское приложение" stepIndex={stepIndex} stepCount={STEP_ORDER.length} onBack={() => navigate('/')}>
      {step === 'identity' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 text-status-ok">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Данные подтверждены каналом</span>
            </div>
            <dl className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between">
                <dt className="text-gray-400">ФИО</dt>
                <dd>{identity.fio}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">ИИН</dt>
                <dd>{maskIdentifier(identity.iin)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Телефон</dt>
                <dd>{identity.phone}</dd>
              </div>
            </dl>
          </Card>
          <Button type="button" disabled={!consentChecked} onClick={() => setStep('vehicle')} className="w-full">
            Продолжить
          </Button>
          <label className={`${cardBaseClassName} flex-row items-start gap-3`}>
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 h-5 w-5 accent-navy-600"
            />
            <span className="text-sm text-gray-700">Я согласен(на) на обработку персональных данных в системе учёта отпуска ГСМ</span>
          </label>
          <label className={`${cardBaseClassName} flex-row items-start gap-3`}>
            <input
              type="checkbox"
              checked={monitoringOnly}
              onChange={(e) => setMonitoringOnly(e.target.checked)}
              className="mt-0.5 h-5 w-5 accent-navy-600"
            />
            <span className="text-sm text-gray-700">
              Демо: аккаунт «только мониторинг» — без суточного лимита, карта лишь показывает объём купленного топлива, без привязки к ТС
            </span>
          </label>
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
        (monitoringOnly || vehicleResult) &&
        (() => {
          const specs: ResultCardSpec[] = monitoringOnly
            ? [deriveMonitoringCardSpec()]
            : deriveFlCardSpecs({ residency: 'resident', vehicleCategories: vehicleResult!.vehicles.map((v) => v.category) });
          return <LimitResultStep specs={specs} onContinue={handleIssueCard} />;
        })()}
    </WizardShell>
  );
}
