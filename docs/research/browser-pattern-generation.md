# Browser/PWA feasibility for Knit-Pro MVP

Date: 2026-07-24  
Status: technical feasibility research  
Scope: the local-first MVP defined in the repository's [product boundaries](../../.scratch/knit-mvp/issues/07-set-mvp-product-boundaries.md), [image-to-chart behavior](../../.scratch/knit-mvp/issues/04-define-image-to-chart-behavior.md), [chart output contract](../../.scratch/knit-mvp/issues/03-define-knitting-output-contract.md), and [Yarn Inventory behavior](../../.scratch/knit-mvp/issues/05-define-yarn-inventory-and-substitution.md).

## Executive conclusion

**Fact.** The required workflow is technically feasible in a responsive browser/PWA without uploading source photos or Pattern Projects. Stable, broadly implemented platform primitives cover user-selected files, image decode, 2D pixel access, background computation, structured local storage, PNG generation, offline application caching, and ordinary file downloads. Native file sharing and direct save pickers are capability-dependent enhancements, not portable foundations. [S1] [S2] [S3] [S4] [S5] [S6] [S7]

**Recommendation.** Build the MVP as a capability-enhanced web app:

1. use `input[type=file]`, `createImageBitmap`, Canvas 2D, and a dedicated worker for the image pipeline;
2. use Pica for deterministic high-quality downsampling, Wu quantization for palette generation, and CIEDE2000 for final palette assignment and Yarn Inventory suggestions;
3. use IndexedDB as the authoritative local database and Cache Storage only for the versioned offline app shell;
4. generate a vector-first PDF with pdf-lib and a bounded raster PNG with Canvas;
5. expose explicit **Share** and **Save** actions when their APIs pass runtime capability checks, then fall back to a Blob download;
6. communicate that browser-local data is neither synchronized nor an adequate backup.

**Recommendation.** No native application, server-side image processor, cloud database, WebGL, WebGPU, or mandatory WebAssembly component is needed for the MVP. WebAssembly and `OffscreenCanvas` may be used by libraries or as optimizations, but correctness must not depend on them.

## Proposed technical shape

**Recommendation.** Keep a single canonical, serializable Pattern Project model. Store the original selected photo as a Blob; crop rectangle and rotation as non-destructive parameters; chart cells as palette indexes in a typed array; palette, symbols, stitch counts, and accepted Color Matches as structured fields. Regeneration should derive a new chart from the original photo and parameters, while manual palette edits remain a separate undoable layer. This matches the repository's definition of a Pattern Project and its confirmed regeneration behavior.

**Recommendation.** The processing flow should be:

1. user-selected `File`;
2. oriented decoded bitmap;
3. low-resolution crop/rotate preview for interaction;
4. one transformed crop at a bounded working size;
5. one high-quality reduction to the exact stitch grid;
6. palette generation with a requested maximum of 2–12 colors;
7. perceptual assignment of each grid sample to a palette entry;
8. immutable chart result posted back to the UI;
9. autosave of the project transactionally in IndexedDB;
10. independent rendering of screen preview, PDF, and PNG from the canonical chart.

**Recommendation.** Keep this separation so screen zoom, device pixel ratio, and export scale cannot change stitch data.

## Browser APIs and fallbacks

### Photo selection and decode

**Fact.** A file input lets a person select files from device storage, and `accept="image/*"` is a picker hint rather than proof that the bytes are a supported or valid image. Mobile systems may also offer camera or photo-library sources. The `capture` hint has limited availability and should not be required. Browser scripts receive a `File`, not arbitrary path access; the real local path is deliberately hidden. [S1] [S8]

**Recommendation.**

- Use `<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif">`, but validate size, MIME signature where practical, and successful decode.
- Treat JPEG, PNG, and WebP as the guaranteed product formats. Feature-test HEIC/HEIF by attempting decode and show an actionable “convert to JPEG/PNG” message on failure; image codec support varies by browser and OS.
- Do not request camera permission through `getUserMedia`; the requirement is selection, and file input gives the operating system control over its source UI.

**Fact.** `createImageBitmap(file)` is asynchronous, works in window and worker contexts, supports crop and resize options, and defaults to applying image orientation metadata (`imageOrientation: "from-image"`). `ImageBitmap` is transferable and has an explicit `close()` method for releasing its graphics resource. [S2] [S9]

