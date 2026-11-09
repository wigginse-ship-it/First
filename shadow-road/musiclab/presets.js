'use strict';
// Tracks for the music lab. Each preset is the source text of one engine track, edited live on the page.
// L(n, 'F5:2 G5:2 .:2') builds one bar of n steps from note:length pairs ('.' is a rest); the bar must add up to n.
const LAB_PRESETS = {
  glory: `({
  firstBar: 28,
  n: 24,
  style: 'calm', duty: .25, lv: .17, vib: 10, echo: .22, echoSteps: 6,
  arp: '0-1-2-0-1-2-0-1-2-0-1-2-', arpDuty: .5, av: .045,
  bass: 'R-----------V-----------', bv: .28,
  chords: ['F', 'F', 'Db/F', 'F', 'Db/F', 'Fm', 'Eb', 'Bb', 'Eb Fm', 'Db', 'Db'],
  lead: [
    L(24, '.:24'),
    L(24, '.:18 F5:2 G5:2 F5:2'),
    L(24, 'C#5:12 D#5:6 C#5:6'),
    L(24, 'C5:12 C#5:6 F5:2 G5:2 F5:2'),
    L(24, 'F5:12 D#5:6 C#5:6'),
    L(24, 'C5:18 A#4:3 G#4:3'),
    L(24, 'G4:12 G#4:6 G4:6'),
    L(24, 'F4:18 D#4:3 F4:3'),
    L(24, 'A#4:12 C5:6 A#4:6'),
    L(24, '.:24'),
    L(24, 'C5:12 A#4:3 A#4:3 C5:3 A#4:3')
  ]
})`
};
const LAB_TEMPO = { glory: 71.5 }; // quarter-note BPM
