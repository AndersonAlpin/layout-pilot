# LayoutPilot MVP Readiness Review

Date: 2026-05-30

Scope reviewed: Manifest V3 metadata, popup activation flow, Inspect Mode, Review Mode, snapshot/copy/download/PDF flows, shared geometry helpers, localization, README, and Chrome Web Store readiness.

External references checked:

- Chrome Web Store Program Policies: https://developer.chrome.com/docs/webstore/program-policies/policies
- Chrome Web Store quality guidelines: https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines/
- Chrome Web Store privacy fields: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- Chrome Web Store best practices: https://developer.chrome.com/docs/webstore/best-practices

> 🚀 = prioridade agora (mínimo para publicar). Itens sem marca são pós-lançamento.

## P0 - Launch Blockers

1. ✅ Add Chrome Web Store privacy/disclosure material before submission.

   > Feito: `site/dist` contem a pagina de privacidade em EN, PT-BR e ES, com declaracao local-first, sem backend, sem tracking e sem compartilhamento com terceiros.

   The extension captures visible tab screenshots, inspects page content/classes/styles, writes to clipboard, and stores local preferences. `manifest.json` keeps permissions narrow (`activeTab`, `scripting`, `storage`), which is good, but the store listing still needs accurate privacy fields and a privacy policy URL. Document that data is processed locally unless that changes.

   Files: `manifest.json`, `src/background.js`, `src/content/review-snapshot.js`, `src/content/context-export.js`, `src/content/clipboard.js`

2. ✅ Add a release packaging and validation path.

   > Feito: `npm run package` usa `tools/package-extension.js` para validar referencias do manifest, montar staging temporario e gerar `dist/layout-pilot.zip`.

   Keep the manual release routine as: targeted `node --check`, `npm test`, `git diff --check`, then `npm run package`.

3. ✅ Handle popup injection failures explicitly.

   > Feito: o handler do `toggleButton` agora tem `catch` e mostra `popup.status.injectionFailed` (chave adicionada em en/pt-BR/es).

   `ensureContentScript()` injects CSS/scripts, but `toggleButton` does not catch failures from `chrome.scripting.insertCSS` or `executeScript`. On restricted or unusual pages, the popup can fail without a clear user-facing status.

   Files: `src/popup/popup.js:202`, `src/popup/popup.js:235`

4. 🚀 Decide license and public distribution stance.

   > Decisão: distribuição pública e gratuita (sem cobrança). Pendente: licença do código no repositório (MIT/Apache se permitir reuso, ou proprietário grátis).

   `README.md` says no license has been added. If this is going public or shared with customers, add the intended license or explicitly keep it proprietary in docs/release materials.

   File: `README.md:89`

## P1 - Bugs Or Risky MVP Behavior

1. ✅ Area mark minimum-size check likely allows accidental 1px lines.

   > Feito: `&&` trocado por `||` em `review-mode.js` (cancela quando qualquer dimensão fica abaixo do mínimo).

   Current logic cancels only when both dimensions are below the minimum. A selection with width `1px` and height `100px` still becomes an area mark. For a rectangle tool, this should probably be `width < min || height < min`.

   File: `src/content/review-mode.js:1449`

2. ✅ Clear-review behavior ignores free marks in its content check.

   Completed: the review panel clear action now treats saved annotations, area marks, and pen strokes as review content. The header action uses a trash icon instead of a close icon, stays disabled when the review has no saved comments or marks, and the confirmation copy explains that all comments and marks will be removed.

   Files: `src/content/review-mode.js`, `src/content/review-panel.js`, `src/content/inspector.css`, `src/shared/locales/en.js`, `src/shared/locales/pt-BR.js`, `src/shared/locales/es.js`

3. ✅ README is behind the product.

   README was updated to describe Inspect Mode, Review Mode, area/pen marks, screenshots, snapshots, PDF reports, the privacy site, and the package command.

   File: `README.md`

