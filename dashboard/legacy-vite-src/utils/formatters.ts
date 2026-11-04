/**
 * Standardized data formatting utilities for PovertyRadar SDGs
 * Adheres strictly to docs/design.md section 4.2 precision standards.
 */

export const formatPercent = (val: number | null | undefined, decimals: number = 2): string => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${val.toFixed(decimals)}%`;
};

export const formatYears = (val: number | null | undefined, decimals: number = 2): string => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${val.toFixed(decimals)} thn`;
};

export const formatCurrencyMillion = (valInThousandRupiah: number | null | undefined): string => {
  if (valInThousandRupiah === null || valInThousandRupiah === undefined || isNaN(valInThousandRupiah)) return '—';
  const millionVal = valInThousandRupiah / 1_000;
  return `Rp${millionVal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} jt`;
};

export const formatGRDPTrillion = (grdpMillion: number | null | undefined): string => {
  if (grdpMillion === null || grdpMillion === undefined || isNaN(grdpMillion)) return '—';
  const trillion = grdpMillion / 1_000_000;
  if (trillion >= 1.0) {
    return `Rp${trillion.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} T`;
  }
  const billion = grdpMillion / 1_000;
  return `Rp${billion.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`;
};

export const formatScore = (val: number | null | undefined, decimals: number = 4): string => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return val.toFixed(decimals);
};

export const formatDisparityRatio = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${val.toFixed(2)}x`;
};
