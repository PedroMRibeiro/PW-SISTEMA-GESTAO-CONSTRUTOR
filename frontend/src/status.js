export const STATUS_LABELS = {
  orcamento: 'Orçamento',
  aprovada: 'Aprovada',
  em_curso: 'Em curso',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

export function statusBadgeClass(status) {
  return `badge badge-${status}`;
}
