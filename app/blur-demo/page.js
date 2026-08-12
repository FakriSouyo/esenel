import ProgressiveBlur from '@/components/effects/ProgressiveBlur';

export const metadata = { title: 'Blur Demo — ESENEL' };

const BODY =
  'Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati, reiciendis eum vitae nostrum, temporibus repudiandae voluptatibus, natus iure ipsa velit odit quibusdam illum. Quaerat cumque laudantium libero reprehenderit perferendis quo nulla voluptate? Repellat tenetur labore exercitationem dicta libero voluptate suscipit, iusto ea assumenda. Ipsa enim, quidem atque modi error eaque, debitis perferendis, hic iste libero dignissimos ea!';

const paragraphs = Array.from({ length: 12 }, () => BODY);

export default function BlurDemoPage() {
  return (
    <main className="relative flex h-screen w-full flex-col items-center justify-center bg-[#F8F9F5] text-black/40">
      <ProgressiveBlur
        position="top"
        backgroundColor="#F8F9F5"
        height="160px"
        blurAmount="5px"
      />
      <ProgressiveBlur
        position="bottom"
        backgroundColor="#F8F9F5"
        height="160px"
        blurAmount="5px"
      />

      <div className="flex h-[calc(100vh-1rem)] w-full flex-col items-center overflow-y-auto">
        <div className="mt-40 grid content-start justify-items-center gap-6 pt-6 text-center text-black">
          <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-white after:to-black after:content-['']">
            Scroll down to see the effect
          </span>
        </div>

        <div className="mt-24 w-full max-w-lg space-y-20 px-5 pb-10 text-justify">
          {paragraphs.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
      </div>
    </main>
  );
}
