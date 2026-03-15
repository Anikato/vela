export function generateInquiryNumber(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INQ-${datePart}-${randomPart}`;
}
