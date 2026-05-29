/** Converte valores Prisma (Decimal, Date) para o formato JSON da API (snake_case). */

function num(v) {
  return v == null ? v : Number(v);
}

export function userToApi(user) {
  return { id: user.id, email: user.email };
}

export function clientToApi(client) {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    created_at: client.createdAt,
  };
}

export function budgetLineToApi(line) {
  return {
    id: line.id,
    project_id: line.projectId,
    description: line.description,
    quantity: num(line.quantity),
    unit_price: num(line.unitPrice),
    display_order: line.displayOrder,
  };
}

export function projectToApi(project, clientName) {
  return {
    id: project.id,
    client_id: project.clientId,
    name: project.name,
    description: project.description,
    status: project.status,
    iva_rate: num(project.ivaRate),
    profit_rate: num(project.profitRate),
    created_at: project.createdAt,
    updated_at: project.updatedAt,
    ...(clientName != null ? { client_name: clientName } : {}),
  };
}

export function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