4. ✅ Stale locale key suggests unfinished Review messaging.

   > Feito: `toast.reviewSoon` removido de en/pt-BR/es (estava sem uso).

   `toast.reviewSoon` still exists in all locales even though Review Mode is implemented. It may be unused, but stale "coming soon" copy should be removed or verified before release.

   Files: `src/shared/locales/en.js:194`, `src/shared/locales/pt-BR.js:194`, `src/shared/locales/es.js:194`

5. Inspect Mode does expensive work on every mousemove.

   `inspectAtEvent()` calls `collectElementInfo()`, renders tooltip HTML, updates overlays, and may call `getComputedStyle()` every mousemove. This is fine on many pages, but it can feel heavy on complex dashboards. Consider requestAnimationFrame throttling for MVP polish.

   Files: `src/content/inspector.js:548`, `src/content/element-inspector.js:137`

## P2 - Important Polish

1. Add a compact in-repo QA checklist.

   Suggested manual cases: restricted pages, normal HTTP/HTTPS pages, Inspect pin/hover, inner container distances, horizontal/vertical alignment, details panel drag, language switching, Review element annotation, area mark, pen mark, copy image, download image, PDF generation, no-annotation exports.

2. Improve keyboard accessibility in Review cards and popup language menu.

   Some review cards use `role="button"` and `tabindex="0"`, but the main action path is click/event delegation. Verify Enter/Space behavior. The popup language list uses ARIA roles but no arrow-key navigation.

   ✅ Completed for Review Mode shortcuts: `Esc` now works while editing review notes, `Esc` exits Review Mode when there is no active draft/edit/selection to cancel, `I`, `P`, and `Q` were removed from the Review shortcut list, `P` no longer creates review drafts by shortcut, `Q` no longer quits Review Mode, and `Delete`/`Backspace` can remove selected free marks.

   Remaining: verify Review card keyboard activation and improve popup language menu arrow-key navigation.

   Files: `src/content/review-panel.js`, `src/popup/popup.js`

3. Add automated tests for shared geometry and review state.

   Current Node tests cover the new Inspect geometry helpers. Review state functions are good candidates for pure tests, especially annotation selection, free mark selection, clear/reset behavior, and area min-size behavior.

4. Split large content modules after MVP stabilization.

   `review-mode.js`, `inspector.js`, and `inspector.css` are still manageable but dense. Future bugs will be easier to prevent if pointer handling, export actions, render orchestration, and geometry are separated more aggressively.

5. Surface export errors with more detail.

   Snapshot/PDF failures currently show generic toasts. For MVP support, include a more specific recoverable message for clipboard unsupported, capture denied, canvas too tall, or popup blocked.

   Files: `src/content/review-snapshot.js`, `src/content/review-print-report.js`

## P3 - Post-MVP Enhancements

1. Add visual regression fixtures.

   A few static HTML fixtures would make it easier to validate Inspect overlays, container distances, and Review snapshots without relying on live product pages.

2. Add a "copy diagnostics" action.

   For support, expose a lightweight diagnostics text containing extension version, mode, current language, browser URL origin only, last capture error, and permission state. Avoid collecting page content.

3. Consider a first-run help screen.

   The popup is concise, but first-time users may not discover pin + hover, Review tools, or screenshot/PDF exports. A one-time help panel could reduce support burden.

4. Document Chrome Web Store permission rationale.

   Keep a short internal note explaining why `activeTab`, `scripting`, and `storage` are required. This helps when submitting or appealing store review.

## Already Good For MVP

- Manifest uses MV3 and a narrow permission set.
- No host permissions are requested.
- Content scripts are injected on demand, not always-on.
- Visible text is localized in PT/EN/ES for core UI.
- Review exports work without requiring binary PDF dependencies.
- Inspect Mode now supports better tooltip placement, distance labels, alignment checks, and internal container distance guides.
- Release packaging and the privacy-policy site now have explicit repository artifacts.
