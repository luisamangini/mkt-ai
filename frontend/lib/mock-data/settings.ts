import type { PermissionRow, SettingsUser } from "@/types/settings";

export const settingsUsers: SettingsUser[] = [
  {
    id: "U-001",
    name: "Marcos Ferreira",
    email: "marcos@email.com",
    role: "admin",
    lastAccess: "Agora",
    status: "active",
  },
  {
    id: "U-002",
    name: "Camila Santos",
    email: "camila@empresa.com",
    role: "editor",
    lastAccess: "Ontem 18:30",
    status: "active",
  },
  {
    id: "U-003",
    name: "João Silva",
    email: "joao@empresa.com",
    role: "viewer",
    lastAccess: "Há 5 dias",
    status: "inactive",
  },
];

export const permissionRows: PermissionRow[] = [
  {
    feature: "Dashboard",
    admin: true,
    editor: true,
    viewer: true,
  },
  {
    feature: "Criar Conteúdo",
    admin: true,
    editor: true,
    viewer: false,
  },
  {
    feature: "Aprovar Conteúdo",
    admin: true,
    editor: true,
    viewer: false,
  },
  {
    feature: "Publicar Conteúdo",
    admin: true,
    editor: true,
    viewer: false,
  },
  {
    feature: "CRM — visualizar",
    admin: true,
    editor: true,
    viewer: true,
  },
  {
    feature: "CRM — editar leads",
    admin: true,
    editor: true,
    viewer: false,
  },
  {
    feature: "Campanhas",
    admin: true,
    editor: true,
    viewer: true,
  },
  {
    feature: "Configurações",
    admin: true,
    editor: false,
    viewer: false,
  },
];
