/**
 * Finalisasi story sebelum disimpan / ditampilkan — dipakai bersama oleh
 * /api/name-story, halaman shared /craft/name/[name], dan route OG
 * /og/name/[name] supaya SEMUA pembaca melihat story yang sama persis:
 *   - imagePrompt diperkuat (anti-vas, gaya katalog, tanpa makhluk hidup);
 *   - nama buket dijamin unik (tidak sama dengan katalog/input/kolam fallback);
 *   - tiap bunga dijamin punya nama puitis 1 kata.
 *
 * Tanpa helper ini, mutasi hanya terjadi di memori pada cache-hit API
 * (tanpa disimpan), sementara halaman shared & OG membaca row mentah dari
 * database — nama buket bisa tampil BEDA untuk nama input yang sama.
 */

import { enforceImagePrompt } from '@/lib/nameStoryImage';
import { ensureUniqueBouquetName } from '@/lib/bouquetNames';
import { enrichFlowerNames } from '@/lib/flowerPoeticNames';

/**
 * @param {object|null} story
 * @param {string} [name] nama input (untuk jaring pengaman nama buket)
 * @param {string[]} [catalogNames] daftar nama katalog (jaring pengaman)
 * @returns {object|null} story yang sama (dimutasi di tempat)
 */
export function finalizeNameStory(story, name, catalogNames = []) {
  if (!story) return story;
  enforceImagePrompt(story);
  ensureUniqueBouquetName(story, name || story?.nama || '', catalogNames);
  enrichFlowerNames(story);
  return story;
}
