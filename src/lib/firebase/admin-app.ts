// Inicialización (lazy) del Firebase Admin SDK (service account). Acceso server-only a Firestore
// y Auth: con el service account el server BYPASSA las security rules, por eso la DB queda
// realmente protegida (las rules cierran el acceso del cliente). NO importar desde el cliente.
//
// La init es lazy (no corre al importar el módulo) para que `next build` —que importa los
// módulos de rutas para bundlearlos— no falle si las env vars del service account no están
// presentes en build-time. El error, si faltan credenciales, ocurre recién al usar la DB/Auth.
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let appInstance: App | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

function getApp_(): App {
  if (appInstance) return appInstance;
  if (getApps().length > 0) {
    appInstance = getApp();
    return appInstance;
  }
  // La private key viene con saltos de línea escapados (\n) desde Vercel/env: hay que
  // desescaparlos para que el cert sea válido.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  appInstance = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
  return appInstance;
}

export function getAdminDb(): Firestore {
  if (dbInstance) return dbInstance;
  dbInstance = getFirestore(getApp_());
  // La implementación REST anterior toleraba campos `undefined` (los guardaba como null). El SDK
  // por defecto lanza; ignorarlos preserva ese comportamiento. settings() solo puede llamarse
  // una vez antes del primer uso del Firestore.
  try {
    dbInstance.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Ya estaba configurado/usado: no es fatal.
  }
  return dbInstance;
}

export function getAdminAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getApp_());
  return authInstance;
}
