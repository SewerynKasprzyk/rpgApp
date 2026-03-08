export interface ThreatLimit {
  id: string;
  label: string;
  maxBoxes: number;
  checked: boolean[];
}

export interface ThreatTag {
  id: string;
  tag: string;
  note: string;
  checkboxes: [boolean, boolean, boolean, boolean, boolean, boolean];
}

export interface ThreatStatus {
  id: string;
  label: string;
}

export interface ThreatMove {
  id: string;
  name: string;
  tags: ThreatTag[];
  statuses: ThreatStatus[];
}

export interface Threat {
  id: string;
  name: string;
  portraitUrl: string;
  limits: ThreatLimit[];
  tags: ThreatTag[];
  statuses: ThreatStatus[];
  moves: ThreatMove[];
}

export interface ThreatGroup {
  id: string;
  name: string;
  threats: Threat[];
}

export type CreateThreatGroupInput = Omit<ThreatGroup, "id">;
export type UpdateThreatGroupInput = Partial<Omit<ThreatGroup, "id">>;
