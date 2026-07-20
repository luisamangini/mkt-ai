type PermissionCellProps = {
  allowed: boolean;
};

export function PermissionCell({ allowed }: PermissionCellProps) {
  return (
    <span
      aria-label={allowed ? "Permitido" : "Sem acesso"}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
        allowed ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
      }`}
    >
      {allowed ? "✓" : "×"}
    </span>
  );
}
