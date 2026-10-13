# media/ (optional)

The easiest way to use your course videos and files is the **Video & Materials** page in the app → **Connect folder**.
The browser reads the folder directly; nothing is copied or uploaded.

Use this folder only to set up a fixed, curated mapping instead:

1. Copy (or symlink) your files into `media/`, for example `media/Gospel/Runs.mp4`.
2. Copy `manifest.example.json` to `manifest.json` and list each file's `path` (relative to `media/`),
   an optional display `title`, and the lesson ids it belongs to (`lessons`).
3. Reload the app. Manifest items appear in the library and are pinned to their lessons.

Everything in `media/` except this README and the example is git-ignored, so personal course files never get committed.

Lesson ids are listed in `js/lessons.js` (e.g. `g-runs`, `v-rootless`, `h-251`, `j-bossa`).
