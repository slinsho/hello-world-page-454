import flagBomi from "@/assets/county-flags/Bomi.svg";
import flagBong from "@/assets/county-flags/Bong.svg";
import flagGbarpolu from "@/assets/county-flags/Gbarpolu.svg";
import flagGrandBassa from "@/assets/county-flags/Grand_Bassa.svg";
import flagGrandCapeMount from "@/assets/county-flags/Grand_Cape_Mount.svg";
import flagGrandGedeh from "@/assets/county-flags/Grand_Gedeh.svg";
import flagGrandKru from "@/assets/county-flags/Grand_Kru.svg";
import flagLofa from "@/assets/county-flags/Lofa.svg";
import flagMargibi from "@/assets/county-flags/Margibi.svg";
import flagMaryland from "@/assets/county-flags/Maryland.svg";
import flagMontserrado from "@/assets/county-flags/Montserrado.png";
import flagNimba from "@/assets/county-flags/Nimba.png";
import flagRiverCess from "@/assets/county-flags/River_Cess.png";
import flagRiverGee from "@/assets/county-flags/River_Gee.svg";
import flagSinoe from "@/assets/county-flags/Sinoe.png";

export const COUNTY_FLAGS: Record<string, string> = {
  Bomi: flagBomi,
  Bong: flagBong,
  Gbarpolu: flagGbarpolu,
  "Grand Bassa": flagGrandBassa,
  "Grand Cape Mount": flagGrandCapeMount,
  "Grand Gedeh": flagGrandGedeh,
  "Grand Kru": flagGrandKru,
  Lofa: flagLofa,
  Margibi: flagMargibi,
  Maryland: flagMaryland,
  Montserrado: flagMontserrado,
  Nimba: flagNimba,
  "River Cess": flagRiverCess,
  "River Gee": flagRiverGee,
  Sinoe: flagSinoe,
};

export const LIBERIA_COUNTIES = Object.keys(COUNTY_FLAGS);

export const countyFlag = (name?: string | null): string | undefined =>
  name ? COUNTY_FLAGS[name.trim()] : undefined;

export const countySlug = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, "-");

export const countyFromSlug = (slug: string): string | undefined =>
  LIBERIA_COUNTIES.find((c) => countySlug(c) === slug.toLowerCase());
