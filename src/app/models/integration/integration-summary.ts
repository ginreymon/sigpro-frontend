// Response of GET /integration/orders-to-be-outbound/integration-summary/:
// counters of integration-status (rows and quantities per status).
export interface IntegrationSummary {
  total: number;
  integrated: number;
  pending: number;
  missing: number;
  integrated_quantity: number;
  pending_quantity: number;
  missing_quantity: number;
}
