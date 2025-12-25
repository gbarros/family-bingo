# UI Style Guide (Reference)

This project aims for a **distinct Christmas “handcrafted” feel** (not generic app UI), while staying **readable on phones**.

## Language

- Implementation discussions can be in English.
- **UI copy stays PT-BR**.

## Typography

- **Display**: `Playfair Display` for headings and “ceremonial” text.
- **Body**: `DM Sans` for UI labels, paragraphs, and form inputs.
- **Numbers**: `JetBrains Mono` for bingo numbers (tabular, bold, readable).

Rules of thumb:
- Prefer **2–3 type sizes per surface** (avoid too many competing scales).
- On mobile, avoid text sizes that exceed the container’s “math”: big numerals should **stack** rather than squeeze.

## Color & contrast

- Use the palette tokens consistently: `forest`, `crimson`, `gold`, `ivory`, `cocoa`.
- On dark backgrounds, prefer **solid gold** (`.text-gold-solid`) instead of gradient text.
- Avoid “muddy overlays” on text surfaces: texture/noise should be subtle.

## Layout & responsiveness

- Assume a baseline phone width of ~360px.
- Avoid fixed 5-column layouts on small screens unless each column is guaranteed readable.
- Avoid using `scale-*` for emphasis in dense lists; prefer **ring/shadow** so layout doesn’t jitter.

## Motion

- Use animation for high-impact moments (page load + number draw).
- Respect `prefers-reduced-motion`.


