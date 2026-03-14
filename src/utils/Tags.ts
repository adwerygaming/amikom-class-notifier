import gradient from 'gradient-string';

const RawTags = {
  System: { colors: ['#66FF66', '#00CC66'] },
  CommandImporter: { colors: ['#66FF66', '#00CC66'] },
  CommandRegister: { colors: ['#66FF66', '#00CC66'] },
  Discord: { colors: ['#647eff', '#3398DB'] },
  Error: { colors: ['#C0382B', '#E84B3C'] },
  Debug: { colors: ['#3398DB', '#2980B9'] },
  Helper: { colors: ['#F39C12', '#E67E22'] },
  Warning: { colors: ['#F1C40F', '#F39C12'] },
  Info: { colors: ['#1ABC9C', '#16A085'] },
  Job: { colors: ['#607D8B', '#455A64'] },
  Database: { colors: ['#336791', '#003B57'] },
  Redis: { colors: ['#E74C3C', '#C0392B'] },
  Reminder: { colors: ['#9B59B6', '#8E44AD'] },
};

type TagConfig = { colors: string[] };
type RawTagMap = typeof RawTags;

const tags = Object.fromEntries(
  (Object.entries(RawTags) as [keyof RawTagMap, TagConfig][]).map(([key, { colors }]) => {
    const fn = gradient(colors);
    return [key, fn(key)];
  })
) as { [K in keyof RawTagMap]: string };

export default tags;
