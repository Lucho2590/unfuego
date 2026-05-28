import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "./config";

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  return { user: credential.user, idToken };
}

export async function signOutAdmin() {
  await firebaseSignOut(auth);
}
