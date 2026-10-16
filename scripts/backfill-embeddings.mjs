// One-time script: computes a MobileNet "fingerprint" for every existing
// wholesale product that doesn't have one yet, so "search by photo" works
// retroactively (new products get this automatically via the admin form).
import sharp from "sharp";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import * as mobilenet from "@tensorflow-models/mobilenet";

const BASE_URL = "https://biggystonefashion.com";
const EMAIL = "Biggystonefashionatelier@gmail.com";
const PASSWORD = "Biggystonefashionatelier@2026";

async function login() {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const setCookie = res.headers.get("set-cookie");
  const match = setCookie?.match(/biggystone_admin_session=([^;]+)/);
  if (!match) throw new Error("Login failed - no session cookie returned");
  return match[1];
}

async function imageToTensor(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { data } = await sharp(buf)
    .resize(224, 224, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return tf.tensor3d(new Int32Array(data), [224, 224, 3]);
}

async function main() {
  await tf.setBackend("cpu");
  await tf.ready();
  console.log("Loading MobileNet...");
  const model = await mobilenet.load({ version: 2, alpha: 1.0 });

  console.log("Logging in...");
  const cookie = await login();
  const headers = { Cookie: `biggystone_admin_session=${cookie}` };

  console.log("Fetching products...");
  const resp = await fetch(`${BASE_URL}/api/admin/products`, { headers });
  const { products } = await resp.json();

  const targets = products.filter(
    (p) => p.product_type === "wholesale" && p.image_url && !p.embedding
  );
  console.log(`${targets.length} wholesale products need a fingerprint.`);

  let success = 0;
  let failed = 0;
  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    try {
      const tensor = await imageToTensor(p.image_url);
      const embeddingTensor = model.infer(tensor, true);
      const embedding = Array.from(await embeddingTensor.data());
      tensor.dispose();
      embeddingTensor.dispose();

      const patchRes = await fetch(`${BASE_URL}/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ embedding }),
      });
      if (!patchRes.ok) throw new Error(`PATCH failed: ${patchRes.status}`);
      success++;
    } catch (err) {
      failed++;
      console.error(`FAILED [${p.name}]: ${err.message}`);
    }
    if ((i + 1) % 25 === 0 || i === targets.length - 1) {
      console.log(`Progress: ${i + 1}/${targets.length} (success=${success}, failed=${failed})`);
    }
  }

  console.log(`Done. Success: ${success}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
