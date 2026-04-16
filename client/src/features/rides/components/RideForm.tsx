import { useState } from 'react';
import { VALIDATION_LIMITS } from '@bike-connect/shared';
import type { RideItem, CreateRidePayload } from '../api/rides.api.js';
import '../rides.css';

interface RideFormValues {
  distance_km: string;
  duration_min: string;
  date: string;
  notes: string;
}

interface RideFormProps {
  initialData?: RideItem;
  onSubmit: (data: CreateRidePayload) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

function buildDefaults(initialData?: RideItem): RideFormValues {
  if (initialData !== undefined) {
    return {
      distance_km: parseFloat(initialData.distance_km).toFixed(2),
      duration_min: initialData.duration_min !== null ? String(initialData.duration_min) : '',
      date: initialData.date,
      notes: initialData.notes ?? '',
    };
  }

  const today = new Date().toISOString().split('T')[0] ?? '';
  return {
    distance_km: '',
    duration_min: '',
    date: today,
    notes: '',
  };
}

function validate(values: RideFormValues): Partial<Record<keyof RideFormValues, string>> {
  const errors: Partial<Record<keyof RideFormValues, string>> = {};

  if (!values.distance_km.trim()) {
    errors.distance_km = 'Distance is required.';
  } else {
    const dist = parseFloat(values.distance_km);
    if (Number.isNaN(dist) || dist <= 0) {
      errors.distance_km = 'Distance must be a positive number.';
    } else if (dist > VALIDATION_LIMITS.RIDE_DISTANCE_MAX) {
      errors.distance_km = `Distance must be at most ${VALIDATION_LIMITS.RIDE_DISTANCE_MAX} km.`;
    } else if (!/^\d+(\.\d{1,2})?$/.test(values.distance_km.trim())) {
      errors.distance_km = 'Distance can have at most 2 decimal places.';
    }
  }

  if (values.duration_min.trim() !== '') {
    const dur = parseInt(values.duration_min, 10);
    if (Number.isNaN(dur) || dur <= 0 || !Number.isInteger(dur)) {
      errors.duration_min = 'Duration must be a positive whole number of minutes.';
    }
  }

  if (!values.date) {
    errors.date = 'Date is required.';
  }

  if (values.notes.length > VALIDATION_LIMITS.RIDE_NOTES_MAX) {
    errors.notes = `Notes must be at most ${VALIDATION_LIMITS.RIDE_NOTES_MAX} characters.`;
  }

  return errors;
}

export function RideForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: RideFormProps): React.JSX.Element {
  const [values, setValues] = useState<RideFormValues>(() => buildDefaults(initialData));
  const [errors, setErrors] = useState<Partial<Record<keyof RideFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof RideFormValues, boolean>>>({});

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleBlur(
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(values));
  }

  function fieldError(field: keyof RideFormValues): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const allTouched: Partial<Record<keyof RideFormValues, boolean>> = {};
    for (const key of Object.keys(values) as Array<keyof RideFormValues>) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    const newErrors = validate(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const payload: CreateRidePayload = {
      distance_km: parseFloat(values.distance_km),
      date: values.date,
    };

    if (values.duration_min.trim() !== '') {
      payload.duration_min = parseInt(values.duration_min, 10);
    }

    if (values.notes.trim()) {
      payload.notes = values.notes.trim();
    }

    await onSubmit(payload);
  }

  const isEdit = initialData !== undefined;

  return (
    <form
      className="ride-form"
      onSubmit={(e) => void handleSubmit(e)}
      noValidate
      aria-label={isEdit ? 'Edit ride' : 'Log ride'}
    >
      <h3 className="ride-form__title">{isEdit ? 'Edit Ride' : 'Log a Ride'}</h3>

      <div className="ride-form__field-row">
        <div className="ride-form__field">
          <label
            className="ride-form__label ride-form__label--required"
            htmlFor="rf-distance"
          >
            Distance (km)
          </label>
          <input
            id="rf-distance"
            name="distance_km"
            type="number"
            className="ride-form__input"
            value={values.distance_km}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-required="true"
            min="0.01"
            max={VALIDATION_LIMITS.RIDE_DISTANCE_MAX}
            step="0.01"
            aria-describedby={fieldError('distance_km') !== undefined ? 'rf-distance-error' : undefined}
          />
          {fieldError('distance_km') !== undefined && (
            <span id="rf-distance-error" className="ride-form__error" role="alert">
              {fieldError('distance_km')}
            </span>
          )}
        </div>

        <div className="ride-form__field">
          <label className="ride-form__label" htmlFor="rf-duration">
            Duration (minutes)
          </label>
          <input
            id="rf-duration"
            name="duration_min"
            type="number"
            className="ride-form__input"
            value={values.duration_min}
            onChange={handleChange}
            onBlur={handleBlur}
            min="1"
            step="1"
            aria-describedby={fieldError('duration_min') !== undefined ? 'rf-duration-error' : undefined}
          />
          {fieldError('duration_min') !== undefined && (
            <span id="rf-duration-error" className="ride-form__error" role="alert">
              {fieldError('duration_min')}
            </span>
          )}
        </div>
      </div>

      <div className="ride-form__field">
        <label
          className="ride-form__label ride-form__label--required"
          htmlFor="rf-date"
        >
          Date
        </label>
        <input
          id="rf-date"
          name="date"
          type="date"
          className="ride-form__input"
          value={values.date}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-required="true"
          aria-describedby={fieldError('date') !== undefined ? 'rf-date-error' : undefined}
        />
        {fieldError('date') !== undefined && (
          <span id="rf-date-error" className="ride-form__error" role="alert">
            {fieldError('date')}
          </span>
        )}
      </div>

      <div className="ride-form__field">
        <label className="ride-form__label" htmlFor="rf-notes">
          Notes
        </label>
        <textarea
          id="rf-notes"
          name="notes"
          className="ride-form__textarea"
          value={values.notes}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={3}
          maxLength={VALIDATION_LIMITS.RIDE_NOTES_MAX}
          aria-describedby={fieldError('notes') !== undefined ? 'rf-notes-error' : undefined}
        />
        {fieldError('notes') !== undefined && (
          <span id="rf-notes-error" className="ride-form__error" role="alert">
            {fieldError('notes')}
          </span>
        )}
      </div>

      <div className="ride-form__actions">
        <button
          type="submit"
          className="ride-form__submit"
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel !== undefined && (
          <button
            type="button"
            className="ride-form__cancel-btn"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
