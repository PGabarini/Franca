import type { Categoria } from "./products";

export type GenericSizeGuide = {
  headers: string[];
  rows: Record<string, string[]>;
  nota?: string;
};

// Medidas de referencia en cm. El primer header siempre es "Talle".
export const GENERIC_SIZE_GUIDES: Partial<Record<Categoria, GenericSizeGuide>> = {
  Sweaters: {
    headers: ["Talle", "Pecho", "Largo", "Manga"],
    rows: {
      XS: ["80-84", "58", "60"],
      S: ["84-88", "60", "61"],
      M: ["88-94", "62", "62"],
      L: ["94-100", "64", "63"],
      XL: ["100-108", "66", "64"],
    },
    nota: "Si estás entre dos talles, te recomendamos elegir el más grande para una caída holgada.",
  },
  Camisas: {
    headers: ["Talle", "Pecho", "Cintura", "Largo"],
    rows: {
      XS: ["82-86", "66-70", "62"],
      S: ["86-90", "70-74", "63"],
      M: ["90-96", "74-80", "64"],
      L: ["96-102", "80-86", "65"],
      XL: ["102-108", "86-92", "66"],
    },
    nota: "Medidas tomadas con la prenda apoyada plana.",
  },
  Pantalones: {
    headers: ["Talle", "Cintura", "Cadera", "Tiro", "Largo"],
    rows: {
      "36": ["64", "88", "26", "100"],
      "38": ["68", "92", "27", "101"],
      "40": ["72", "96", "28", "102"],
      "42": ["76", "100", "29", "103"],
      "44": ["80", "104", "30", "104"],
    },
    nota: "Si estás entre dos talles, elegí el menor para un calce más ajustado.",
  },
  Faldas: {
    headers: ["Talle", "Cintura", "Cadera", "Largo"],
    rows: {
      XS: ["64", "88", "55"],
      S: ["68", "92", "56"],
      M: ["72", "96", "57"],
      L: ["76", "100", "58"],
      XL: ["80", "104", "59"],
    },
  },
  Abrigos: {
    headers: ["Talle", "Pecho", "Largo", "Manga"],
    rows: {
      XS: ["86-90", "72", "61"],
      S: ["90-94", "74", "62"],
      M: ["94-100", "76", "63"],
      L: ["100-106", "78", "64"],
      XL: ["106-114", "80", "65"],
    },
    nota: "Pensados para usarse sobre prendas finas. Si vas a llevarlo sobre sweaters, elegí un talle más.",
  },
};
