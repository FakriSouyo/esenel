/**
 * Dummy response AI — bentuk & struktur persis seperti yang akan dihasilkan
 * DeepSeek (lihat lib/nameStoryPrompt.js), supaya UI bisa dilihat dulu
 * sebelum API DeepSeek disambungkan ke .env.
 *
 * Gaya bicaranya sama dengan aturan prompt: menyapa langsung dengan "kamu",
 * bukan menyebut nama dari luar. getDummyStory(name, catalogNames) memilih
 * namaBuket dari daftar nama katalog secara deterministik.
 */

const DEFAULT_NAMES = ['Alba', 'Annecy', 'Bali', 'Berlin', 'Colmar', 'Como', 'Kyoto', 'Oslo', 'Santorini', 'Tokyo'];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getDummyStory(name, catalogNames) {
  const n = String(name || '').trim() || 'Kamu';
  const pool = Array.from(new Set(catalogNames && catalogNames.length ? catalogNames : DEFAULT_NAMES));
  const namaBuket = pool[hashStr(n.toLowerCase()) % pool.length] || pool[0];
  return {
    nama: n,
    namaBuket,
    artiNama: `${n}, namamu terdengar seperti cahaya yang tidak perlu berteriak. Bunyinya lembut tapi tegas, dan meninggalkan kesan yang tenang, persis seperti cara kamu hadir di sebuah ruangan.`,
    maknaNama: `Kamu adalah orang yang mencintai dengan cara yang sederhana tapi dalam. Kamu tidak butuh banyak kata untuk membuat orang lain merasa aman, cukup kehadiranmu saja. Ada ketenangan yang selalu kamu bawa ke mana pun, dan orang orang di sekitarmu merasa dirawat tanpa pernah diminta. Sepertinya kamu lebih suka memperhatikan daripada bicara, tapi ketika kamu bicara, semua orang mendengar. Itulah bagian dari dirimu yang paling jarang disadari orang lain.`,
    cerita: `Di meja rangkai kami, kamu selalu terbayang sebagai buket yang tidak ramai tapi berkesan. Satu tangkai yang berdiri tegak, satu warna yang dipilih dengan hati-hati, dan sisanya dibiarkan berbicara pelan. Kamu bukan bunga pertama yang dilihat orang, tapi bunga yang paling diingat.`,
    bunga: [
      {
        nama: 'Anthurium',
        namaEn: 'glossy red anthurium',
        alasan: 'kamu mencintai dengan tulus dan tanpa banyak bicara, seperti anthurium yang diam tapi berani',
      },
      {
        nama: 'Tulip putih',
        namaEn: 'white tulips',
        alasan: 'keanggunanmu tenang, kamu tidak perlu pamer untuk terlihat indah',
      },
      {
        nama: 'Eustoma',
        namaEn: 'lavender eustoma',
        alasan: 'lembut dan anggun, seperti kesan pertama yang selalu kamu tinggalkan',
      },
      {
        nama: 'Bunga matahari kecil',
        namaEn: 'small golden sunflowers',
        alasan: 'kamu tahu cara membuat orang lain merasa hangat hanya dengan hadir',
      },
      {
        nama: 'Gypsophila',
        namaEn: 'airy gypsophila baby breath',
        alasan: 'detail kecil yang kamu perhatikan selalu melengkapi suasana, seperti baby breath yang mengisi celah',
      },
      {
        nama: 'Dusty miller',
        namaEn: 'silvery dusty miller foliage',
        alasan: 'ada sisi dalam dirimu yang abu abu keperakan, tenang dan tidak mudah goyah',
      },
      {
        nama: 'Lavender',
        namaEn: 'purple lavender sprigs',
        alasan: 'kehadiranmu menenangkan, seperti lavender yang membuat ruangan terasa damai',
      },
    ],
    imagePrompt:
      'product photo of a pastel bouquet with anthurium, white tulips, eustoma, small sunflowers, gypsophila and lavender, wrapped in warm kraft paper, soft neutral studio background, natural warm light, front view, tidy composition with breathing room around the bouquet, floral catalog photography',
  };
}
