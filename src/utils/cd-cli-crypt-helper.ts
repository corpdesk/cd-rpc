// import CdCliVaultController from "../cd-cli/controllers/cd-cli-vault.controller";
// import { CdVaultItem, EncryptionMeta } from "../cd-cli/index";

import { CdVaultItem, EncryptionMeta } from "../CdRpc/sys/cd-cli";
import CdCliVaultController from "../CdRpc/sys/cd-cli/controllers/cd-cli-vault.controller";

export async function resolveVaultPlaceholders(obj: any, cdVault: CdVaultItem[]): Promise<any> {
  if (typeof obj === "string") {
    const match = obj.match(/^#cdVault\[['"](.+?)['"]\]$/);
    if (match) {
      const key = match[1];
      const vaultItem = cdVault.find(v => v.name === key);
      if (!vaultItem) {
        throw new Error(`Vault item "${key}" not found.`);
      }

      if (vaultItem.isEncrypted) {
        if (!vaultItem.encryptedValue || !vaultItem.encryptionMeta?.iv) {
          throw new Error(`Vault item "${key}" missing encryption metadata.`);
        }

        return await CdCliVaultController.decrypt(
          { ...vaultItem.encryptionMeta, iv: vaultItem.encryptionMeta.iv as string } as EncryptionMeta & { iv: string },
          vaultItem.encryptedValue
        );
      } else {
        return vaultItem.value;
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => resolveVaultPlaceholders(item, cdVault)));
  }

  if (typeof obj === "object" && obj !== null) {
    const resolvedObj: any = {};
    for (const key of Object.keys(obj)) {
      resolvedObj[key] = await resolveVaultPlaceholders(obj[key], cdVault);
    }
    return resolvedObj;
  }

  return obj;
}
