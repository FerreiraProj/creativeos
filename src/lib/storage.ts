import { Project, AiGatewayConfig } from '../types';

// Thin fetch wrappers around the server's Postgres-backed API. Every function here keeps
// the same name it had when this file talked to localStorage directly — only the call
// sites (App.tsx) needed to become async-aware.

async function parseJsonOrThrow(res: Response, action: string) {
  if (!res.ok) {
    let message = `Failed to ${action}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore — use default message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function getStoredProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects');
  return parseJsonOrThrow(res, 'load projects');
}

export async function createNewProject(name: string, description: string, codePrefix?: string): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, codePrefix }),
  });
  return parseJsonOrThrow(res, 'create project');
}

export async function duplicateProjectStructure(
  sourceProjectId: string,
  newName: string,
  newPrefix: string
): Promise<Project> {
  const res = await fetch(`/api/projects/${sourceProjectId}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newName, newPrefix }),
  });
  return parseJsonOrThrow(res, 'duplicate project');
}

export async function saveActiveProject(project: Project): Promise<Project> {
  const res = await fetch(`/api/projects/${project.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  return parseJsonOrThrow(res, 'save project');
}

export async function deleteStoredProject(projectId: string): Promise<Project[]> {
  const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
  return parseJsonOrThrow(res, 'delete project');
}

export async function getActiveProjectId(): Promise<string | null> {
  const res = await fetch('/api/settings/active-project');
  const data = await parseJsonOrThrow(res, 'load active project');
  return data.id ?? null;
}

export async function setActiveProjectId(id: string | null): Promise<void> {
  const res = await fetch('/api/settings/active-project', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  await parseJsonOrThrow(res, 'save active project');
}

export async function getStoredAiGatewayConfig(): Promise<AiGatewayConfig> {
  const res = await fetch('/api/settings/ai-gateway');
  return parseJsonOrThrow(res, 'load AI gateway settings');
}

export async function saveStoredAiGatewayConfig(config: AiGatewayConfig): Promise<void> {
  const res = await fetch('/api/settings/ai-gateway', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  await parseJsonOrThrow(res, 'save AI gateway settings');
}

export async function loadSampleNootrionProject(): Promise<Project> {
  const res = await fetch('/api/projects/seed-nootrion', { method: 'POST' });
  return parseJsonOrThrow(res, 'load Nootrion demo project');
}
