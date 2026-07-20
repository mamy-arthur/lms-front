export interface AdminEvaluationNotesParams {
  /** Search term (formation name or trainee name — handled server-side). */
  q?: string;
  /** Filter by tenant/client id. */
  tenant_id?: string;
}
