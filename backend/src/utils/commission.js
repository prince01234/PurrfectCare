export const PLATFORM_COMMISSION_RATE = 0.1; // 10%

const roundCurrency = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const calculatePlatformCommission = (grossAmount) => {
  const safeGross = Number(grossAmount) || 0;
  return roundCurrency(safeGross * PLATFORM_COMMISSION_RATE);
};

export const calculateMerchantNetAmount = (grossAmount) => {
  const safeGross = Number(grossAmount) || 0;
  const fee = calculatePlatformCommission(safeGross);
  return roundCurrency(safeGross - fee);
};

export const getCommissionBreakdown = (grossAmount) => {
  const gross = roundCurrency(Number(grossAmount) || 0);
  const platformCommission = calculatePlatformCommission(gross);
  const merchantNet = roundCurrency(gross - platformCommission);

  return {
    gross,
    platformCommission,
    merchantNet,
    commissionRate: PLATFORM_COMMISSION_RATE,
  };
};
