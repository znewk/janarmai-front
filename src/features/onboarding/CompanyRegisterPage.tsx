import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardShell } from './steps/WizardShell';
import { EcpBinStep, type EcpBinFormValues } from './steps/EcpBinStep';
import { GbdUlStep } from './steps/GbdUlStep';
import { VehicleFleetStep, type FleetVehicleDraft } from './steps/VehicleFleetStep';
import { DriverAssignStep, type DriverAssignment } from './steps/DriverAssignStep';
import { finalizeUlRegistration } from './registrationActions';

type Step = 'ecp-bin' | 'gbd-ul' | 'fleet' | 'drivers';
const STEP_ORDER: Step[] = ['ecp-bin', 'gbd-ul', 'fleet', 'drivers'];

/** Ветка ЮЛ-резидент (только приложение КМГ) — S-11..S-14 (ТЗ 4.4). Согласие на ПД получено на S-00. */
export function CompanyRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('ecp-bin');
  const [ecpBin, setEcpBin] = useState<EcpBinFormValues | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [vehicles, setVehicles] = useState<FleetVehicleDraft[]>([]);

  const stepIndex = STEP_ORDER.indexOf(step);

  const handleDriversComplete = (assignments: (DriverAssignment | null)[]) => {
    if (!ecpBin) return;
    finalizeUlRegistration({
      residency: 'resident',
      name: companyName,
      bin: ecpBin.bin,
      phone: ecpBin.phone,
      directorFio: ecpBin.directorFio,
      directorIdentifier: ecpBin.bin,
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
      title="Регистрация · ЮЛ-резидент"
      stepIndex={stepIndex}
      stepCount={STEP_ORDER.length}
      onBack={() => (step === 'ecp-bin' ? navigate('/register/kmg') : setStep('ecp-bin'))}
    >
      {step === 'ecp-bin' && (
        <EcpBinStep
          onComplete={(values) => {
            setEcpBin(values);
            setStep('gbd-ul');
          }}
        />
      )}

      {step === 'gbd-ul' && ecpBin && (
        <GbdUlStep
          bin={ecpBin.bin}
          onSuccess={(name) => {
            setCompanyName(name);
            setStep('fleet');
          }}
          onRetry={() => setStep('ecp-bin')}
        />
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
