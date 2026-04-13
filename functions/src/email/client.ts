import { Resend } from "resend";
import { defineSecret } from "firebase-functions/params";

export const resendApiKey = defineSecret("RESEND_API_KEY");

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(resendApiKey.value());
  }
  return _resend;
}

export const FROM_ADDRESS = "Artistico <orders@artistico.love>";
