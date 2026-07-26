/**
 * The Yarnlane mark: interlocking stockinette "V" stitches, the same shape a
 * knitter sees in the fabric and on a Colorwork Chart. Decorative next to the
 * wordmark, so it stays out of the accessibility tree.
 */
export function BrandMark() {
  return (
    <span className="logo" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        <path d="M3 7.5 L7.5 13 L12 7.5 L16.5 13 L21 7.5" />
        <path d="M7.5 13 L12 18.5 L16.5 13" />
      </svg>
    </span>
  );
}
