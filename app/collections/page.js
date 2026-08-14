import { redirect } from 'next/navigation';

// Shop and Collections were merged into a single catalog page at /shop.
// Keep the old /collections route alive for bookmarks and old links.
export default function CollectionsPage() {
  redirect('/shop');
}
