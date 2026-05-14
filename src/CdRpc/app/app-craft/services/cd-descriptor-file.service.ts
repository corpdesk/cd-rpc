import * as fs from 'fs/promises';
import * as path from 'path';
import { formatISO } from 'date-fns';
// import { CdFileDescriptor } from './CdFileDescriptor';
import { v4 as uuidv4 } from 'uuid';
import {
  BaseDescriptor,
  CdChangeLogDescriptor,
  CdDocDescriptor,
  CdFileDescriptor,
  CdFileWrapper,
  CdRoadmapDescriptor,
} from '../../../sys/dev-descriptor/index.js';

/**
 * Service to manage descriptor files with consistent file metadata.
 */
export class CdDescriptorFileService<T extends BaseDescriptor> {
  constructor(private baseDir: string) {}

  private getFullPath(filename: string): string {
    return path.resolve(this.baseDir, filename);
  }

  async load(filename: string): Promise<CdFileWrapper<T> | null> {
    const filePath = this.getFullPath(filename);
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const data: CdFileWrapper<T> = JSON.parse(raw);
      return data;
    } catch (err) {
      console.warn(`⚠️ Failed to load descriptor: ${filePath}`, err);
      return null;
    }
  }

  async save(filename: string, descriptor: T, actor: string, origin = 'cd-cli'): Promise<void> {
    const now = new Date().toISOString();
    const filePath = this.getFullPath(filename);

    const newMeta: CdFileDescriptor = {
      createdAt: descriptor.fileMeta?.createdAt ?? now,
      lastUpdated: now,
      createdBy: descriptor.fileMeta?.createdBy ?? actor,
      updatedBy: actor,
      origin,
      version: descriptor.fileMeta?.version ?? '0.1.0',
    };

    const descriptorToSave: CdFileWrapper<T> = {
      descriptor: {
        ...descriptor,
        guid: descriptor.guid || uuidv4(),
        fileMeta: newMeta,
      },
      fileMeta: newMeta,
    };

    await fs.writeFile(filePath, JSON.stringify(descriptorToSave, null, 2), 'utf-8');
  }

  async updateFileMeta(
    filename: string,
    updateFn: (meta: CdFileDescriptor) => CdFileDescriptor,
  ): Promise<void> {
    const current = await this.load(filename);
    if (!current) return;

    const updatedMeta = updateFn(current.descriptor.fileMeta ?? {});
    current.descriptor.fileMeta = {
      ...current.descriptor.fileMeta,
      ...updatedMeta,
      lastUpdated: new Date().toISOString(),
    };

    await this.save(filename, current.descriptor, updatedMeta.updatedBy ?? 'system');
  }

  private async write<T>(filename: string, content: T): Promise<void> {
    const filePath = this.getFullPath(filename);
    const now = formatISO(new Date());

    const descriptor: CdFileWrapper<T> = {
      descriptor: content,
      fileMeta: {
        createdAt: now,
        lastUpdated: now,
        origin: 'cd-cli',
      },
    };

    await fs.writeFile(filePath, JSON.stringify(descriptor, null, 2), 'utf-8');
  }

  async writeDocumentation(doc: CdDocDescriptor, basePath: string): Promise<void> {
    const filename = path.join(basePath, 'doc.json');
    await this.write(filename, doc);
  }

  async writeRoadmap(roadmap: CdRoadmapDescriptor, basePath: string): Promise<void> {
    const filename = path.join(basePath, 'roadmap.json');
    await this.write(filename, roadmap);
  }

  async writeChangelog(changelog: CdChangeLogDescriptor, basePath: string): Promise<void> {
    const filename = path.join(basePath, 'changelog.json');
    await this.write(filename, changelog);
  }
}
