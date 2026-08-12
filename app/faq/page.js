import BouncyAccordion from '@/components/faq/BouncyAccordion';

export const metadata = { title: 'FAQ — ESENEL' };

const faqItems = [
  {
    icon: 'flower',
    q: 'How long do bouquets last?',
    a: 'With fresh water and a cool spot away from direct sunlight, most ESENEL bouquets stay beautiful for around 5–7 days, with some flowers lasting longer.',
  },
  {
    icon: 'sparkles',
    q: 'Can I customize my bouquet?',
    a: 'Yes — visit the Craft page to choose your size, flowers, and wrapping, and build a bouquet entirely your own.',
  },
  {
    icon: 'leaf',
    q: 'Can I request specific flowers?',
    a: 'Within the options available in Craft, yes. For flowers outside our current seasonal selection, reach out to us directly and we\'ll let you know what\'s possible.',
  },
  {
    icon: 'calendar',
    q: 'Can I schedule delivery?',
    a: 'Delivery windows can be selected at checkout, subject to availability in your area.',
  },
  {
    icon: 'message',
    q: 'Can I add a message?',
    a: 'Yes — a note can be added to any order during checkout, and will be included with your delivery.',
  },
  {
    icon: 'shuffle',
    q: 'What happens if a flower is unavailable?',
    a: 'Because our flowers are seasonal, an unavailable stem may occasionally be substituted with one of similar character and color. We\'ll always aim to keep the spirit of the arrangement intact.',
  },
  {
    icon: 'droplets',
    q: 'How should I care for my bouquet?',
    a: 'Trim stems at an angle when they arrive, change the water every two days, and keep your bouquet away from direct heat and direct sunlight.',
  },
];

export default function FaqPage() {
  return (
    <main className="bg-white pt-40 pb-28">
      <div className="container-esenel max-w-2xl">
        <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-4">FAQ</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.1] mb-14">
          Frequently asked questions
        </h1>
        <BouncyAccordion items={faqItems} />
      </div>
    </main>
  );
}
