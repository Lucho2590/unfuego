// Re-comprime las imágenes de producto que YA están en Storage y actualiza las URLs en
// Firestore. El uploader del admin ahora comprime en el browser, pero todo lo subido antes
// sigue siendo el JPEG crudo de la cámara (3-12 MB), que es lo que hace lenta a la tienda.
//
//   pnpm images:recompress -- --dry-run > backup-imagenes.txt   # ver qué haría (y guardar backup)
//   pnpm images:recompress                                      # de verdad
//   pnpm images:recompress -- --force                           # re-procesar las ya optimizadas
//
// Node strippea los tipos solo, no hace falta tsx.

import { randomUUID } from "node:crypto";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

const MAX_SIDE = 1600;
const WEBP_QUALITY = 80;
const CACHE_CONTROL = "public, max-age=31536000, immutable";
/** Segmento que marca una imagen ya procesada por este script. */
const MARKER = "/opt/";

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const FORCE = args.has("--force");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Falta la variable de entorno ${name} (¿está en .env.local?)`);
    process.exit(1);
  }
  return value;
}

const bucketName =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "unfuego.firebasestorage.app";

// App propia: no se puede importar `@/lib/firebase/admin-app` (Node no resuelve el alias `@/`
// y ese módulo es server-only de Next). Mismas credenciales, eso sí.
const app = initializeApp({
  credential: cert({
    projectId: requireEnv("FIREBASE_ADMIN_PROJECT_ID"),
    clientEmail: requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL"),
    // Viene con los saltos de línea escapados, igual que en admin-app.ts.
    privateKey: requireEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
  storageBucket: bucketName,
});

const db = getFirestore(app);
const bucket = getStorage(app).bucket();

/** De una URL de descarga de Storage al path del objeto. null si no es de Storage. */
function storagePathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "firebasestorage.googleapis.com") return null;
    const match = parsed.pathname.match(/^\/v0\/b\/[^/]+\/o\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Misma normalización que `sanitizeFileName` del uploader: sin espacios, acentos ni comas.
 * Los nombres viejos son cosas como "Screenshot 2026-09-19 at 9.36.09 PM.png".
 */
function sanitize(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "imagen"
  );
}

function targetPath(productId: string, sourcePath: string): string {
  // Conserva el nombre original (que ya arranca con un timestamp, así que es único).
  const base = sourcePath.split("/").pop()!.replace(/\.[^.]+$/, "");
  return `products/${productId}/opt/${sanitize(base)}.webp`;
}

/**
 * El Admin SDK no tiene `getDownloadURL()`. La URL con `?alt=media&token=…` se arma escribiendo
 * uno mismo el token en la metadata custom `firebaseStorageDownloadTokens` — es el mismo campo
 * que usa internamente el SDK cliente, así que el resultado es indistinguible.
 */
function downloadUrl(path: string, token: string): string {
  return (
    `https://firebasestorage.googleapis.com/v0/b/${bucket.name}` +
    `/o/${encodeURIComponent(path)}?alt=media&token=${token}`
  );
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

async function main() {
  let totalAntes = 0;
  let totalDespues = 0;
  let procesadas = 0;
  let salteadas = 0;
  let fallidas = 0;

  const snap = await db.collection("products").get();
  console.log(
    `${snap.size} productos en Firestore${DRY ? "   [DRY RUN: no se escribe nada]" : ""}`
  );

  for (const doc of snap.docs) {
    const data = doc.data();
    const images: string[] = Array.isArray(data.images) ? data.images : [];
    if (images.length === 0) continue;

    console.log(`\n── ${data.name ?? doc.id} (${doc.id}) — ${images.length} imagen(es)`);
    // Redirigí la salida a un archivo y esta línea te sirve de backup para revertir.
    console.log(`   BACKUP ${doc.id} ${JSON.stringify(images)}`);

    const nuevas: string[] = [];
    let cambio = false;

    for (const url of images) {
      const path = storagePathFromUrl(url);

      if (!path) {
        console.log(`   ~ no es de Storage, se deja: ${url.slice(0, 70)}…`);
        nuevas.push(url);
        continue;
      }
      if (path.includes(MARKER) && !FORCE) {
        console.log(`   = ya optimizada: ${path}`);
        nuevas.push(url);
        salteadas++;
        continue;
      }

      try {
        const [buf] = await bucket.file(path).download();
        const out = await sharp(buf, { failOn: "none" })
          // Sin argumentos = aplicar la orientación EXIF y borrarla. Si no, las fotos
          // verticales del celular quedan acostadas.
          .rotate()
          .resize({
            width: MAX_SIDE,
            height: MAX_SIDE,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: WEBP_QUALITY, effort: 5 })
          .toBuffer();

        totalAntes += buf.length;
        totalDespues += out.length;
        const ahorro = Math.round((1 - out.length / buf.length) * 100);
        // El productId sale del doc, así que esto también repatria lo que quedó en
        // `products/new/` por el bug viejo del formulario.
        const newPath = targetPath(doc.id, path);
        console.log(
          `   ✓ ${path}\n     ${mb(buf.length)} → ${mb(out.length)}  (-${ahorro}%)  ⇒ ${newPath}`
        );

        if (DRY) {
          nuevas.push(url);
          continue;
        }

        const token = randomUUID();
        await bucket.file(newPath).save(out, {
          resumable: false,
          metadata: {
            contentType: "image/webp",
            cacheControl: CACHE_CONTROL,
            metadata: {
              firebaseStorageDownloadTokens: token,
              recompressedFrom: path,
              recompressVersion: "1",
            },
          },
        });

        nuevas.push(downloadUrl(newPath, token));
        cambio = true;
        procesadas++;
      } catch (error) {
        console.error(`   ✗ FALLÓ ${path}: ${(error as Error).message}`);
        // Conservamos la URL original: el producto nunca queda sin imagen.
        nuevas.push(url);
        fallidas++;
      }
    }

    if (!DRY && cambio) {
      await doc.ref.update({ images: nuevas, updatedAt: Timestamp.now() });
      console.log(`   → Firestore actualizado`);
    }
  }

  const ahorroTotal = totalAntes
    ? `  (-${Math.round((1 - totalDespues / totalAntes) * 100)}%)`
    : "";
  console.log(
    `\n══ Resumen\n` +
      `   procesadas: ${procesadas}   salteadas: ${salteadas}   fallidas: ${fallidas}\n` +
      `   peso: ${mb(totalAntes)} → ${mb(totalDespues)}${ahorroTotal}`
  );

  // Los originales NO se borran a propósito: `OrderItem.image` guarda un snapshot de la URL en
  // cada pedido histórico, y `CartItem.image` vive en el localStorage de los clientes. Borrarlos
  // rompería retroactivamente el panel de pedidos y los carritos abiertos.
  console.log(`   (los archivos originales quedan en Storage, no se borran)`);

  if (!DRY && procesadas > 0) {
    console.log(
      `\n⚠  Esto escribió Firestore por afuera de Next, así que no se revalidó la caché.\n` +
        `   Entrá al admin, abrí cualquier producto y dale Guardar (eso revalida), o redeployá.`
    );
  }

  if (fallidas > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
