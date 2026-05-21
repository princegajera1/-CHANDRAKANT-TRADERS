export const amountToWords = (num) => {
  if (num === 0 || !num) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertGroup = (n) => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  };

  const convertWholeNumber = (numStr) => {
    if (numStr.length > 9) return 'Overflow';
    let n = ('000000000' + numStr).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{3})$/);
    if (!n) return ''; 
    
    let str = '';
    str += (n[1] != 0) ? convertGroup(Number(n[1])) + ' Crore ' : '';
    str += (n[2] != 0) ? convertGroup(Number(n[2])) + ' Lakh ' : '';
    str += (n[3] != 0) ? convertGroup(Number(n[3])) + ' Thousand ' : '';
    str += (n[4] != 0) ? convertGroup(Number(n[4])) : '';
    return str.trim();
  };

  const parts = num.toString().split('.');
  const rupees = parseInt(parts[0], 10);
  const paise = parts[1] ? parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10) : 0;

  let words = '';
  if (rupees > 0) {
    words += convertWholeNumber(rupees.toString());
  } else {
    words += 'Zero';
  }

  if (paise > 0) {
    words += ` Rupees and ${convertWholeNumber(paise.toString())} Paise Only`;
  } else {
    words += ' Rupees Only';
  }

  return words;
};

export const formatIndianNumber = (num) => {
  if (num === null || num === undefined) return '0.00';
  return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Also keep numberToWords for backward compatibility if used elsewhere without refactor
export const numberToWords = amountToWords;
