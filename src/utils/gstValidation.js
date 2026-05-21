export const validateGSTIN = (gstin) => {
  if (!gstin) return { valid: true, error: '' };
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(gstin.toUpperCase())) {
    return { valid: false, error: 'Invalid GSTIN format (e.g. 24ABCDE1234F1Z5)' };
  }
  return { valid: true, error: '' };
};

export const validatePAN = (pan) => {
  if (!pan) return { valid: true, error: '' };
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(pan.toUpperCase())) {
    return { valid: false, error: 'Invalid PAN format' };
  }
  return { valid: true, error: '' };
};

export const extractPANFromGSTIN = (gstin) => {
  if (!gstin || gstin.length < 15) return '';
  return gstin.substring(2, 12).toUpperCase();
};

export const isGSTRegistered = (customer) => {
  return !!customer?.gstin;
};
