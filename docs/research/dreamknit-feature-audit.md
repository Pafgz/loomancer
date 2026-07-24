# Dreamknit public-product audit for Knit-Pro MVP

Date: 2026-07-24  
Status: product research  
Scope: publicly observable Dreamknit capabilities relevant to Knit-Pro's focused loop: upload image → choose chart resolution → generate Colorwork Chart → replace colors with owned yarn → export chart and color key.

## Executive conclusion

**Fact.** Dreamknit's public marketing centers on a garment design tool that generates customized knitting patterns from garment type, fit/size/details, and yarn choices. Patterns are delivered as downloadable PDFs with step-by-step instructions and video support. [S1] [S2] [S3]

**Fact.** Dreamknit PRO also advertises premium tools including Color Charts, a yarn swapper, and an increase/decrease calculator. Color Charts are described as creating visual knitting charts from scratch or based on knitting projects for Fair Isle, intarsia, or other colorwork. [S4] [S2]

**Inference.** Dreamknit is primarily a garment-pattern generator with optional color-chart tooling, not an image-to-pixelization product. Public pages reviewed for this audit do not describe uploading a photograph and converting it into a stitch grid via a pixelization control.

**Recommendation for Knit-Pro.** Treat Dreamknit as inspiration for yarn-aware, beginner-friendly pattern tooling—not as a feature checklist for the MVP. Knit-Pro's differentiator is the image-to-Colorwork-Chart loop with controllable pixelization and Yarn Inventory matching. Full Dreamknit garment parity remains later work.

## Observed Dreamknit capabilities

### Core design-tool journey

Observed on the design-tool marketing page: [S1]

1. Pick a garment.
2. Customize the design (fit, size, details).
3. Choose yarn (favorite yarn or leftovers).
4. Get the pattern instantly and start knitting.

Supported garment categories named publicly include cardigans, sweaters, t-shirts, slipovers, beanies, mittens, scarves, and cowls. Construction options mentioned for several upper-body garments include raglan and drop shoulder. [S1]

### Yarn handling

**Fact.** Knitters can select yarn from Dreamknit's yarn hub/library or add their own yarn details such as name, needle size, gauge, meterage, and colour. Dreamknit then tailors the pattern to those values. [S3] [S2]

**Fact.** A PRO yarn swapper helps calculate yarn needed when switching between yarns. [S4]

**Inference.** Yarn-aware design is central to Dreamknit. Quantity calculation appears tied to garment generation and gauge, which Knit-Pro has deliberately deferred.

### Color Charts

**Fact.** Color Charts are a PRO tool for creating visual knitting charts from scratch or based on knitting projects, described as suitable for Fair Isle, intarsia, or other colorwork. Color Charts for raglan sweaters and t-shirts are advertised as newly available for PRO. [S4] [S2]

**Inference.** Dreamknit color charts appear to be garment-integrated chart design rather than photo-pixelization. Exact editor affordances (pixelization slider, palette reduction, inventory matching) are not documented on the public pages reviewed.

### Delivery, membership, and community

**Fact.** Finished patterns appear on the member profile and can be downloaded/printed as PDFs with instructional videos. Dreamknit PRO is sold as a subscription (publicly advertised around €6.99–€9.99/month depending on plan) with unlimited patterns, premium tools, community knit-alongs, and yarn discounts. [S2] [S1]

## Mapping to Knit-Pro's focused loop

| Knit-Pro MVP need | Dreamknit public signal | MVP implication |
| --- | --- | --- |
| Select source image | Not observed on audited public pages | Knit-Pro differentiator; keep |
| Pixelization / grid control | Not observed as photo-pixelization | Knit-Pro differentiator; keep |
| Constrained color chart | Color Charts exist as PRO tooling | Related idea; implement Knit-Pro's chart/export contract |
| Replace colors with owned yarn | Custom yarn entry and yarn hub | Related idea; keep manual Yarn Inventory without catalog dependency |
| Export usable chart | PDF patterns with instructions/videos | Export PDF/image chart and color key only; no garment instructions |
| Save projects | Patterns stored on profile | Local-first drafts instead of accounts |
| Garment generator | Primary Dreamknit product | Out of scope for this MVP |
| Yarn quantity math / swapper | PRO tools | Deferred with gauge/sizing |
| Membership, commerce, community | Core Dreamknit business | Deferred |

## What belongs in later parity

- Multi-garment design tool and construction options
- Gauge-aware sizing and yarn-quantity calculation
- Yarn library / commerce integrations
- Accounts, cloud pattern library, subscriptions
- Instructional video ecosystem and community features
- Any Dreamknit-specific chart editor details not required for the photo-to-chart loop

## Sources

- [S1] Dreamknit design tool page: https://dreamknit.com/en-international/pages/design-tool
- [S2] Dreamknit PRO page: https://app.dreamknit.com/en/pro
- [S3] Dreamknit “Design your own patterns” post: https://dreamknit.com/en-eu/blogs/news/design-your-own-pattern
- [S4] Dreamknit Tools page: https://app.dreamknit.com/en/tools
- Supporting journey post: https://dreamknit.com/en-international/blogs/news/customized-knitting-patterns
