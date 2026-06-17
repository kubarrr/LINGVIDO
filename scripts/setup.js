const fs = require("fs");
const path = require("path");

// Files that conflict with the correct versions and must be removed before build.
// Next.js 16: middleware.ts is deprecated, replaced by proxy.ts (detected by filename).
// Route groups: (app)/page.tsx etc. conflict with root-level pages.
const conflictFiles = [
  "src/middleware.ts",          // deprecated - replaced by src/proxy.ts
  "src/app/(app)/page.tsx",     // conflicts with src/app/page.tsx
  "src/app/(app)/album/page.tsx",   // conflicts with src/app/album/page.tsx
  "src/app/(app)/profile/page.tsx", // conflicts with src/app/profile/page.tsx
];

for (const file of conflictFiles) {
  const full = path.join(__dirname, "..", file);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
    console.log(`✓ Removed conflicting ${file}`);
  }
}
