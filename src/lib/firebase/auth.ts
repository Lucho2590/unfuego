import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { getFirebaseAuth } from "./config";

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  const idToken = await credential.user.getIdToken();
  return { user: credential.user, idToken };
}

export async function signOutAdmin() {
  await firebaseSignOut(getFirebaseAuth());
}
