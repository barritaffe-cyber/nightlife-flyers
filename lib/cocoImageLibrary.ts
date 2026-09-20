export type CocoImageLibraryItem = {
  id: string;
  src: string;
  name: string;
};

const numberedCocoImages = (
  kind: "background" | "subject",
  folder: string,
  files: readonly string[]
): readonly CocoImageLibraryItem[] =>
  files.map((file, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      id: `coco-${kind}-${number}`,
      src: `/create-with-coco/${folder}/${file}`,
      name: `${kind === "background" ? "Background" : "Subject"} ${index + 1}`,
    };
  });

export const COCO_BACKGROUND_LIBRARY = numberedCocoImages(
  "background",
  "backgrounds2",
  [
    "background.png",
    "background17.jpg",
    "background18.jpg",
    "background19.jpg",
    "img01.jpg",
    "img02.jpg",
    "img03.jpg",
    "img04.jpg",
    "luxe01.jpg",
    "luxe02.jpg",
    "luxe03.jpg",
    "luxe04.jpg",
    "tropical01.jpg",
    "tropical02.jpg",
    "tropical03.jpg",
    "tropical04.jpg",
  ]
);

export const COCO_SUBJECT_LIBRARY = numberedCocoImages("subject", "subjects", [
  "subject01.jpg",
  "subject02.jpg",
  "subject03.jpg",
  "subject04.jpg",
  "subject05.jpg",
  "subject06.jpg",
  "subject07.jpg",
  "subject08.jpg",
  "subject09.jpg",
  "subject10.jpg",
  "subject11.jpg",
  "subject12.jpg",
  "subject13.jpg",
  "subject14.jpg",
  "subject15.jpg",
  "subject16.jpg",
  "subject17.jpg",
  "subject18.jpg",
]);
