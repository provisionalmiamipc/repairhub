import * as fs from 'fs';
import * as path from 'path';

export function resolveUpload(nameCandidates: string[] | string): string | null {
  const names = Array.isArray(nameCandidates) ? nameCandidates : [nameCandidates];
  const candidates = [] as string[];

  for (const name of names) {
    // relative to compiled __dirname (e.g. dist/src/service_orders -> dist/src/uploads)
    candidates.push(path.join(__dirname, '..', 'uploads', name));
    // project dist top-level copies
    candidates.push(path.join(process.cwd(), 'dist', 'src', 'uploads', name));
    candidates.push(path.join(process.cwd(), 'dist', 'uploads', name));
    // source locations
    candidates.push(path.join(process.cwd(), 'src', 'uploads', name));
    candidates.push(path.join(process.cwd(), 'uploads', name));
  }

  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch (e) {
      // ignore and continue
    }
  }
  return null;
}

export function resolveTemplate(nameCandidates: string[] | string): string | null {
  const names = Array.isArray(nameCandidates) ? nameCandidates : [nameCandidates];
  const candidates = [] as string[];

  for (const name of names) {
    // compiled templates (dist)
    candidates.push(path.join(__dirname, '..', '..', 'templates', 'emails', name));
    candidates.push(path.join(process.cwd(), 'dist', 'templates', 'emails', name));
    candidates.push(path.join(process.cwd(), 'dist', 'src', 'templates', 'emails', name));
    // source locations
    candidates.push(path.join(__dirname, '..', 'templates', 'emails', name));
    candidates.push(path.join(process.cwd(), 'src', 'templates', 'emails', name));
    candidates.push(path.join(process.cwd(), 'templates', 'emails', name));
  }

  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch (e) {
      // ignore
    }
  }
  return null;
}
