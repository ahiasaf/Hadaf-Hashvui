// A registered parent invites the son from /join#invite: pure helpers for the panel.
import type { Person } from "./client.ts";

export const inviteKeys = [
  "invTitle",
  "invTitleAny",
  "invBody",
  "invNameKid",
  "invPhone",
  "invPhoneAny",
  "invNeed",
  "invEdit",
  "invMsg",
  "invTip",
  "invBtn",
  "invSent",
] as const;
export type InviteCopy = Record<(typeof inviteKeys)[number], string>;

export function digits(phone: string) {
  return String(phone || "").replace(/\D/g, "");
}

export function phoneReady(phone: string) {
  return digits(phone).length >= 9;
}

// WhatsApp wants the international form: a leading local zero becomes 972.
export function whatsappNumber(phone: string) {
  const value = digits(phone);
  return value.startsWith("0") ? "972" + value.slice(1) : value;
}

// The personal link: the son signs up as a student of the same yeshiva, with the parent prefilled as partner.
export function inviteUrl(origin: string, me: Person) {
  const params = new URLSearchParams({
    inst: me.inst,
    rel: "kid",
    me: me.first,
    wid: me.id || "",
  });
  if (me.dadFirst) params.set("f", me.dadFirst);
  if (me.dadLast) params.set("l", me.dadLast);
  if (me.dadPhone) params.set("p", me.dadPhone);
  params.set("sf", me.first);
  params.set("sl", me.last || "");
  if (me.phone) params.set("sp", me.phone);
  return origin + "/join?" + params.toString();
}

export function inviteMessage(
  template: string,
  values: { me: string; them: string; url: string },
) {
  return template.replace(
    /\{(me|them|url)\}/g,
    (_, key: keyof typeof values) => values[key],
  );
}

// The link is what connects the two; if it was edited out of the draft, it returns at the end.
export function withInviteUrl(text: string, url: string) {
  return text.includes(url) ? text : text.replace(/\s+$/, "") + "\n\n" + url;
}

export function whatsappInvite(phone: string, text: string) {
  return (
    "https://wa.me/" +
    whatsappNumber(phone) +
    "?text=" +
    encodeURIComponent(text)
  );
}

// Fields a personal invitation carries into the signup form.
export function inviteDraft(search: string) {
  const params = new URLSearchParams(search);
  if (params.get("rel") !== "kid") return null;
  return {
    first: params.get("f") || "",
    last: params.get("l") || "",
    phone: params.get("p") || "",
    dadFirst: params.get("sf") || "",
    dadLast: params.get("sl") || "",
    dadPhone: params.get("sp") || "",
  };
}
