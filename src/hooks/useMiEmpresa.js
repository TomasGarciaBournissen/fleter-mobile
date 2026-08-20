import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Resuelve la empresa activa del gerente autenticado (la primera de GET /api/empresas/mias).
// La mayoría de los gerentes tienen una sola empresa — si en el futuro se necesita
// selector de múltiples empresas, este hook es el lugar para agregarlo.
export function useMiEmpresa() {
  const [empresa, setEmpresa] = useState(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/api/empresas/mias');
      setEmpresa(data?.[0] ?? null);
    } catch {
      setEmpresa(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  return { empresa, idEmpresa: empresa?.id_empresa ?? null, cargando, recargar };
}
