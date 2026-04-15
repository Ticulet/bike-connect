import { useState } from 'react';
import { COMPONENT_CATEGORIES, VALIDATION_LIMITS } from '@bike-connect/shared';
import type { CreateComponent } from '@bike-connect/shared';
import './bikes.css';

interface ComponentFormValues {
  category: string;
  name: string;
  brand: string;
  model: string;
  installed_at: string;
  mileage_at_install: string;
  notes: string;
}

interface ComponentFormProps {
  initialValues?: Partial<ComponentFormValues>;
  onSubmit: (data: CreateComponent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function buildDefaults(initial?: Partial<ComponentFormValues>): ComponentFormValues {
  return {
    category: initial?.category ?? COMPONENT_CATEGORIES[0],
    name: initial?.name ?? '',
    brand: initial?.brand ?? '',
    model: initial?.model ?? '',
    installed_at: initial?.installed_at ?? '',
    mileage_at_install: initial?.mileage_at_install ?? '',
    notes: initial?.notes ?? '',
  };
}

function validate(values: ComponentFormValues): Partial<Record<keyof ComponentFormValues, string>> {
  const errors: Partial<Record<keyof ComponentFormValues, string>> = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required.';
  } else if (values.name.trim().length > VALIDATION_LIMITS.COMPONENT_NAME_MAX) {
    errors.name = `Name must be at most ${VALIDATION_LIMITS.COMPONENT_NAME_MAX} characters.`;
  }

  if (!COMPONENT_CATEGORIES.includes(values.category as (typeof COMPONENT_CATEGORIES)[number])) {
    errors.category = 'Invalid category.';
  }

  if (values.brand.trim().length > VALIDATION_LIMITS.COMPONENT_BRAND_MAX) {
    errors.brand = `Brand must be at most ${VALIDATION_LIMITS.COMPONENT_BRAND_MAX} characters.`;
  }

  if (values.model.trim().length > VALIDATION_LIMITS.COMPONENT_MODEL_MAX) {
    errors.model = `Model must be at most ${VALIDATION_LIMITS.COMPONENT_MODEL_MAX} characters.`;
  }

  if (values.mileage_at_install !== '') {
    const mileage = parseInt(values.mileage_at_install, 10);
    if (isNaN(mileage) || mileage < 0) {
      errors.mileage_at_install = 'Mileage must be a non-negative number.';
    }
  }

  if (values.notes.length > VALIDATION_LIMITS.COMPONENT_NOTES_MAX) {
    errors.notes = `Notes must be at most ${VALIDATION_LIMITS.COMPONENT_NOTES_MAX} characters.`;
  }

  return errors;
}

export function ComponentForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: ComponentFormProps): React.JSX.Element {
  const [values, setValues] = useState<ComponentFormValues>(() => buildDefaults(initialValues));
  const [errors, setErrors] = useState<Partial<Record<keyof ComponentFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ComponentFormValues, boolean>>>({});

  const isEdit = Boolean(initialValues?.name);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const newErrors = validate(values);
    setErrors(newErrors);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const allTouched: Partial<Record<keyof ComponentFormValues, boolean>> = {};
    for (const key of Object.keys(values) as Array<keyof ComponentFormValues>) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    const newErrors = validate(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const mileageStr = values.mileage_at_install.trim();
    onSubmit({
      category: values.category as (typeof COMPONENT_CATEGORIES)[number],
      name: values.name.trim(),
      brand: values.brand.trim() || undefined,
      model: values.model.trim() || undefined,
      installed_at: values.installed_at || undefined,
      mileage_at_install: mileageStr !== '' ? parseInt(mileageStr, 10) : undefined,
      notes: values.notes.trim() || undefined,
    });
  }

  function fieldError(field: keyof ComponentFormValues): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  return (
    <section className="component-form" aria-label={isEdit ? 'Edit component' : 'Add component'}>
      <h3 className="component-form__title">{isEdit ? 'Edit Component' : 'Add Component'}</h3>

      <form onSubmit={handleSubmit} noValidate>
        <div className="component-form__field-row">
          <div className="component-form__field">
            <label className="component-form__label component-form__label--required" htmlFor="cf-category">
              Category
            </label>
            <select
              id="cf-category"
              name="category"
              className="component-form__select"
              value={values.category}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-required="true"
            >
              {COMPONENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
            {fieldError('category') && (
              <span className="component-form__error" role="alert">
                {fieldError('category')}
              </span>
            )}
          </div>

          <div className="component-form__field">
            <label className="component-form__label component-form__label--required" htmlFor="cf-name">
              Name
            </label>
            <input
              id="cf-name"
              name="name"
              type="text"
              className="component-form__input"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-required="true"
              maxLength={VALIDATION_LIMITS.COMPONENT_NAME_MAX}
            />
            {fieldError('name') && (
              <span className="component-form__error" role="alert">
                {fieldError('name')}
              </span>
            )}
          </div>
        </div>

        <div className="component-form__field-row">
          <div className="component-form__field">
            <label className="component-form__label" htmlFor="cf-brand">
              Brand
            </label>
            <input
              id="cf-brand"
              name="brand"
              type="text"
              className="component-form__input"
              value={values.brand}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={VALIDATION_LIMITS.COMPONENT_BRAND_MAX}
            />
            {fieldError('brand') && (
              <span className="component-form__error" role="alert">
                {fieldError('brand')}
              </span>
            )}
          </div>

          <div className="component-form__field">
            <label className="component-form__label" htmlFor="cf-model">
              Model
            </label>
            <input
              id="cf-model"
              name="model"
              type="text"
              className="component-form__input"
              value={values.model}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={VALIDATION_LIMITS.COMPONENT_MODEL_MAX}
            />
            {fieldError('model') && (
              <span className="component-form__error" role="alert">
                {fieldError('model')}
              </span>
            )}
          </div>
        </div>

        <div className="component-form__field-row">
          <div className="component-form__field">
            <label className="component-form__label" htmlFor="cf-installed-at">
              Installed date
            </label>
            <input
              id="cf-installed-at"
              name="installed_at"
              type="date"
              className="component-form__input"
              value={values.installed_at}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <div className="component-form__field">
            <label className="component-form__label" htmlFor="cf-mileage">
              Mileage at install (km)
            </label>
            <input
              id="cf-mileage"
              name="mileage_at_install"
              type="number"
              className="component-form__input"
              value={values.mileage_at_install}
              onChange={handleChange}
              onBlur={handleBlur}
              min={0}
            />
            {fieldError('mileage_at_install') && (
              <span className="component-form__error" role="alert">
                {fieldError('mileage_at_install')}
              </span>
            )}
          </div>
        </div>

        <div className="component-form__field">
          <label className="component-form__label" htmlFor="cf-notes">
            Notes
          </label>
          <textarea
            id="cf-notes"
            name="notes"
            className="component-form__textarea"
            value={values.notes}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={3}
            maxLength={VALIDATION_LIMITS.COMPONENT_NOTES_MAX}
          />
          {fieldError('notes') && (
            <span className="component-form__error" role="alert">
              {fieldError('notes')}
            </span>
          )}
        </div>

        <div className="component-form__actions">
          <button
            type="submit"
            className="component-form__submit"
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Component'}
          </button>
          <button
            type="button"
            className="component-form__cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
