import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { WizardShell } from './steps/WizardShell';
import { ManualCompanyStep, type ManualCompanyFormValues } from './steps/ManualCompanyStep';
import { PassportLivenessStep } from './steps/PassportLivenessStep';
import { BerkutStep } from './steps/BerkutStep';
import { VehicleFleetStep, type FleetVehicleDraft } from './steps/VehicleFleetStep';
import { DriverAssignStep, type DriverAssignment } from './steps/DriverAssignStep';
import { generateDemoFio } from '@/lib/demoIdentity';
import { finalizeUlRegistration } from './registrationActions';

type Step = 'company' | 'passport' | 'berkut' | 'rejected' | 'fleet' | 'drivers';
const STEP_ORDER: Step[] = ['company', 'passport', 'berkut', 'fleet', 'drivers'];

/**
 * Ветка ЮЛ-нерезидент — S-11..S-14 по аналогии с ЮЛ-резидентом, верификация директора переиспользует
 * S-06/S-07 (ТЗ 4.5). Согласие на ПД получено на S-00.
 */
export function CompanyForeignRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('company');
  const [companyInfo, setCompanyInfo] = useState<ManualCompanyFormValues | null>(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [directorFio] = useState(() => generateDemoFio());
  const [vehicles, setVehicles] = useState<FleetVehicleDraft[]>([]);

  const stepIndex = STEP_ORDER.indexOf(step === 'rejected' ? 'berkut' : step);

  const handleDriversComplete = (assignments: (DriverAssignment | null)[]) => {
    if (!companyInfo) return;
    finalizeUlRegistration({
      residency: 'nonresident',
      name: companyInfo.name,
      registrationNumber: companyInfo.registrationNumber,
      phone: companyInfo.phone,
      directorFio,
      directorIdentifier: passportNumber,
      vehicles: vehicles.map((v, i) => ({
        grnz: v.grnz,
        category: v.category,
        driverFio: assignments[i]?.fio,
        driverIin: assignments[i]?.iin,
      })),
    });
    navigate('/cabinet', { state: { justIssued: true } });
  };

  return (
    <WizardShell
      title="Регистрация · ЮЛ-нерезидент"
      stepIndex={stepIndex}
      stepCount={STEP_ORDER.length}
      onBack={() => (step === 'company' ? navigate('/register/kmg') : setStep('company'))}
    >
      {step === 'company' && (
        <ManualCompanyStep
          onSubmit={(values) => {
            setCompanyInfo(values);
            setStep('passport');
          }}
        />
      )}

      {step === 'passport' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Верификация директора/представителя как иностранца</p>
          <PassportLivenessStep passportNumber={passportNumber} onPassportNumberChange={setPassportNumber} onComplete={() => setStep('berkut')} />
        </div>
      )}

      {step === 'berkut' && (
        <BerkutStep
          passportNumber={passportNumber}
          onSuccess={() => setStep('fleet')}
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

      {step === 'fleet' && (
        <VehicleFleetStep
          onComplete={(fleetVehicles) => {
            setVehicles(fleetVehicles);
            setStep('drivers');
          }}
        />
      )}

      {step === 'drivers' && <DriverAssignStep vehicles={vehicles} onComplete={handleDriversComplete} />}
    </WizardShell>
  );
}
