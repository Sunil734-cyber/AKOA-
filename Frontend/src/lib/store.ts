import { useSyncExternalStore } from "react";
import { SEED_ACTIONS, type ActionRecord } from "@/lib/akoa";

/* ---------------------------------- auth ----------------------------------- */

type AuthState = { signedIn: boolean };

let authState: AuthState = { signedIn: false };
const authSubs = new Set<() => void>();

function emitAuth() {
  authSubs.forEach((fn) => fn());
}

export const authStore = {
  subscribe(fn: () => void) {
    authSubs.add(fn);
    return () => {
      authSubs.delete(fn);
    };
  },
  get: () => authState,
  signIn() {
    authState = { signedIn: true };
    try {
      localStorage.setItem("akoa:auth", "1");
    } catch {
      /* storage unavailable */
    }
    emitAuth();
  },
  signOut() {
    authState = { signedIn: false };
    try {
      localStorage.removeItem("akoa:auth");
    } catch {
      /* storage unavailable */
    }
    emitAuth();
  },
  hydrate() {
    try {
      if (localStorage.getItem("akoa:auth") === "1" && !authState.signedIn) {
        authState = { signedIn: true };
        emitAuth();
      }
    } catch {
      /* storage unavailable */
    }
  },
};

export function useAuth(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.get, authStore.get);
}

/* ------------------------------ action history ----------------------------- */

let actions: ActionRecord[] = SEED_ACTIONS;
const actionSubs = new Set<() => void>();

function emitActions() {
  actionSubs.forEach((fn) => fn());
}

export type NewAction = Omit<ActionRecord, "id" | "time">;

export const actionsStore = {
  subscribe(fn: () => void) {
    actionSubs.add(fn);
    return () => {
      actionSubs.delete(fn);
    };
  },
  get: () => actions,
  add(rec: NewAction): ActionRecord {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const id = `AKOA-2410-${time.replace(":", "")}`;
    const record: ActionRecord = { ...rec, id, time };
    actions = [record, ...actions];
    emitActions();
    return record;
  },
};

export function useActions(): ActionRecord[] {
  return useSyncExternalStore(actionsStore.subscribe, actionsStore.get, actionsStore.get);
}
