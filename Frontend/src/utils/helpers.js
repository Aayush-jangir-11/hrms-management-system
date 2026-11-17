/**
 * Robust helper to safely extract array data from any backend response structure
 */
export const getArrayData = (res, fallbackKey) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (fallbackKey && Array.isArray(res?.[fallbackKey])) return res[fallbackKey];
  if (Array.isArray(res?.leaves)) return res.leaves;
  if (Array.isArray(res?.employees)) return res.employees;
  if (Array.isArray(res?.departments)) return res.departments;
  if (Array.isArray(res?.tasks)) return res.tasks;
  if (Array.isArray(res?.policies)) return res.policies;
  if (Array.isArray(res?.payrolls)) return res.payrolls;
  if (Array.isArray(res?.roles)) return res.roles;
  if (Array.isArray(res?.records)) return res.records;
  return [];
};
