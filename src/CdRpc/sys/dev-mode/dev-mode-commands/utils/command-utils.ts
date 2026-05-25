// src/CdCli/sys/dev-mode/dev-mode-commands/utils/command-utils.ts

import { CdFxReturn } from '../../../../sys/base/i-base';
import { createCommand } from '../subcommands/create.command';
import { deleteCommand } from '../subcommands/delete.command';
import { deriveCommand } from '../subcommands/derive.command';
import { exitCommand } from '../subcommands/exit.command';
import { migrateCommand } from '../subcommands/migrate.command';
import { readCommand } from '../subcommands/read.command';
import { showCommand } from '../subcommands/show.command';
import { syncCommand } from '../subcommands/sync.command';
import { updateCommand } from '../subcommands/update.command';
import { upgradeCommand } from '../subcommands/upgrade.command';
import { CiCdService } from '../../../../sys/dev-descriptor/index';
import { testCommand } from '../subcommands/test.command';
import { scan } from 'rxjs';
import { scanCommand } from '../subcommands/scan.command';



export function getSubcommand(name: string) {
  console.log(`sub-command name: ${name}`);
  return SUBCOMMANDS[name] || null;
}



const SUBCOMMANDS = {
  show: showCommand,
  sync: syncCommand,
  exit: exitCommand,
  create: createCommand,
  read: readCommand,
  update: updateCommand,
  delete: deleteCommand,
  test: testCommand,
  upgrade: upgradeCommand,
  migrate: migrateCommand,
  derive: deriveCommand,
  scan: scanCommand,
};
