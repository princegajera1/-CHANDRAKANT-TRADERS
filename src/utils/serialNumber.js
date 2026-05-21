export function getNextSerialNumber() {
  const current = parseInt(
    localStorage.getItem('productSerialCounter') || '2019'
  );
  const next = current + 1;
  localStorage.setItem('productSerialCounter', next.toString());
  return next;
}

export function getCurrentSerialNumber() {
  return parseInt(
    localStorage.getItem('productSerialCounter') || '2019'
  );
}

export function peekNextSerialNumber() {
  const current = parseInt(
    localStorage.getItem('productSerialCounter') || '2019'
  );
  return current + 1;
}
