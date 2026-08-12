'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) setDone(true);
      }}
    >
      {done ? (
        <p className="flex h-[52px] items-center rounded-pill border border-cloud/40 px-6 text-sm text-cloud">
          You&rsquo;re on the list — see you next month. ✿
        </p>
      ) : (
        <>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            aria-label="Email address"
            className="h-[52px] flex-1 rounded-pill border border-white/20 bg-white/10 px-5 text-sm text-cloud placeholder:text-cloud/50 focus:border-cloud/60 focus:outline-none"
          />
          <button
            type="submit"
            className="h-[52px] shrink-0 rounded-pill bg-cloud px-8 text-[13px] font-medium tracking-nav text-ink transition-colors hover:bg-white"
          >
            SUBSCRIBE
          </button>
        </>
      )}
    </form>
  );
}
