import { useState } from 'react';
import { BIKE_TYPES, VALIDATION_LIMITS } from '@bike-connect/shared';
import type { CreateBike } from '@bike-connect/shared';
import { ImageUploader } from '../../../components/ui/ImageUploader.js';
import './bikes.css';

interface BikeFormValues {
  name: string;
  brand: string;
  model: string;
  year: string;
  type: string;
  description: string;
  heroImageUrl: string;
  is_public: boolean;
}

interface BikeFormProps {
  initialValues?: Partial<BikeFormValues>;
  onSubmit: (data: CreateBike) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

const CURRENT_YEAR = new Date().getFullYear();

function buildDefaults(initial?: Partial<BikeFormValues>): BikeFormValues {
  return {
    name: initial?.name ?? '',
    brand: initial?.brand ?? '',
    model: initial?.model ?? '',
    year: initial?.year ?? String(CURRENT_YEAR),
    type: initial?.type ?? BIKE_TYPES[0],
    description: initial?.description ?? '',
    heroImageUrl: initial?.heroImageUrl ?? '',
    is_public: initial?.is_public ?? false,
  };
}

function validate(values: BikeFormValues): Partial<Record<keyof BikeFormValues, string>> {
  const errors: Partial<Record<keyof BikeFormValues, string>> = {};
  if (!values.name.trim()) {
    errors.name = 'Name is required.';
  } else if (values.name.trim().length > VALIDATION_LIMITS.BIKE_NAME_MAX) {
    errors.name = `Name must be at most ${VALIDATION_LIMITS.BIKE_NAME_MAX} characters.`;
  }
  if (!values.brand.trim()) {
    errors.brand = 'Brand is required.';
  } else if (values.brand.trim().length > VALIDATION_LIMITS.BIKE_BRAND_MAX) {
    errors.brand = `Brand must be at most ${VALIDATION_LIMITS.BIKE_BRAND_MAX} characters.`;
  }
  if (!values.model.trim()) {
    errors.model = 'Model is required.';
  } else if (values.model.trim().length > VALIDATION_LIMITS.BIKE_MODEL_MAX) {
    errors.model = `Model must be at most ${VALIDATION_LIMITS.BIKE_MODEL_MAX} characters.`;
  }
  const yearNum = parseInt(values.year, 10);
  if (!values.year || isNaN(yearNum)) {
    errors.year = 'Year is required.';
  } else if (yearNum < VALIDATION_LIMITS.BIKE_YEAR_MIN || yearNum > CURRENT_YEAR + 1) {
    errors.year = `Year must be between ${VALIDATION_LIMITS.BIKE_YEAR_MIN} and ${CURRENT_YEAR + 1}.`;
  }
  if (!BIKE_TYPES.includes(values.type as (typeof BIKE_TYPES)[number])) {
    errors.type = 'Invalid bike type.';
  }
  if (values.description.length > VALIDATION_LIMITS.BIKE_DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${VALIDATION_LIMITS.BIKE_DESCRIPTION_MAX} characters.`;
  }
  return errors;
}

export function BikeForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: BikeFormProps): React.JSX.Element {
  const [values, setValues] = useState<BikeFormValues>(() => buildDefaults(initialValues));
  const [errors, setErrors] = useState<Partial<Record<keyof BikeFormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof BikeFormValues, boolean>>>({});

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void {
    const { name, value, type } = event.target;
    const checked = type === 'checkbox' ? (event.target as HTMLInputElement).checked : undefined;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ?? false) : value,
    }));
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const newErrors = validate(values);
    setErrors(newErrors);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    // Mark all fields as touched
    const allTouched: Partial<Record<keyof BikeFormValues, boolean>> = {};
    for (const key of Object.keys(values) as Array<keyof BikeFormValues>) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    const newErrors = validate(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const yearNum = parseInt(values.year, 10);
    onSubmit({
      name: values.name.trim(),
      brand: values.brand.trim(),
      model: values.model.trim(),
      year: yearNum,
      type: values.type as (typeof BIKE_TYPES)[number],
      description: values.description.trim() || undefined,
      hero_image_url: values.heroImageUrl.trim() || null,
      is_public: values.is_public,
    });
  }

  function fieldError(field: keyof BikeFormValues): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  return (
    <form className="bike-form" onSubmit={handleSubmit} noValidate>
      <div className="bike-form__field">
        <label className="bike-form__label bike-form__label--required" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="bike-form__input"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-required="true"
          aria-describedby={fieldError('name') ? 'name-error' : undefined}
          maxLength={VALIDATION_LIMITS.BIKE_NAME_MAX}
        />
        {fieldError('name') && (
          <span id="name-error" className="bike-form__error" role="alert">
            {fieldError('name')}
          </span>
        )}
      </div>

      <div className="bike-form__field-row">
        <div className="bike-form__field">
          <label className="bike-form__label bike-form__label--required" htmlFor="brand">
            Brand
          </label>
          <input
            id="brand"
            name="brand"
            type="text"
            className="bike-form__input"
            value={values.brand}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-required="true"
            aria-describedby={fieldError('brand') ? 'brand-error' : undefined}
            maxLength={VALIDATION_LIMITS.BIKE_BRAND_MAX}
          />
          {fieldError('brand') && (
            <span id="brand-error" className="bike-form__error" role="alert">
              {fieldError('brand')}
            </span>
          )}
        </div>

        <div className="bike-form__field">
          <label className="bike-form__label bike-form__label--required" htmlFor="model">
            Model
          </label>
          <input
            id="model"
            name="model"
            type="text"
            className="bike-form__input"
            value={values.model}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-required="true"
            aria-describedby={fieldError('model') ? 'model-error' : undefined}
            maxLength={VALIDATION_LIMITS.BIKE_MODEL_MAX}
          />
          {fieldError('model') && (
            <span id="model-error" className="bike-form__error" role="alert">
              {fieldError('model')}
            </span>
          )}
        </div>
      </div>

      <div className="bike-form__field-row">
        <div className="bike-form__field">
          <label className="bike-form__label bike-form__label--required" htmlFor="year">
            Year
          </label>
          <input
            id="year"
            name="year"
            type="number"
            className="bike-form__input"
            value={values.year}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-required="true"
            aria-describedby={fieldError('year') ? 'year-error' : undefined}
            min={VALIDATION_LIMITS.BIKE_YEAR_MIN}
            max={CURRENT_YEAR + 1}
          />
          {fieldError('year') && (
            <span id="year-error" className="bike-form__error" role="alert">
              {fieldError('year')}
            </span>
          )}
        </div>

        <div className="bike-form__field">
          <label className="bike-form__label bike-form__label--required" htmlFor="type">
            Type
          </label>
          <select
            id="type"
            name="type"
            className="bike-form__select"
            value={values.type}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-required="true"
          >
            {BIKE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bike-form__field">
        <label className="bike-form__label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="bike-form__textarea"
          value={values.description}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={4}
          aria-describedby={fieldError('description') ? 'description-error' : undefined}
          maxLength={VALIDATION_LIMITS.BIKE_DESCRIPTION_MAX}
        />
        {fieldError('description') && (
          <span id="description-error" className="bike-form__error" role="alert">
            {fieldError('description')}
          </span>
        )}
      </div>

      <div className="bike-form__field">
        <span className="bike-form__label">Photo</span>
        {values.heroImageUrl !== '' && (
          <div className="bike-form__photo-preview">
            <img
              src={values.heroImageUrl}
              alt="Bike photo preview"
              className="bike-form__photo-preview-img"
            />
            <button
              type="button"
              className="btn bike-form__photo-remove"
              onClick={() => { setValues((prev) => ({ ...prev, heroImageUrl: '' })); }}
            >
              Remove photo
            </button>
          </div>
        )}
        <ImageUploader
          onUpload={(url) => { setValues((prev) => ({ ...prev, heroImageUrl: url })); }}
          label={values.heroImageUrl !== '' ? 'Replace photo' : 'Upload photo'}
        />
      </div>

      <div className="bike-form__field">
        <div className="bike-form__checkbox-row">
          <input
            id="is_public"
            name="is_public"
            type="checkbox"
            className="bike-form__checkbox"
            checked={values.is_public}
            onChange={handleChange}
          />
          <label className="bike-form__checkbox-label" htmlFor="is_public">
            Make this bike public
          </label>
        </div>
      </div>

      <div className="bike-form__save-bar">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
