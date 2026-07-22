import { useState } from 'react';

/** S-01 — согласие на обработку данных (путь eGov/БВУ, ТЗ 4.1). */
export function ConsentStep({ onAgree }: { onAgree: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="space-y-6">
      <p className="text-sm text-navy-600">
        Для оформления топливной карты JanarmAI необходимо ваше согласие на обработку персональных данных в системе учёта
        отпуска ГСМ.
      </p>
      <label className="flex items-start gap-3 rounded-xl border border-navy-100 p-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-navy-600"
        />
        <span className="text-sm text-navy-700">Я согласен(на) на обработку персональных данных</span>
      </label>
      <button
        type="button"
        disabled={!checked}
        onClick={onAgree}
        className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white disabled:opacity-40"
      >
        Согласен
      </button>
    </div>
  );
}
