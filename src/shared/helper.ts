export function parseString(str: string) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return [];
  }
}

export function chunk<T>(array: T[], chunkSize: number): T[][] {
  const chunked = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunked.push(array.slice(i, i + chunkSize));
  }

  return chunked;
}

export function generateSlug(input: string) {
  const words = input?.trim()?.split(' ');
  // Create a new string starting with "output"
  let newString = '';
  // Iterate through each word in the original string
  for (let i = 0; i < words.length; i++) {
    if (i === 0) {
      newString = words[i];
      continue;
    }
    newString += '-' + words[i];
  }
  return (
    newString
      .toLowerCase()
      .replace(/[^\w\s]/gi, '-')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/ /g, '-') +
    '-' +
    new Date().getTime().toString()
  );
}
