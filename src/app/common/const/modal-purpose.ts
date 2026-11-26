/** What a modal does. Drives the purpose badge shown in every modal shell. */
export type ModalPurpose = 'create' | 'edit' | 'update' | 'view' | 'delete' | 'configure' | 'register' | 'confirm';

export interface ModalPurposeConfig {
  label: string;
  /** Tailwind classes for the badge (background + text). */
  tone: string;
}

export const MODAL_PURPOSES: Record<ModalPurpose, ModalPurposeConfig> = {
  create: { label: 'Nuevo', tone: 'bg-brand-50 text-brand-700' },
  edit: { label: 'Editar', tone: 'bg-amber-50 text-amber-700' },
  update: { label: 'Actualizar', tone: 'bg-amber-50 text-amber-700' },
  view: { label: 'Ver detalles', tone: 'bg-slate-100 text-slate-600' },
  delete: { label: 'Eliminar', tone: 'bg-red-50 text-red-700' },
  configure: { label: 'Configurar', tone: 'bg-brand-50 text-brand-700' },
  register: { label: 'Registrar', tone: 'bg-brand-50 text-brand-700' },
  confirm: { label: 'Confirmar', tone: 'bg-brand-50 text-brand-700' },
};
