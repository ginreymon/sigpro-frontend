export function getInputIconClasses(invalid: boolean): string {
  const base = 'absolute right-3 top-9 cursor-pointer transition-colors duration-200 ease-in-out';
  const errorClasses = 'text-red-500 hover:text-red-700';
  const validClasses = 'text-brand-400 hover:text-brand-600';

  return `${base} ${invalid ? errorClasses : validClasses}`;
}
