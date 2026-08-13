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
            // NOTE: on mobile the form is a column, so flex-1 would resolve
            // flex-basis:0% against the vertical main axis and collapse the
            // input to content height — full width instead, flex-1 only on
            // the sm+ row layout where the main axis is horizontal.
            className="h-14 w-full rounded-pill border border-white/25 bg-white/15 px-6 text-[15px] text-cloud placeholder:text-cloud/55 focus:border-cloud/60 focus:outline-none sm:h-[52px] sm:w-auto sm:flex-1 sm:px-5 sm:text-sm"
          />
          <button
            type="submit"
            className="h-14 w-full shrink-0 rounded-pill bg-cloud px-8 text-[13px] font-medium tracking-nav text-ink transition-colors hover:bg-white sm:h-[52px] sm:w-auto"
          >
            SUBSCRIBE
          </button>
        </>
      )}
    </form>
  );
}
