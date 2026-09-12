# Video for the links page

Drop a vertical clip here named exactly:

    tiktok-preview.mp4

**Specs**
- Portrait 9:16 (1080 x 1920 is ideal)
- 6-12 seconds, it loops
- Under 3 MB — it autoplays, so weight matters
- No audio needed; it plays muted
- Export from the TikTok draft, or trim an existing post

The page plays it muted and looping, with a still frame as the poster.
**If this file is missing, the page shows the poster image instead** —
nothing breaks, so it is safe to deploy before the clip exists.

After adding the file, open `site/links/index.html` and set

    var HAS_TIKTOK_CLIP = true;

A second file named `tiktok-preview.webm` is used first if present
(smaller for the same quality), but the mp4 alone is fine.
