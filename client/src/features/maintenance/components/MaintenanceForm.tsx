import { useState } from 'react';
import { MAINTENANCE_TYPES, VALIDATION_LIMITS } from '@bike-connect/shared';
import type { ComponentItem } from '../../bikes/api/components.api.js';
import type { MaintenanceLogItem, CreateMaintenancePayload } from '../api/maintenance.api.js';
import {
  createMaintenanceLog,
  updateMaintenanceLog,
} from '../api/maintenance.api.js';
import '../maintenance.css';

interface MaintenanceFormValues {
  type: string;
  title: string;
  description: string;
  component_id: string;
  cost: string;
  mileage_at_service: string;
  performed_at: string;
}

interface MaintenanceFormProps {
  bikeId: string;
  /** When provided, renders in edit mode. */
  logId?: string;
  components?: ComponentItem[];
  initialData?: MaintenanceLogItem;
  /** Called on successful submit with the resulting log entry. */
  onSuccess: (entry: MaintenanceLogItem) => void;
  /** Called when the user cancels. */
  onCancel: () => void;
}

function buildDefaults(initialData?: MaintenanceLogItem): MaintenanceFormValues {
  if (initialData !== undefined) {
    return {
      type: initialData.type,
      title: initialData.title,
      description: initialData.description ?? '',
      component_id: initialData.component_id ?? '',
      cost: initialData.cost !== null ? parseFloat(initialData.cost).toFixed(2) : '',
      mileage_at_service:
        initialData.mileage_at_service !== null ? String(initialData.mileage_at_service) : '',
      performed_at: initialData.performed_at,
    };
  }
  const today = new Date().toISOString().split('T')[0] ?? '';
  return {
    type: MAINTENANCE_TYPES[0],
    title: '',
    description: '',
    component_id: '',
    cost: '',
    mileage_at_service: '',
    performed_at: today,
  };
}

