import Site from "./Site";

// blocking route: CMS content is read at request time (see getContent), then served from cache
export const instant = false;

export default function Home() {
  return <Site />;
}
