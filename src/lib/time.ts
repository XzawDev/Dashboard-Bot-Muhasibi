import { toZonedTime, format } from "date-fns-tz";
import { id as localeId } from "date-fns/locale";

export const TIMEZONE = "Asia/Jakarta";

/** Mendapatkan objek Date saat ini dalam zona waktu WIB */
export function getNowWib() {
  return toZonedTime(new Date(), TIMEZONE);
}

/** Format tanggal menggunakan zona waktu WIB */
export function formatDateWib(date: Date, formatStr: string) {
  return format(date, formatStr, { timeZone: TIMEZONE, locale: localeId });
}

/** Mendapatkan string YYYY-MM-DD untuk hari ini di WIB */
export function getTodayWib() {
  return formatDateWib(getNowWib(), "yyyy-MM-dd");
}
