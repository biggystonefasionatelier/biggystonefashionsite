// Computes a 1024-number "fingerprint" for an image using MobileNet, a free
// general-purpose image model that runs entirely in the browser (no API
// cost, no server round-trip). Two images of visually similar products
// produce fingerprints that are close together, which is what powers the
// "search by photo" feature. Loaded lazily so the model (a few MB) is only
// downloaded when someone actually uses it.
let modelPromise: Promise<import("@tensorflow-models/mobilenet").MobileNet> | null = null;

async function loadModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const mobilenet = await import("@tensorflow-models/mobilenet");
      return mobilenet.load({ version: 2, alpha: 1.0 });
    })();
  }
  return modelPromise;
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not read that image."));
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function computeImageEmbedding(file: File): Promise<number[]> {
  const model = await loadModel();
  const img = await loadImage(file);
  const embedding = model.infer(img, true);
  try {
    const data = await embedding.data();
    return Array.from(data);
  } finally {
    embedding.dispose();
  }
}