**Recommendation.** Decode with `createImageBitmap(file, { imageOrientation: "from-image" })`. Fall back to an object URL plus `HTMLImageElement.decode()` and Canvas when bitmap decode fails or is unavailable. Include EXIF-orientation fixtures because historical decode paths have not always agreed. Close bitmaps and revoke object URLs as soon as the associated preview or operation is finished. [S9] [S10]

### Crop, rotate, resample, and pixel access

**Fact.** Canvas 2D supports transforms, drawing decoded images, and reading RGBA pixels through `getImageData()`. The HTML standard notes that frequent readback is an exception to the normal advantage of GPU-backed canvases and provides the `willReadFrequently` context hint. `OffscreenCanvas` can run rendering in a worker, decoupled from the DOM. [S3] [S11]

**Recommendation.**

- Store crop and rotation as source-image coordinates; never repeatedly resample the previous preview.
- Render the selected transform once into a working canvas, then resize once to exact chart width × height.
- Create the processing context with `{ willReadFrequently: true }` when repeated pixel reads are measured.
- Run decode/resample/quantization in a dedicated worker. Prefer `OffscreenCanvas` there when available; fall back to main-thread Canvas for drawing while keeping pure pixel quantization in the worker.
- Transfer `ImageBitmap`/`ArrayBuffer` objects instead of cloning large pixel buffers. Workers can perform computation without blocking UI work, and transferable objects can move ownership without copying the underlying data. [S12]

**Fact.** Canvas `imageSmoothingQuality` is not Baseline and therefore cannot define cross-browser output quality. Pica's primary documentation describes a browser resizer that selects among worker, WebAssembly, and JavaScript implementations, with a pure-JavaScript fallback; its default `mks2013` filter performs resize and sharpening. [S13] [S14]

**Recommendation.** Use Pica's default `mks2013` filter for the source-to-grid reduction, pinned to an audited version. Do not depend on native `drawImage()` smoothing quality for the chart-generation result. A simpler Canvas-only fallback may be retained for unsupported environments, but its result should be labeled as reduced-quality if visual regression tests show material differences.

### Palette reduction and Color Matches

**Fact.** Heckbert formalized color quantization as sampling image statistics, choosing a colormap, mapping colors to nearest colormap entries, and redrawing, and documented median-cut adaptive quantization. Wu's later quantizer uses variance-minimizing greedy orthogonal partitioning with efficiently precomputed statistics. These are established, deterministic families of palette-reduction algorithms. [S15] [S16]

**Recommendation.** Use Wu quantization to produce at most the selected 2–12 colors. The maintained implementation choice can be `image-q`, whose primary documentation exposes WuQuant and multiple color-distance formulas. Pin the dependency and add project-owned fixtures so replacement remains possible. [S17]

**Recommendation.** After generating the palette, assign each stitch-grid sample to the closest palette color with CIEDE2000 in CIELAB. Do not use error-diffusion dithering for the default chart: dithering intentionally represents colors through neighboring color patterns, while each chart cell is a literal stitch and isolated alternation would add knitting noise. An optional future “texture” mode would require separate product validation.

**Fact.** CIEDE2000 is a CIELAB color-difference formula. Sharma, Wu, and Dalal published implementation notes and supplemental reference pairs specifically to expose common implementation errors. Color.js provides sRGB/Lab conversion and `deltaE2000`; `image-q` also implements CIEDE2000 but documents it as comparatively slow. [S18] [S19] [S17]

**Recommendation.** Use one tested color implementation for both final chart assignment and Yarn Inventory ranking—preferably tree-shaken Color.js conversion/CIEDE2000 modules, or a small implementation verified against every Sharma test pair. Cache each palette and inventory color's Lab coordinates. With at most 12 chart colors, inventory ranking is small enough that CIEDE2000 cost is negligible compared with photo decode and resampling.

**Fact.** CSS hex/RGB values describe sRGB display colors; CIELAB is a separate color model reached through a defined conversion. A manually chosen display swatch does not measure the spectral reflectance, texture, dye lot, illumination, monitor calibration, or printed appearance of physical yarn. [S20]

**Recommendation.** Present matches as ranked suggestions, never “exact” matches. Keep the project's required swatches and qualitative difference indicator, but avoid universal labels such as “imperceptible” unless user research validates thresholds for this yarn-selection context. Warn that display-color matching is an aid and manual choice is authoritative.

### Local project and inventory persistence

