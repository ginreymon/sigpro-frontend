import { DayOperationConfig } from '../interfaces/day-operation-config';

export const DAY_OPERATION_CONFIG: Record<string, DayOperationConfig> = {
  production: {
    moduleLabel: 'Módulo',
    summaryDescription: 'Vista detallada de la planificación del módulo para hoy.',
    planningDescription: 'Defina el módulo, el turno y los encomendados para iniciar.',
  },
  stamping: {
    moduleLabel: 'Máquina',
    summaryDescription: 'Vista detallada de la planificación de la máquina para hoy.',
    planningDescription: 'Defina la máquina, el turno y los encomendados para iniciar.',
  },
};
