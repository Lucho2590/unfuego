import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getFirebaseStorage } from "./config";

/** Sube cualquier archivo (imagen, PDF, etc.) a Storage y devuelve su URL pública. */
export async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

/**
 * Igual que `uploadFile`, pero avisa el progreso (0-100) mientras sube, para poder
 * mostrar feedback en la UI.
 */
export function uploadFileWithProgress(
  file: File,
  path: string,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(getFirebaseStorage(), path), file);

    task.on(
      "state_changed",
      (snapshot) => {
        const percent = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;
        onProgress(percent);
      },
      reject,
      () => {
        getDownloadURL(task.snapshot.ref).then(resolve, reject);
      }
    );
  });
}

/** Alias retrocompatible para subir imágenes. */
export const uploadImage = uploadFile;

export async function deleteImage(path: string): Promise<void> {
  const storageRef = ref(getFirebaseStorage(), path);
  await deleteObject(storageRef);
}

export function getProductImagePath(productId: string, fileName: string): string {
  return `products/${productId}/${fileName}`;
}

/**
 * Path del manual (PDF) de un producto. Se guarda al mismo nivel que las imágenes
 * (`products/{id}/…`) para quedar cubierto por la misma regla de Storage; el prefijo
 * "manual-" lo distingue de las imágenes.
 */
export function getProductManualPath(productId: string, fileName: string): string {
  return `products/${productId}/manual-${fileName}`;
}

export function getTransferProofPath(orderId: string, fileName: string): string {
  return `transfer-proofs/${orderId}/${fileName}`;
}
