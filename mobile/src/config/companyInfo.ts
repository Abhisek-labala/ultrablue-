export const COMPANY_INFO = {
  brandName: "UltraBlue+",
  name: "AYUSH GREEN ENERGY",
  tagline: "High-Purity Genuine DEF & Industrial Lubricants for Fleets",
  manufacturer: "Ayush Green Energy",
  proprietor: "Mr. Anil Kumar Nayak",
  plantAddress: "At- Charampa, Dist- Bhadrak, Odisha, Pin- 756101, India",
  salesHotline: "+91 9853675971",
  supportPhone: "+91 9853675971",
  email: "ayush.greenenergy1@gmail.com",
  portalUrl: "https://ultrablueplus.com",
  gstin: "21AABCU9603R1ZM",
  cin: "U23209OR2026PTC048912",
  isStandard: "IS 17042 (PART 1): 2020",
  bisLicense: "CM/L-5200161078",
};

// Helper to convert numbers to Indian Rupee Words (matching web)
export const numberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(Number(num) || 0)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  return str ? str.trim() + ' Rupees Only' : 'Zero Rupees Only';
};
