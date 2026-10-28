export interface DiscoveredService {
  name: string;
  container: string;
  image: string;
  state: string;
  type: string;
}

export interface DiscoveredProject {
  name: string;
  deploymentPath: string;
  composeFile: string;
  registered: boolean;
  services: DiscoveredService[];
}

export interface DiscoveryResult {
  dockerAvailable: boolean;
  projects: DiscoveredProject[];
  filesystem: FoundProject[];
}

export interface FoundProject {
  name: string;
  path: string;
  stack: string[];
  composeFile: string;
  registered: boolean;
}

export interface ImportAllResult {
  ok: boolean;
  imported: number;
  servicesAdded: number;
  projects: { id: number; name: string; servicesAdded: number }[];
  failed: { name: string; error: string }[];
}
