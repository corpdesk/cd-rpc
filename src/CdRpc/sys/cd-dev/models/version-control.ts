/* eslint-disable style/operator-linebreak */
import type { VersionControlDescriptor } from './cd-dev-descriptor.model';
import { execSync } from 'node:child_process';
// Example Usage

/**
 * const descriptor = getVersionControlDescriptor('.');
    console.log(descriptor);
 */

export function getVersionControlDescriptor(
  repoPath: string,
): VersionControlDescriptor {
  const execGit = (command: string): string =>
    execSync(`git -C ${repoPath} ${command}`, { encoding: 'utf8' }).trim();

  const repositoryName =
    execGit('rev-parse --show-toplevel').split('/').pop() || 'unknown';
  const repositoryUrl = execGit('remote get-url origin');
  const branchName = execGit('rev-parse --abbrev-ref HEAD');
  const lastCommitHash = execGit('rev-parse HEAD');
  const lastCommitMessage = execGit('log -1 --pretty=%B').trim();
  const lastCommitAuthor = execGit('log -1 --pretty=%an');
  const lastCommitDate = execGit('log -1 --pretty=%ad --date=iso');

  return {
    repository: {
      name: repositoryName,
      url: repositoryUrl,
      type: 'git',
      remote: 'origin',
      description: 'A repository managed using Git',
    },
    branch: {
      name: branchName,
      type:
        branchName === 'main' || branchName === 'master' ? 'main' : 'custom',
      lastCommit: {
        hash: lastCommitHash,
        author: lastCommitAuthor,
        date: lastCommitDate,
        message: lastCommitMessage,
      },
      protection: {
        isProtected: branchName === 'main' || branchName === 'master',
        rules:
          branchName === 'main' || branchName === 'master'
            ? ['require pull request']
            : [],
      },
    },
    workflow: {
      strategy: 'gitflow',
      mergeMethod: 'merge',
      policies: {
        reviewRequired: true,
        ciChecksRequired: true,
      },
    },
    metadata: {
      creationDate: execGit('log --reverse --pretty=%ad --date=iso').split(
        '\n',
      )[0],
      lastUpdated: lastCommitDate,
      license: 'MIT', // Replace with dynamic lookup if needed
      language: 'TypeScript', // Replace with dynamic detection if needed
    },
  };
}
