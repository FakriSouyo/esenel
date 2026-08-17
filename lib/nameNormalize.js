/**
 * Normalisasi nama jadi kunci cache yang deterministik untuk Supabase:
 * huruf kecil semua, tanpa spasi, tanpa karakter khusus/non-alfanumerik.
 * Aksen di-decompose dulu (é -> e) supaya "José" dan "Jose" satu kunci.
 * Contoh: "Fakhri Abdillah!" -> "fakhriabdillah", "Séléna" -> "selena"
 */
export function normalizeName(raw) {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // lepas tanda aksen (combining marks)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}
