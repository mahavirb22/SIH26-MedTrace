import React, { useState, useEffect } from 'react';
import Button from './Button';
import FormInput from './FormInput';

/**
 * Interactive Pill Reminder & Dose Alarm Modal for Patients.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.medicine
 * @param {Object} [props.existingAlarm]
 * @param {Function} props.onClose
 * @param {Function} props.onSave
 * @param {Function} props.onRemove
 */
export default function PillReminderModal({ isOpen, medicine, existingAlarm, onClose, onSave, onRemove }) {
  const [frequency, setFrequency] = useState('twice'); // once, twice, thrice, custom
  const [time1, setTime1] = useState('08:00');
  const [time2, setTime2] = useState('20:00');
  const [time3, setTime3] = useState('14:00');
  const [instruction, setInstruction] = useState('After Meals');
  const [durationDays, setDurationDays] = useState('7');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (existingAlarm) {
      setFrequency(existingAlarm.frequency || 'twice');
      setTime1(existingAlarm.times?.[0] || '08:00');
      setTime2(existingAlarm.times?.[1] || '20:00');
      setTime3(existingAlarm.times?.[2] || '14:00');
      setInstruction(existingAlarm.instruction || 'After Meals');
      setDurationDays(String(existingAlarm.durationDays || '7'));
      setEnabled(existingAlarm.enabled ?? true);
    } else {
      setFrequency('twice');
      setTime1('08:00');
      setTime2('20:00');
      setTime3('14:00');
      setInstruction('After Meals');
      setDurationDays('7');
      setEnabled(true);
    }
  }, [existingAlarm, isOpen]);

  if (!isOpen || !medicine) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    let times = [time1];
    if (frequency === 'twice') times = [time1, time2];
    if (frequency === 'thrice') times = [time1, time3, time2];
    if (frequency === 'custom') times = [time1, time2].filter(Boolean);

    const alarmData = {
      medicineId: medicine.id,
      medicineName: medicine.name,
      dosage: medicine.dosage,
      frequency,
      times,
      instruction,
      durationDays: parseInt(durationDays, 10) || 7,
      enabled,
      createdAt: new Date().toISOString(),
    };

    onSave(alarmData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl flex flex-col gap-6 font-body">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-2xl">alarm_add</span>
            </div>
            <div>
              <h3 className="font-headline text-xl font-bold text-primary">Set Dose Alarm & Reminder</h3>
              <p className="text-xs text-outline">Schedule daily medication notifications</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Selected Medicine Info Banner */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex items-center justify-between">
          <div>
            <h4 className="font-headline text-base font-bold text-primary">{medicine.name}</h4>
            <p className="text-xs text-on-surface-variant mt-0.5">{medicine.dosage || 'Prescription Medication'}</p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
            Batch #{medicine.id}
          </span>
        </div>

        {/* Alarm Config Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Frequency Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-caps text-outline uppercase font-bold">Dose Frequency</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: 'once', label: 'Once Daily' },
                { id: 'twice', label: 'Twice Daily' },
                { id: 'thrice', label: 'Thrice Daily' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrequency(f.id)}
                  className={`py-2.5 px-3 rounded-xl font-semibold transition-all border text-center ${
                    frequency === f.id
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:border-primary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alarm Times Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-caps text-outline uppercase font-bold">Alarm Times</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-outline block mb-1">Dose 1 (Morning):</span>
                <input
                  type="time"
                  value={time1}
                  onChange={(e) => setTime1(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-2.5 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary"
                  required
                />
              </div>

              {(frequency === 'twice' || frequency === 'thrice') && (
                <div>
                  <span className="text-[11px] text-outline block mb-1">
                    {frequency === 'thrice' ? 'Dose 2 (Afternoon):' : 'Dose 2 (Night):'}
                  </span>
                  <input
                    type="time"
                    value={frequency === 'thrice' ? time3 : time2}
                    onChange={(e) => (frequency === 'thrice' ? setTime3(e.target.value) : setTime2(e.target.value))}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-2.5 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              )}

              {frequency === 'thrice' && (
                <div>
                  <span className="text-[11px] text-outline block mb-1">Dose 3 (Night):</span>
                  <input
                    type="time"
                    value={time2}
                    onChange={(e) => setTime2(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-2.5 text-xs font-mono font-bold text-primary focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Meal Instructions */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-caps text-outline uppercase font-bold">Meal Instruction</label>
            <select
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="After Meals">After Meals (With Water)</option>
              <option value="Before Meals">Before Meals (Empty Stomach)</option>
              <option value="With Food">With Food / Breakfast</option>
              <option value="At Bedtime">At Bedtime</option>
              <option value="As Needed">As Needed (PRN)</option>
            </select>
          </div>

          {/* Duration Days */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-caps text-outline uppercase font-bold">Course Duration</label>
            <div className="flex items-center gap-2">
              {['5', '7', '14', '30'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationDays(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    durationDays === d
                      ? 'bg-secondary-container text-primary font-bold border-secondary-container'
                      : 'bg-surface border-outline-variant/30 text-outline'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/20">
            {existingAlarm ? (
              <button
                type="button"
                onClick={() => onRemove(medicine.id)}
                className="text-xs font-bold text-error hover:underline"
              >
                Delete Alarm
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex gap-3">
              <Button variant="ghost" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" icon={<span className="material-symbols-outlined text-sm">notifications_active</span>}>
                {existingAlarm ? 'Update Alarm' : 'Save Dose Alarm'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
