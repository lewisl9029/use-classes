// Copied from https://github.com/styled-components/styled-components/blob/3ee575eddf804e4bf460f1cadb5890db7ae2f5cf/packages/styled-components/src/utils/hash.ts#L6
const SEED = 5381;

// When we have separate strings it's useful to run a progressive
// version of djb2 where we pretend that we're still looping over
// the same string
const phash = (h, x) => {
  let i = x.length;

  while (i) {
    h = (h * 33) ^ x.charCodeAt(--i);
  }

  return h;
};

// This is a djb2 hashing function
const hash = x => {
  return phash(SEED, x);
};

export default hash;
