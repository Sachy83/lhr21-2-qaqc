# LHR21.2 Site Installation QA/QC – mobile form (19/10/2026 – v13 shared copy)

Rehlko · VANTAGE LHR21.2 · REHLKO-D11-QAQC-SITE-R05

* `site/` – the form as a web page. Phones open the Netlify link; it works offline after the first visit.
* `netlify/functions/qaqc.mjs` – the **shared copy**: one copy of each generator set's answers and
  photographs, kept in Netlify Blobs on this site. Every request needs the project code.
* `netlify.toml` – tells Netlify to publish `site/` and run the function. There is no build step.

## Project code
Set it on Netlify, not here: **Project configuration › Environment variables › Add a variable**,
key `QAQC_CODE`, value = the code (not case sensitive; spaces and dashes are ignored). Then
**Deploys › Trigger deploy** so the function picks it up. Type the same code on each phone under
**More › Shared copy**.

## Updating the form
Replace `site/index.html` (and `site/sw.js` if a new one is supplied) using **Add file › Upload files**
in GitHub and commit. Netlify deploys automatically; phones pick up the new version the next time
the form is opened twice.

## Where the data is
Netlify Blobs store `lhr212-qaqc` on this site (Netlify: **Blobs** in the project menu):
`set/GenA` … `set/GenF` – the shared answers; `photo/<set>/<id>` – photographs;
`daily/<set>/<date>` – the set as it stood at the end of each working day.
