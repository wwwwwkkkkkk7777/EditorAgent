import {
  Inter,
  Roboto,
  Open_Sans,
  Playfair_Display,
  Comic_Neue,
  Outfit,
} from "next/font/google";

// Configure all fonts
const inter = Inter({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "700"] });
const openSans = Open_Sans({ subsets: ["latin"] });
const playfairDisplay = Playfair_Display({ subsets: ["latin"] });
const comicNeue = Comic_Neue({ subsets: ["latin"], weight: ["400", "700"] });

// Export font class mapping for use in components
export const FONT_CLASS_MAP = {
  Outfit: outfit.className,
  Inter: inter.className,
  Roboto: roboto.className,
  "Open Sans": openSans.className,
  "Playfair Display": playfairDisplay.className,
  "Comic Neue": comicNeue.className,
  Arial: "",
  Helvetica: "",
  "Times New Roman": "",
  Georgia: "",
} as const;

// Export individual fonts for use in layout
export const fonts = {
  inter,
  outfit,
  roboto,
  openSans,
  playfairDisplay,
  comicNeue,
};

// Default font for the body
export const defaultFont = outfit;