**Fact.** IndexedDB is a transactional, indexed client-side database for significant amounts of structured data, including files/Blobs. Values supported by structured clone—including Blob, ArrayBuffer, typed arrays, and many other web types—can be stored. It is broadly available and can also be used from workers. [S4] [S21]

**Recommendation.** Make IndexedDB the sole authoritative store for:

- `projects`: project metadata, source Blob, crop/rotation parameters, generation settings, palette, chart indexes, edits, and schema version;
- `inventory`: Yarn Color fields and schema version;
- optionally `thumbnails`: small derived previews that can be deleted and rebuilt.

Write each logical autosave in one `readwrite` transaction. Use explicit schema migrations and preserve the previous complete project if a generation or export fails. Store source images as Blobs, not base64 strings. `localStorage` is string-only and limited to roughly 5 MiB for local data, so it is unsuitable for projects containing photos. [S6]

**Fact.** Browser-managed storage is best-effort by default. A browser can evict an origin under storage pressure, a person can clear site data, private-browsing data is generally removed when the private session ends, and quota exhaustion raises `QuotaExceededError`. `navigator.storage.estimate()` provides approximate usage/quota, while `navigator.storage.persist()` requests protection from automatic eviction but may be refused under browser-specific policy. [S6] [S22] [S23]

**Recommendation.**

- Request persistence only after the knitter has created or saved a meaningful project, and explain the benefit.
- Show “stored only on this device/browser; not synchronized or backed up” near project management, not only in legal copy.
- Detect private browsing only through failed capabilities/short-lived behavior rather than fingerprinting; show a warning when durable save cannot be confirmed.
- Handle `QuotaExceededError` without discarding the current in-memory chart. Offer deletion of old source photos/projects and retry.
- Display approximate storage usage when useful, without promising the reported quota is exact.
- Add an editable Pattern Project backup/export format soon after MVP. PDF and PNG satisfy knit-ready output but cannot restore the source photo and generation history.

**Fact.** The origin private file system (OPFS) is private to the origin, not directly visible as user files, is governed by origin quota, and can offer synchronous worker-only access handles. Clearing the site's storage also clears OPFS. [S5] [S24]

**Recommendation.** Do not introduce OPFS for the initial data model. IndexedDB already stores the expected structured records and Blobs. Reconsider OPFS only if profiling demonstrates that very large source-Blob or streaming-export access is a real bottleneck; it does not solve backup or user-visible save.

### Offline PWA behavior

**Fact.** A service worker can intercept requests and return cached responses when the network is unavailable. Cache Storage persists `Request`/`Response` pairs and is commonly populated during service-worker installation. Installed-PWA behavior and install criteria vary: Chromium uses manifest fields such as name, icons, start URL, and display mode; Firefox desktop does not currently provide manifest-driven PWA installation, while mobile and Safari installation paths differ. [S7] [S25]

**Recommendation.**

- Serve over HTTPS with a standards-based manifest (`name`, `short_name`, 192/512 icons, `start_url`, `scope`, `display: "standalone"`, theme/background colors).
- Precache only the versioned app shell, worker code, fonts needed by exports, and essential static assets.
- Keep Pattern Projects and Yarn Inventory in IndexedDB, not Cache Storage.
- Use an update strategy that never deletes old caches until the new shell is fully installed, then prompt before reloading if unsaved in-memory changes exist.
- Treat installation as progressive enhancement. All core creation, saving, reopening, and export behavior must work in a normal browser tab.

### PDF and high-resolution PNG export

**Fact.** Canvas `toBlob()` asynchronously creates an image Blob and browsers must support PNG. `toDataURL()` constructs the entire encoded image as an in-memory string and MDN recommends `toBlob()` for larger images. Canvas maximum dimensions are implementation- and device-dependent; MDN specifically notes a 4,096 × 4,096 limit on iOS devices and that exceeding a limit can make drawing fail. [S26] [S27]

**Recommendation.** Render PNG from canonical chart data to a dedicated export canvas, not by screenshotting the UI. Include grid, row/column coordinates, symbols, color key, dimensions, and stitch counts. Use integer pixel geometry, opaque backgrounds, embedded labels, and `toBlob("image/png")`. For MVP portability:

- cap a single PNG export at 4,096 pixels on either side;
- derive cell size within that limit and show the resulting pixel dimensions before export;
- reject or route oversized requests to PDF rather than silently returning a blank canvas;
- keep PDF as the scalable/printable format for charts whose legible one-page PNG would exceed the cap.

