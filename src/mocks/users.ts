import type { SystemUser } from '../types'

export const mockUsers: SystemUser[] = [
  {
    id: 'u1', name: 'Leonardo Campos', initials: 'LC',
    role: 'ADMINISTRADOR', status: 'ATIVO',
    email: 'leonardo@garagepro.com.br', phone: '(11) 99999-0001',
    joinDate: '2024-01-10',
  },
  {
    id: 'u2', name: 'Carlos Mendes', initials: 'CM',
    role: 'MECANICO', status: 'ATIVO',
    email: 'carlos.mendes@garagepro.com.br', phone: '(11) 99999-0002',
    specialty: 'Motor e Câmbio', joinDate: '2024-02-01',
  },
  {
    id: 'u3', name: 'Rafael Oliveira', initials: 'RO',
    role: 'MECANICO', status: 'ATIVO',
    email: 'rafael.oliveira@garagepro.com.br', phone: '(11) 99999-0003',
    specialty: 'Elétrica Automotiva', joinDate: '2024-03-15',
  },
  {
    id: 'u4', name: 'Thiago Santos', initials: 'TS',
    role: 'MECANICO', status: 'ATIVO',
    email: 'thiago.santos@garagepro.com.br', phone: '(11) 99999-0004',
    specialty: 'Suspensão e Freios', joinDate: '2024-01-20',
  },
  {
    id: 'u5', name: 'Bruno Lima', initials: 'BL',
    role: 'MECANICO', status: 'INATIVO',
    email: 'bruno.lima@garagepro.com.br', phone: '(11) 99999-0005',
    specialty: 'Ar Condicionado', joinDate: '2024-04-10',
  },
  {
    id: 'u6', name: 'André Costa', initials: 'AC',
    role: 'MECANICO', status: 'ATIVO',
    email: 'andre.costa@garagepro.com.br', phone: '(11) 99999-0006',
    specialty: 'Manutenção Geral', joinDate: '2024-02-28',
  },
  {
    id: 'u7', name: 'Mariana Ferreira', initials: 'MF',
    role: 'RECEPCIONISTA', status: 'ATIVO',
    email: 'mariana.ferreira@garagepro.com.br', phone: '(11) 99999-0007',
    joinDate: '2024-01-15',
  },
  {
    id: 'u8', name: 'Juliana Rocha', initials: 'JR',
    role: 'RECEPCIONISTA', status: 'ATIVO',
    email: 'juliana.rocha@garagepro.com.br', phone: '(11) 99999-0008',
    joinDate: '2024-05-01',
  },
  {
    id: 'u9', name: 'Paulo Henrique', initials: 'PH',
    role: 'GERENTE', status: 'ATIVO',
    email: 'paulo.henrique@garagepro.com.br', phone: '(11) 99999-0009',
    joinDate: '2024-01-05',
  },
]
