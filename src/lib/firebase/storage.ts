import {
  ref,
  uploadBytes,
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
