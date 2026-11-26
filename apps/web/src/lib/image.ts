// Drive images (lh3.googleusercontent.com) come at full upload size, often multi-MB PNGs:
// Google's own resizer scales them to `w` px wide and serves an 80% quality JPEG.
export const sized = (url: string, w = 1200) =>
  /^https:\/\/lh3\.googleusercontent\.com\/d\/[\w-]+$/.test(url) ? `${url}=w${w}-rj-l80` : url;
