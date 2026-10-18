import { safeParseJson } from '../src/utils/aiJson';

const FENCE = '`'.repeat(3);
const cases: Array<[string, string]> = [
  ['plain JSON', '{"a":1}'],
  ['fenced JSON', `${FENCE}json\n{"a":1}\n${FENCE}`],
  ['chatter around JSON', 'Here is your plan: {"a":1} Enjoy!'],
  ['cut off', '{"a":[1,2,'],
  ['empty', '   '],
  ['too large', '{"a":"' + 'x'.repeat(300_000) + '"}'],
];

for (const [name, input] of cases) {
  console.log(name.padEnd(22), JSON.stringify(safeParseJson(input)).slice(0, 80));
}