This is a conservative cross-device product limit, not a universal browser maximum. A future tiled/streaming PNG encoder could raise it after mobile memory testing.

**Fact.** pdf-lib runs in browsers and supports creating documents, drawing text/vector graphics, and embedding PNG/JPEG images. [S28]

**Recommendation.** Generate PDF vector-first with pdf-lib: draw grid lines, cell fills, symbols, coordinates, and color-key text as PDF primitives. Paginate large charts with repeated edge coordinates and key information rather than rasterizing one giant canvas. Embed a project-controlled font subset if non-ASCII yarn names must be guaranteed. Validate physical page size and print at 100% scale; do not use browser screenshots or HTML-to-canvas as the source of truth.

### Share and save

**Fact.** Web Share can pass files to an operating-system share target, requires HTTPS and transient user activation, and is not implemented uniformly. `navigator.canShare({ files })` is the required runtime check for a specific file payload. Firefox currently lacks file sharing through this API. `showSaveFilePicker()` likewise requires HTTPS and user activation and is not Baseline; it is available in Chromium but not Safari or Firefox. [S29] [S30] [S31]

**Recommendation.** Generate the Blob before the click only when generation is fast enough that activation is not lost, or generate it first and then enable a Share/Save button. On click:

1. wrap the Blob in a named `File`;
2. if `navigator.canShare?.({ files: [file] })`, offer **Share** and call `navigator.share`;
3. if `showSaveFilePicker` exists, offer **Save as…**, then write/close the returned writable handle;
4. always retain **Download** using an `<a download>` with a Blob URL;
5. revoke the object URL after it is no longer user-accessible.

Expose actions by capability instead of browser-name detection. Cancellation is normal, not an error. Do not claim that “Share” always saves into a photo library; destinations are selected by the operating system and vary by device. [S29] [S32]

## Compatibility summary

**Portable core:** file input, Blob/File, `createImageBitmap` with an image-element fallback, Canvas 2D, workers, IndexedDB, service workers/Cache Storage, `toBlob("image/png")`, and Blob URL downloads cover current evergreen browsers. [S1] [S2] [S3] [S4] [S7] [S12] [S26] [S32]

**Enhancements requiring feature detection:** `OffscreenCanvas`, file sharing through Web Share, `showSaveFilePicker`, storage persistence being granted, and install UI. The app must continue with main-thread Canvas, ordinary download, best-effort storage warnings, and browser-tab use when these enhancements are absent. [S11] [S23] [S25] [S29] [S31]

**Known product concern:** Firefox desktop supports the portable web-app core but not manifest-driven desktop installation or Web Share file payloads. Safari supports an install path and file sharing but not `showSaveFilePicker`. Therefore “installable” and “OS share/save” cannot mean identical UI on every desktop/browser combination. [S25] [S30] [S31]

## Privacy and security

**Fact.** A file input gives the page only files explicitly selected by the person; it does not grant arbitrary filesystem access. IndexedDB and OPFS are origin-scoped, but data remains readable to scripts executing in that origin. Canvas becomes unreadable after drawing a cross-origin image without CORS approval, whereas user-selected local files can be decoded directly without uploading them. [S8] [S4] [S24] [S33]

**Recommendation.**

- Perform all photo decode, processing, matching, persistence, and export locally.
- Make “photos stay on this device” a verifiable architecture property: no analytics payload, error attachment, remote font, image CDN, or logging path may contain source bytes, thumbnails, chart cells, filenames, project names, or Yarn Inventory.
- Use a strict Content Security Policy; self-host worker code, fonts, and dependencies; permit `blob:` only in the directives that need local previews/workers.
- Validate decoded dimensions before allocating canvases, bound input byte size and pixel count, catch decode bombs/out-of-memory failures, and strip unneeded image metadata from generated PNG/PDF.
- Do not load arbitrary remote image URLs in the MVP. This avoids canvas tainting, remote tracking, CORS failure, and an unnecessary server-side proxy.
- State that anyone with access to the same unlocked browser profile/device may be able to open local projects; origin storage is not user-authenticated encryption.

## Performance boundaries

**Fact.** A decoded raster commonly requires four bytes per pixel before additional working buffers. A 12-megapixel photo therefore needs about 48 MB for one RGBA buffer, and decode, transformed crop, resample, preview, and export buffers can coexist if not deliberately released. Browser canvas limits and available memory vary by browser, device, and GPU. [S34] [S27]

