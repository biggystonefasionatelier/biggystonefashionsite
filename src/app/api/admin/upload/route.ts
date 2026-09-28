import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

// Product photos only ever need to fill a grid thumbnail or a modest
// full-width slot on the shop/wholesale pages - nothing on the site
// displays them larger than this. Phone photos routinely come in at
// 3000px+ and several MB; with 190+ products live, serving all of them
// at original size was measurably slowing page loads for shoppers, so
// every upload gets resized/recompressed here, once, up front - not
// on every page view.
const MAX_DIMENSION = 1600;

// Auth is already enforced by middleware for everything under /api/admin/*.

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, or AVIF images are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const resized = sharp(inputBuffer).rotate().resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });

    let outputBuffer: Buffer;
    switch (file.type) {
      case "image/png":
        outputBuffer = await resized.png({ compressionLevel: 9 }).toBuffer();
        break;
      case "image/webp":
        outputBuffer = await resized.webp({ quality: 82 }).toBuffer();
        break;
      case "image/avif":
        outputBuffer = await resized.avif({ quality: 60 }).toBuffer();
        break;
      default:
        outputBuffer = await resized.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    }

    const ext = file.type.split("/")[1];
    const filename = `products/${crypto.randomUUID()}.${ext}`;
    const blob = await put(filename, outputBuffer, { access: "public", contentType: file.type });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Product image upload failed:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
