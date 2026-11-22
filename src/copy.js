// ALL PLACEHOLDER COPY LIVES HERE.
// Replace these strings with approved marketing copy before any public release.
// Do not add real specifications here unless they are confirmed.

export const COPY = {
  brand: 'AMCE',
  brandSub: 'concept showcase',
  rail: [
    { id: 'hero', label: 'Intro' },
    { id: 'design', label: 'Design' },
    { id: 'anatomy', label: 'Anatomy' },
    { id: 'technology', label: 'Technology' },
    { id: 'inplace', label: 'In place' },
    { id: 'explore', label: 'Explore' },
    { id: 'request', label: 'Request' },
  ],

  hero: {
    eyebrow: '01 Solar charging seat',
    title: 'Sit in the sun. Leave fully charged.',
    body: 'A quiet piece of architectural furniture for hotel terraces and public squares. It gathers daylight and gives it back as power.',
    cue: 'Scroll to explore',
  },

  design: {
    eyebrow: '02 Design',
    steps: [
      { view: 'front', title: 'Calm from the front', body: 'Low lines and a grounded stance. Nothing shouts.' },
      { view: 'side', title: 'A roof of light', body: 'The canopy reaches over the seat and keeps it in soft shade.' },
      { view: 'back', title: 'Finished on every side', body: 'Placed in the middle of a lobby it still looks resolved.' },
      { view: 'top', title: 'Seen from above', body: 'The solar canopy runs the full length of the seat.' },
    ],
  },

  anatomy: {
    eyebrow: '03 Anatomy',
    title: 'Five honest parts',
    body: 'Pulled apart to show how simply it comes together.',
    parts: ['Metal base and seat pan', 'Tailored bouclé seat', 'Reclined backrest', 'Service pillar', 'Solar canopy'],
  },

  tech: {
    eyebrow: '04 Technology',
    title: 'Power kept out of sight',
    body: 'Four quiet features. Every value is still to be confirmed.',
    hotspots: {
      solar: { label: 'Solar panel', sub: 'Monocrystalline cells under matte glass' },
      wireless: { label: 'Wireless charging', sub: 'Flush brass pad in the armrest' },
      usb: { label: 'USB charging', sub: 'Weather sealed port' },
      battery: { label: 'Battery', sub: 'Housed inside the pillar' },
    },
  },

  inplace: {
    eyebrow: '05 In place',
    title: 'From morning light to dusk',
    body: 'Shown on a hotel terrace. Watch the shadows travel through the day.',
    dusk: 'At dusk a small light shows the seat is ready to charge.',
    clockLabel: 'Local time',
  },

  explore: {
    eyebrow: '06 Explore',
    title: 'Make it yours',
    lines: ['Choose a finish and move the sun.', 'Drag to orbit around every detail.'],
    presets: [
      { id: 'overview', label: '01 Overview' },
      { id: 'solar', label: '02 Solar Array' },
      { id: 'tactile', label: '03 Tactile Charging' },
      { id: 'silhouette', label: '04 Silhouette' },
    ],
    sunLabel: 'Sun angle',
    finishLabel: 'Finish',
    env: { studio: 'Studio Plain', terrace: 'Terrace Setting' },
    specTrigger: 'Specifications',
    specShort: 'Specs',
    rotate: 'Rotate view',
    rotateOn: 'Rotating. Tap to scroll',
    sheetOpen: 'More controls',
    sheetClose: 'Fewer controls',
  },

  spec: {
    title: 'Specifications',
    exposureLabel: 'Solar exposure',
    illustrative: 'Illustrative',
    exposureNote: 'Relative value from the current sun angle. Not a measurement.',
    tbc: '[to be confirmed]',
    rows: [
      'Solar panel output',
      'Battery capacity',
      'Autonomy',
      'USB type',
      'Wireless charging standard',
      'Dimensions',
      'Weight',
      'Certifications',
      'Price',
    ],
    close: 'Close specifications',
  },

  request: {
    eyebrow: '07 Request',
    title: 'Request the specification',
    body: 'Tell us a little about your project. We will send the full pack once it is ready.',
    fields: {
      name: 'Full name',
      company: 'Organisation',
      role: 'You are',
      email: 'Email',
      message: 'Project notes',
    },
    roles: ['Investor', 'Manufacturing partner', 'Hotel director', 'Shopping centre operator', 'Other'],
    submit: 'Prepare email',
    email: 'hello@amce.example', // PLACEHOLDER address
    subject: 'AMCE specification request',
    fallback: 'Or write to us directly at',
    note: 'This form opens your email app. Nothing is stored on this page.',
  },

  footer: {
    line: 'Concept showcase for luxury hospitality and public spaces.',
    tbc: 'All specifications to be confirmed.',
  },

  fallback: {
    title: 'The 3D view could not start',
    body: 'Your browser or device does not support WebGL. The story below still works.',
  },
};
