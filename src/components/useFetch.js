import { useCallback, useEffect, useState } from 'react';
import { api, errMsg } from '../api';

/** Loads data from GET url; returns { data, loading, error, reload }. */
export function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const key = JSON.stringify(params || {});

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(url, { params: JSON.parse(key) });
      setData(res.data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [url, key]);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}
