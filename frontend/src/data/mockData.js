export const agentData = [
  {
    id: 1,
    matricule: 'AG-001',
    first_name: 'Awa',
    last_name: 'Diop',
    phone: '77 001 2233',
    email: 'awa.diop@sindevstat.com',
    status: 'ACTIVE',
  },
  {
    id: 2,
    matricule: 'AG-002',
    first_name: 'Moussa',
    last_name: 'Sarr',
    phone: '77 223 8899',
    email: 'moussa.sarr@sindevstat.com',
    status: 'ACTIVE',
  },
  {
    id: 3,
    matricule: 'AG-003',
    first_name: 'Khadija',
    last_name: 'Faye',
    phone: '77 991 4400',
    email: 'khadija.faye@sindevstat.com',
    status: 'INACTIVE',
  },
]

export const equipementData = [
  {
    id: 1,
    type: 'TABLETTE',
    serial_number: 'TB-2024-8891',
    imei: '351746090112233',
    status: 'ASSIGNED',
    condition: 'GOOD',
  },
  {
    id: 2,
    type: 'CHARGEUR',
    serial_number: 'CH-2024-0442',
    imei: '',
    status: 'AVAILABLE',
    condition: 'GOOD',
  },
  {
    id: 3,
    type: 'POWERBANK',
    serial_number: 'PW-2024-7750',
    imei: '',
    status: 'MAINTENANCE',
    condition: 'NEEDS_REPAIR',
  },
]

export const affectationData = [
  {
    id: 1,
    equipement: 'TB-2024-8891',
    agent: 'AG-001',
    assigned_at: '2026-02-01',
    expected_return_at: '2026-06-01',
    is_active: true,
  },
  {
    id: 2,
    equipement: 'CH-2024-0442',
    agent: 'AG-002',
    assigned_at: '2026-01-12',
    expected_return_at: '2026-03-12',
    is_active: false,
  },
]

export const restitutionData = [
  {
    id: 1,
    affectation: 'AFT-0002',
    returned_at: '2026-01-20',
    condition: 'GOOD',
    notes: 'Retour en bon etat',
  },
  {
    id: 2,
    affectation: 'AFT-0005',
    returned_at: '2026-01-05',
    condition: 'DAMAGED',
    notes: 'Chargeur fissure',
  },
]

export const incidentData = [
  {
    id: 1,
    equipement: 'TB-2024-8891',
    agent: 'AG-001',
    incident_type: 'BREAKDOWN',
    status: 'OPEN',
    reported_at: '2026-02-02',
  },
  {
    id: 2,
    equipement: 'PW-2024-7750',
    agent: 'AG-003',
    incident_type: 'LOSS',
    status: 'CLOSED',
    reported_at: '2026-01-10',
  },
]
