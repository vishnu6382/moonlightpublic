/**
 * WhatsApp Link Helper
 * Strips non-digit characters, ensures country code, and encodes pre-filled message.
 */
export const DEFAULT_WHATSAPP_NUMBER = '919894486300';
export const DEFAULT_WHATSAPP_MESSAGE =
  'Hi, I would like to know about rooms and availability at Moon Light Resort.';

export function sanitizeWhatsAppNumber(input) {
  if (!input || typeof input !== 'string') return DEFAULT_WHATSAPP_NUMBER;
  const digitsOnly = input.replace(/\D/g, '');
  if (!digitsOnly || digitsOnly.length < 10) return DEFAULT_WHATSAPP_NUMBER;
  // If 10 digits (India standard mobile), prepend 91
  if (digitsOnly.length === 10) return `91${digitsOnly}`;
  return digitsOnly;
}

export function buildWhatsAppLink({ number, message, roomName } = {}) {
  const cleanNumber = sanitizeWhatsAppNumber(number);

  let finalMessage = message && typeof message === 'string' && message.trim().length > 0
    ? message.trim()
    : DEFAULT_WHATSAPP_MESSAGE;

  if (roomName && typeof roomName === 'string' && roomName.trim().length > 0) {
    finalMessage = `Hi, I would like to know about ${roomName.trim()} at Moon Light Resort.`;
  }

  const encodedMessage = encodeURIComponent(finalMessage);
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}
