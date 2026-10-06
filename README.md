# ENGI 48915 Deep Learning for Engineering

Lecture slides and interactive demonstrations, Department of Engineering, Durham University.

**Live site:** enable GitHub Pages (Settings → Pages → Deploy from branch → `main`, folder `/ (root)`).
The site will appear at `https://nimageramiseresht.github.io/ENGI-48915---Deep-Learning-for-Engineering/`.

## Structure

```
index.html            landing page: choose a week
week1/index.html      Week 1 slides (reveal.js)
week1/widgets.js      Week 1 interactive diagrams
assets/css/tokens.css colours and fonts shared by every page
assets/css/deck.css   slide theme shared by every week
assets/js/deck.js     slide set-up shared by every week
assets/vendor/        reveal.js 5.2.1 and KaTeX 0.16 (stored locally, so slides work offline)
```

## Adding a week

1. Copy `week1/` to `week2/` and replace the slides inside `<div class="slides">`.
2. In `index.html`, edit the `WEEKS` list: give week 2 an `href: 'week2/'`, a title and a summary.

## Presenting

Arrow keys or space to advance, `Esc` for the overview, `F` for full screen, `S` for speaker view.
For a PDF, open a week with `?print-pdf` at the end of the address and print from Chrome.

To preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