**Recommendation.** Adopt measured guardrails rather than promising arbitrary image/chart sizes:

- initial proposed input ceiling: 20 megapixels and 25 MB compressed, with clear validation errors;
- interactive preview longest edge: at most 2,048 pixels;
- generation working raster: no larger than needed for the crop and target grid; downsample early after the crop transform;
- initial chart ceiling: 300 × 300 stitches, subject to knitting-product validation;
- portable PNG ceiling: 4,096 pixels per side;
- only one generation job active per project; cancel superseded jobs and close/release old bitmaps and buffers;
- debounce slider changes, keep the last valid chart visible, and report coarse worker progress as required by the product behavior.

These numbers are proposed MVP budgets, not platform facts. Validate them on target low-memory phones before acceptance. Suggested experience budgets are: preview visible within 2 seconds of selecting a 12-megapixel JPEG, regenerated 150 × 150 chart within 1 second after debounce, and no long UI-thread task caused by quantization. Record p50/p95 time and peak memory on real devices; relax or tighten limits from evidence.

## Practical verification strategy

### Deterministic unit and algorithm tests

- Use synthetic RGBA fixtures so browser decoder/color-management differences do not obscure crop, rotate, resample, quantization, stitch-count, merge, and symbol tests.
- Verify all eight EXIF orientation cases with asymmetric photos.
- Test free-aspect crops, 90-degree rotations, unlocked dimensions, transparent PNG compositing onto the chosen opaque background, palette bounds 2 and 12, fewer unique source colors than requested, and deterministic tie-breaking.
- Run the complete Sharma CIEDE2000 reference set and assert the published differences within a documented floating-point tolerance. [S18]
- Assert Color Match sorting, stable ties, no automatic replacement, and warnings for palette entries below the chosen distinguishability policy.
- Assert every chart cell references a palette entry and that color-key stitch counts sum to width × height.

### Storage and resilience tests

- Round-trip projects containing source Blobs and typed chart indexes through IndexedDB; cover rename, duplicate, delete, inventory reuse, and schema migration.
- Simulate transaction abort, tab closure during autosave, failed decode, cancelled worker, `QuotaExceededError`, denied `persist()`, and unavailable storage. The previous saved project must remain reopenable.
- Manually test clear-site-data and private-browsing behavior; verify the product warning describes actual loss.
- Prime the service worker online, wait for activation/control, switch the context offline, reload, then create, edit, close, and reopen a project. Playwright can observe service workers in Chromium, but its own documentation says service-worker inspection is Chromium-only, so Safari/Firefox offline behavior also needs browser-specific/manual coverage. [S35]

### Export tests

- Parse generated PDFs to assert page count, page dimensions, required text, embedded font behavior, and vector drawing presence; print representative one-page and paginated charts at 100%.
- Decode generated PNGs and assert exact dimensions, PNG MIME/signature, opaque background, unblurred integer grid, key inclusion, and correspondence to canonical chart cells.
- Test boundaries immediately below/above the PNG dimension cap and force `toBlob()` failure handling.
- Golden-test representative 2-, 6-, and 12-color charts. Use exact pixels for the project-owned renderer and perceptual tolerances only where browser image decoding legitimately differs.

### Browser/device matrix

Automate the portable core on current and previous major releases of Chromium, Firefox, and WebKit. Add physical-device smoke tests on at least one current iPhone/iPad class device and one constrained Android phone because photo pickers, share sheets, installation, memory pressure, and canvas limits are not faithfully represented by desktop emulation.

Manually verify:

- file/photo-library selection and orientation;
- PWA installation and upgrade;
- offline cold launch after one successful online load;
- background/foreground and OS low-memory interruption;
- file sharing of both PDF and PNG;
- direct save where supported and Blob download everywhere;
- filenames with accents and long Yarn Color names;
- print readability, symbol distinction, and color-key completeness.

### Performance and leak tests

Instrument decode, transform, resample, quantization, IndexedDB write, PDF generation, and PNG encoding separately. Repeat regeneration/export 20 times while observing heap and process memory; retained object URLs, unclosed `ImageBitmap`s, worker buffers, or canvases should not grow without bound. Test the proposed maximums on real devices and preserve the results as benchmark fixtures.

## Decision and implementation sequence

