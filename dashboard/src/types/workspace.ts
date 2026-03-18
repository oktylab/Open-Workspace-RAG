export interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  slug: string;
  api_key: string;
  allowed_origins: string[];
  tags: string[];
}

export interface WorkspaceCreate {
  name: string;
  url: string;
  slug: string;
}

export interface WorkspaceUpdate {
  name?: string;
  url?: string;
  slug?: string;
  allowed_origins?: string[];
  regenerate_api_key?: boolean;
}