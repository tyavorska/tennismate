# Pitfalls in the measuring

- Compare **element boxes**, not `Range` boxes. A Range returns the font's em box and sits a few pixels off the line box Figma reports.
- The frame width matters: measure at 1440 for a 1440 frame. A different window width makes every x look wrong.
- Frame heights can include Figma artifacts (a 100px spacer in a hug-less row). Decide with the user's policy before treating them as differences.
- The saved theme preference overrides `dataset.theme` after a reload and inside iframes. Set the theme, wait, and read it back before measuring.
- Smooth `scrollIntoView` does not progress in the embedded browser pane; use instant scrolling in code.
- A logged-in page needs a session. Do not create accounts or rows in the dev database without asking; if you did, tell the user what was created.
- After the user edits Figma, fetch the metadata again. Comparing with stale rectangles produces differences that are not there.
- Percent padding and `max()` with `%` resolve against the containing block's width, which is what the shared `--site-pad` relies on.
- `get_metadata` of a whole page can be saved to a file; parse it with `scripts/figma_metadata_to_rects.py` instead of reading it into context.
