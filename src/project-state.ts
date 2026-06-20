export interface ProjectLoadMeta {
  isGroupProject?: boolean;
  projectId?: string;
  projectName?: string;
}

export interface CurrentProjectMeta {
  id: string | null;
  name: string | null;
  thumbnailDataUri: string | null;
}

let currentProjectId: string | null = null;
let currentProjectName: string | null = null;
let currentProjectThumbnailDataUri: string | null = null;

function normalizeString(value: any): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeThumbnailDataUri(value: any): string | null {
  const normalized = normalizeString(value);
  return normalized && normalized.indexOf('data:image/') === 0 ? normalized : null;
}

export function extractThumbnailDataUri(source: any): string | null {
  if (!source || typeof source !== 'object') {
    return null;
  }

  return normalizeThumbnailDataUri(source.thumbnailDataUri) ||
    normalizeThumbnailDataUri(source.thumbnail) ||
    normalizeThumbnailDataUri(source.projectThumbnailDataUri) ||
    (source.data && extractThumbnailDataUri(source.data)) ||
    (source.project && extractThumbnailDataUri(source.project)) ||
    null;
}

export function getProjectDataPayload(projectData: any): any {
  if (
    projectData &&
    typeof projectData === 'object' &&
    projectData.data &&
    projectData.data.dataset &&
    projectData.data.tableschema
  ) {
    return projectData.data;
  }
  return projectData;
}

export function attachThumbnailDataUri(projectData: any, thumbnailDataUri: string | null): any {
  if (projectData && thumbnailDataUri) {
    projectData.thumbnailDataUri = thumbnailDataUri;
  }
  return projectData;
}

export function rememberProjectThumbnail(thumbnailDataUri: string | null) {
  if (thumbnailDataUri) {
    currentProjectThumbnailDataUri = thumbnailDataUri;
  }
}

export function rememberProjectLoad(projectData: any, meta?: ProjectLoadMeta): any {
  const projectPayload = getProjectDataPayload(projectData);
  const projectObject = projectData && typeof projectData === 'object' ? projectData : {};
  const loadMeta = meta || {};
  const thumbnailDataUri = extractThumbnailDataUri(projectData) || extractThumbnailDataUri(projectPayload);

  currentProjectId = loadMeta.isGroupProject ?
    null :
    (normalizeString(loadMeta.projectId) ||
      normalizeString(projectObject.id) ||
      normalizeString(projectObject.project_id) ||
      currentProjectId);

  currentProjectName =
    normalizeString(loadMeta.projectName) ||
    normalizeString(projectObject.name) ||
    normalizeString(projectObject.title) ||
    currentProjectName;

  rememberProjectThumbnail(thumbnailDataUri);
  attachThumbnailDataUri(projectPayload, thumbnailDataUri);

  return projectPayload;
}

export function rememberProjectSave(meta: any, thumbnailDataUri?: string | null) {
  const project = meta && typeof meta.project === 'object' ? meta.project : null;

  currentProjectId =
    normalizeString(meta && meta.id) ||
    normalizeString(project && project.id) ||
    currentProjectId;

  currentProjectName =
    normalizeString(meta && meta.name) ||
    normalizeString(project && project.name) ||
    currentProjectName;

  rememberProjectThumbnail(thumbnailDataUri || extractThumbnailDataUri(meta));
}

export function getCurrentProjectMeta(): CurrentProjectMeta {
  return {
    id: currentProjectId,
    name: currentProjectName,
    thumbnailDataUri: currentProjectThumbnailDataUri,
  };
}

export function clearCurrentProjectMeta() {
  currentProjectId = null;
  currentProjectName = null;
  currentProjectThumbnailDataUri = null;
}