**Recommendation: proceed with the browser/PWA MVP.** No feasibility blocker was found. The main engineering risks are bounded mobile memory, loss semantics of browser-local storage, cross-browser differences in install/share/save UX, and color suggestions being mistaken for physical-yarn measurements.

Implement in this order:

1. canonical Pattern Project schema plus IndexedDB migrations and loss messaging;
2. deterministic worker pipeline with bounded decode, crop/rotate, Pica resize, Wu palette, and CIEDE2000 tests;
3. chart renderer shared by preview/export semantics;
4. vector PDF and bounded PNG;
5. runtime-capability share/save/download actions;
6. offline app-shell service worker and manifest;
7. cross-browser, physical-device, storage-failure, and performance acceptance.

## Sources

Primary specifications, browser-vendor documentation, primary papers, and primary library documentation were preferred. Browser support statements are intentionally phrased as capabilities requiring runtime checks because support can change.

- **[S1]** MDN, [`<input type="file">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file).
- **[S2]** WHATWG HTML, [ImageBitmap and `createImageBitmap`](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#imagebitmap).
- **[S3]** WHATWG HTML, [the canvas element](https://html.spec.whatwg.org/multipage/canvas.html).
- **[S4]** MDN, [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).
- **[S5]** WHATWG, [File System Standard](https://fs.spec.whatwg.org/).
- **[S6]** MDN, [storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- **[S7]** MDN, [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) and [PWA caching](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching).
- **[S8]** MDN, [FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader).
- **[S9]** MDN, [`createImageBitmap()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap) and [ImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap).
- **[S10]** MDN, [using files from web applications](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications).
- **[S11]** MDN, [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas).
- **[S12]** MDN, [using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).
- **[S13]** MDN, [`imageSmoothingQuality`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingQuality).
- **[S14]** Nodeca, [Pica primary documentation](https://github.com/nodeca/pica/blob/master/README.md).
- **[S15]** Paul Heckbert, [“Color Image Quantization for Frame Buffer Display”](https://dl.acm.org/doi/10.1145/800064.801294), SIGGRAPH 1982.
- **[S16]** Xiaolin Wu, [“Efficient Statistical Computations for Optimal Color Quantization”](https://www.sciencedirect.com/science/article/abs/pii/B9780080507545500359), *Graphics Gems II*, 1991.
- **[S17]** Igor Bezkrovny, [image-q primary documentation](https://github.com/ibezkrovnyi/image-quantization/) and [API](https://ibezkrovnyi.github.io/image-quantization/).
- **[S18]** Sharma, Wu, and Dalal, [“The CIEDE2000 Color-Difference Formula: Implementation Notes, Supplementary Test Data, and Mathematical Observations”](https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/ciede2000noteCRNA.pdf) and [reference data](https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/).
- **[S19]** Color.js, [color-difference documentation](https://colorjs.io/docs/color-difference) and [API](https://colorjs.io/api/).
- **[S20]** W3C, [CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/).
- **[S21]** MDN, [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).
- **[S22]** MDN, [`StorageManager.estimate()`](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate).
- **[S23]** WHATWG, [Storage Standard](https://storage.spec.whatwg.org/) and MDN, [`StorageManager.persist()`](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist).
- **[S24]** MDN, [origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system); WebKit, [OPFS implementation notes](https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/).
- **[S25]** MDN, [making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) and [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest).
- **[S26]** MDN, [`HTMLCanvasElement.toBlob()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) and [`toDataURL()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL).
- **[S27]** MDN, [`<canvas>` maximum canvas size](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas#maximum_canvas_size).
- **[S28]** Hopding, [pdf-lib primary documentation](https://pdf-lib.js.org/) and [repository](https://github.com/Hopding/pdf-lib).
- **[S29]** W3C, [Web Share API](https://www.w3.org/TR/web-share/) and MDN, [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API).
- **[S30]** MDN, [`Navigator.share()` compatibility](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share#browser_compatibility).
- **[S31]** MDN, [`showSaveFilePicker()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker).
- **[S32]** MDN, [Blob URLs](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/blob) and [`download` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#download).
- **[S33]** MDN, [CORS-enabled images and tainted canvases](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image).
- **[S34]** web.dev, [image compression and decoded pixel memory](https://web.dev/articles/compress-images).
- **[S35]** Microsoft, [Playwright service-worker documentation](https://playwright.dev/docs/service-workers); Web Platform Tests, [cross-browser test suite](https://github.com/web-platform-tests/wpt).