function validate(
  values: MaintenanceFormValues,
): Partial<Record<keyof MaintenanceFormValues, string>> {
  const errors: Partial<Record<keyof MaintenanceFormValues, string>> = {};

  if (!MAINTENANCE_TYPES.includes(values.type as (typeof MAINTENANCE_TYPES)[number])) {
    errors.type = 'Invalid maintenance type.';
  }

  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  } else if (values.title.trim().length > VALIDATION_LIMITS.MAINTENANCE_TITLE_MAX) {
    errors.title = `Title must be at most ${VALIDATION_LIMITS.MAINTENANCE_TITLE_MAX} characters.`;
  }

  if (values.description.length > VALIDATION_LIMITS.MAINTENANCE_DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${VALIDATION_LIMITS.MAINTENANCE_DESCRIPTION_MAX} characters.`;
  }

  if (values.cost !== '') {
    const costValue = parseFloat(values.cost);
    if (Number.isNaN(costValue) || costValue < 0) {
      errors.cost = 'Cost must be a non-negative number.';
    }
  }

  if (values.mileage_at_service !== '') {
    const mileage = parseInt(values.mileage_at_service, 10);
    if (Number.isNaN(mileage) || mileage < 0) {
      errors.mileage_at_service = 'Mileage must be a non-negative whole number.';
    }
  }

  if (!values.performed_at) {
    errors.performed_at = 'Date is required.';
  }

  return errors;
}

export function MaintenanceForm({
  bikeId,
  logId,
  components = [],
  initialData,
  onSuccess,
  onCancel,
}: MaintenanceFormProps): React.JSX.Element {
  const [values, setValues] = useState<MaintenanceFormValues>(() => buildDefaults(initialData));
  const [errors, setErrors] = useState<Partial<Record<keyof MaintenanceFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof MaintenanceFormValues, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = logId !== undefined;

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleBlur(
    event: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(values));
  }

  function fieldError(field: keyof MaintenanceFormValues): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const allTouched: Partial<Record<keyof MaintenanceFormValues, boolean>> = {};
    for (const key of Object.keys(values) as Array<keyof MaintenanceFormValues>) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    const newErrors = validate(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const payload: CreateMaintenancePayload = {
      type: values.type,
      title: values.title.trim(),
      performed_at: values.performed_at,
    };

    if (values.description.trim()) payload.description = values.description.trim();
    payload.component_id = values.component_id !== '' ? values.component_id : null;
    if (values.cost !== '') payload.cost = parseFloat(values.cost);
    if (values.mileage_at_service !== '') {
      payload.mileage_at_service = parseInt(values.mileage_at_service, 10);
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let result: MaintenanceLogItem;
      if (isEditMode && logId !== undefined) {
        result = await updateMaintenanceLog(bikeId, logId, payload);
      } else {
        result = await createMaintenanceLog(bikeId, payload);
      }
      onSuccess(result);
      if (!isEditMode) {
        // The drawer keeps this form mounted between opens, so clear it after a
        // create — otherwise the next "Log maintenance" shows the values just saved.
        setValues(buildDefaults());
        setErrors({});
        setTouched({});
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="maintenance-form"
      onSubmit={(e) => void handleSubmit(e)}
      noValidate
      aria-label={isEditMode ? 'Edit maintenance record' : 'Add maintenance record'}
    >
      {submitError !== null && (
        <p className="maintenance-form__submit-error" role="alert">{submitError}</p>
      )}

      <div className="maintenance-form__field-row">
        <div className="maintenance-form__field">
          <label className="maintenance-form__label maintenance-form__label--required" htmlFor="mf-type">
            Type
          </label>
          <select
            id="mf-type"
            name="type"
            className="maintenance-form__select"
            value={values.type}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-required="true"
            aria-describedby={fieldError('type') !== undefined ? 'mf-type-error' : undefined}
          >
            {MAINTENANCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          {fieldError('type') !== undefined && (
            <span id="mf-type-error" className="maintenance-form__error" role="alert">
              {fieldError('type')}
            </span>
          )}
        </div>

        <div className="maintenance-form__field">
          <label className="maintenance-form__label maintenance-form__label--required" htmlFor="mf-title">
            Title
          </label>
          <input
            id="mf-title"
            name="title"
            type="text"
            className="maintenance-form__input"
            value={values.title}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-required="true"
            maxLength={VALIDATION_LIMITS.MAINTENANCE_TITLE_MAX}
            aria-describedby={fieldError('title') !== undefined ? 'mf-title-error' : undefined}
          />
          {fieldError('title') !== undefined && (
            <span id="mf-title-error" className="maintenance-form__error" role="alert">
              {fieldError('title')}
            </span>
          )}
        </div>
      </div>

      <div className="maintenance-form__field">
        <label className="maintenance-form__label" htmlFor="mf-component">
          Component
        </label>
        <select
          id="mf-component"
          name="component_id"
          className="maintenance-form__select"
          value={values.component_id}
          onChange={handleChange}
          onBlur={handleBlur}
        >
          <option value="">None (bike-wide)</option>
          {components.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="maintenance-form__field">
        <label className="maintenance-form__label" htmlFor="mf-description">
          Description
        </label>
        <textarea
          id="mf-description"
          name="description"
          className="maintenance-form__textarea"
          value={values.description}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={4}
          maxLength={VALIDATION_LIMITS.MAINTENANCE_DESCRIPTION_MAX}
          aria-describedby={fieldError('description') !== undefined ? 'mf-description-error' : undefined}
        />
        {fieldError('description') !== undefined && (
          <span id="mf-description-error" className="maintenance-form__error" role="alert">
            {fieldError('description')}
          </span>
        )}
      </div>

      <div className="maintenance-form__field-row">
        <div className="maintenance-form__field">
          <label className="maintenance-form__label" htmlFor="mf-cost">Cost ($)</label>
          <input
            id="mf-cost"
            name="cost"
            type="number"
            className="maintenance-form__input"
            value={values.cost}
            onChange={handleChange}
            onBlur={handleBlur}
            min={0}
            step="0.01"
            aria-describedby={fieldError('cost') !== undefined ? 'mf-cost-error' : undefined}
          />
          {fieldError('cost') !== undefined && (
            <span id="mf-cost-error" className="maintenance-form__error" role="alert">
              {fieldError('cost')}
            </span>
          )}
        </div>

        <div className="maintenance-form__field">
          <label className="maintenance-form__label" htmlFor="mf-mileage">Mileage at service (km)</label>
          <input
            id="mf-mileage"
            name="mileage_at_service"
            type="number"
            className="maintenance-form__input"
            value={values.mileage_at_service}
            onChange={handleChange}
            onBlur={handleBlur}
            min={0}
            step="1"
            aria-describedby={fieldError('mileage_at_service') !== undefined ? 'mf-mileage-error' : undefined}
          />
          {fieldError('mileage_at_service') !== undefined && (
            <span id="mf-mileage-error" className="maintenance-form__error" role="alert">
              {fieldError('mileage_at_service')}
            </span>
          )}
        </div>
      </div>

      <div className="maintenance-form__field">
        <label className="maintenance-form__label maintenance-form__label--required" htmlFor="mf-performed-at">
          Date performed
        </label>
        <input
          id="mf-performed-at"
          name="performed_at"
          type="date"
          className="maintenance-form__input"
          value={values.performed_at}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-required="true"
          aria-describedby={fieldError('performed_at') !== undefined ? 'mf-performed-at-error' : undefined}
        />
        {fieldError('performed_at') !== undefined && (
          <span id="mf-performed-at-error" className="maintenance-form__error" role="alert">
            {fieldError('performed_at')}
          </span>
        )}
      </div>

      <div className="maintenance-form__actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Log entry'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
