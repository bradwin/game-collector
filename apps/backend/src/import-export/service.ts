export interface ExportPayload {
  exportedAt: string;
  games: unknown[];
  ownership: unknown[];
  purchases: unknown[];
}

export class ImportExportService {
  async exportData(): Promise<ExportPayload> {
    // TODO: collect and map domain data for export.
    return {
      exportedAt: new Date().toISOString(),
      games: [],
      ownership: [],
      purchases: []
    };
  }

  async importData(payload: ExportPayload): Promise<{ imported: number }> {
    void payload;
    // TODO: validate and persist imported records.
    return { imported: 0 };
  }
}
