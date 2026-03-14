export class BackupService {
  async createBackup(): Promise<{ backupPath: string }> {
    // TODO: produce filesystem backup artifact.
    return { backupPath: "TODO" };
  }

  async restoreBackup(backupPath: string): Promise<void> {
    void backupPath;
    // TODO: restore backup into active database.
  }
}
