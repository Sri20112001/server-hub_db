export interface OpStage {
  name: string;
  state: string;
}

export interface Operation {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  status: string;
  stage: string;
  stages: OpStage[];
  initiatedBy: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Backup {
  id: number;
  projectId: number;
  kind: string;
  sizeBytes: number;
  status: string;
  createdAt: string;
}
