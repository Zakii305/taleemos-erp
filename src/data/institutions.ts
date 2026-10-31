export interface Institution {
  id: string;
  name: string;
  code: string;
  type: 'school' | 'academy' | 'college';
  status: 'active';
}

export const INSTITUTIONS: Institution[] = [
  { id: 'inst-1', name: 'TaleemOS Model School', code: 'TMS-001', type: 'school', status: 'active' },
  { id: 'inst-2', name: 'TaleemOS Academy Larkana', code: 'TAL-002', type: 'academy', status: 'active' },
  { id: 'inst-3', name: 'Shikarpur Public College', code: 'SPC-003', type: 'college', status: 'active' },
  { id: 'inst-4', name: 'Al-Noor School System', code: 'ANS-004', type: 'school', status: 'active' },
  { id: 'inst-5', name: 'Future Leaders Academy', code: 'FLA-005', type: 'academy', status: 'active' },
];
