import { programContent } from "../src/config/content.ts";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

// Typed modules run as CommonJS inside a context, so browser globals and the client can be stubbed.
const same = (actual, expected) =>
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));

async function load(file, context = {}, modules = {}) {
  const exports = {};
  const source = ts.transpileModule(await fs.readFile(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    URLSearchParams,
    ...context,
    exports,
    require: (name) => {
      if (!(name in modules)) throw new Error("Unexpected import " + name);
      return modules[name];
    },
  });
  return exports;
}
const program = programContent();
const shareLinks = await load("src/lib/share-links.ts");
const invitations = await load(
  "src/lib/invitations.ts",
  {},
  {
    "./share-links": shareLinks,
  },
);

test("copy layering applies code, published sheet, then draft, skipping empty and retired values", () => {
  const base = { h1: "CODE", lead: "LEAD", copy: "COPY" };
  const published = {
    "kish.h1": "PUBLISHED",
    "kish.lead": "",
    "kish.copy": "OLD",
  };
  const draft = { "kish.h1": "DRAFT", "ui.h1": "OTHER" };
  const retired = { "kish.copy": ["OLD"] };
  const layered = shareLinks.layerCopy(base, "kish", published, draft, retired);
  same(layered, { h1: "DRAFT", lead: "LEAD", copy: "COPY" });
  same(base, { h1: "CODE", lead: "LEAD", copy: "COPY" });
  assert.equal(
    shareLinks.publishedValue(base, "kish", "h1", published, retired),
    "PUBLISHED",
  );
  assert.equal(
    shareLinks.publishedValue(base, "kish", "copy", published, retired),
    "COPY",
  );
});

test("published copy requires the key header and draft texts must be strings", () => {
  same(
    shareLinks.copyOverrides([
      ["מפתח", "ערך"],
      [" kish.h1 ", " TITLE "],
      ["kish.lead", ""],
    ]),
    { "kish.h1": "TITLE" },
  );
  same(
    shareLinks.copyOverrides([
      ["code", "name"],
      ["a", "b"],
    ]),
    {},
  );
  same(shareLinks.draftTexts({ texts: { a: "A", b: 1 } }), { a: "A" });
  same(shareLinks.draftTexts("broken"), {});
});

test("share links fill every audience message from the real program copy", () => {
  const copy = shareLinks.pickStrings(
    program.KISHURIM,
    shareLinks.kishurimKeys,
  );
  for (const key of shareLinks.kishurimKeys) assert.ok(copy[key], key);
  const links = shareLinks.siteLinks(
    copy,
    { linkWa: program.UI.linkWa, dadWa: program.UI.dadWa },
    "https://test.invalid/",
  );
  same(
    links.map((link) => link.url),
    [
      "https://test.invalid/?masa=1",
      "https://test.invalid/tzevet",
      "https://test.invalid/join",
      "https://test.invalid/join?for=dad",
    ],
  );
  assert.ok(links[0].message.includes("https://test.invalid/?masa=1"));
  assert.ok(links[2].message.includes("צוות " + copy.kidsInst));
  assert.ok(links[2].message.includes("https://test.invalid/join"));
  assert.ok(!links[3].message.includes("{"));
  assert.equal(
    shareLinks.whatsappHref("a b&c"),
    "https://wa.me/?text=a%20b%26c",
  );
  assert.equal(shareLinks.fillTemplate("{a}-{b}", { a: "X" }), "X-");
});

test("retired copy and drive identifiers are parsed from loose input", () => {
  const retired = shareLinks.pickRetired(program.TEXT_RETIRED);
  assert.ok(Array.isArray(retired["tzevet.step4"]));
  same(shareLinks.pickRetired(null), {});
  const id = "1N8I8RnFBvH-F9Lw-YvotIj1M2w2hU7lF";
  assert.equal(
    shareLinks.driveFileId(
      "https://drive.google.com/file/d/" + id + "/view?usp=sharing",
    ),
    id,
  );
  assert.equal(
    shareLinks.driveFileId("https://drive.google.com/open?id=" + id),
    id,
  );
  assert.equal(shareLinks.driveFileId("  " + id + " "), id);
  assert.equal(shareLinks.driveImageForms(id).length, 3);
  assert.ok(shareLinks.driveImageForms("a b")[0].url.includes("a%20b"));
});

test("invitations choose wording by grade and audience and fill the institution link", () => {
  const copy = shareLinks.pickStrings(program.SEND, invitations.sendKeys);
  for (const key of invitations.sendKeys) assert.ok(copy[key], key);
  const grades = invitations.gradeList(copy);
  assert.ok(grades.length >= 3);
  assert.ok(invitations.isYoung(copy, grades[0]));
  assert.ok(!invitations.isYoung(copy, grades[grades.length - 1]));
  const origin = "https://test.invalid";
  const young = invitations.invitationMessage(
    copy,
    "sons",
    grades[0],
    origin,
    "lapid",
  );
  const older = invitations.invitationMessage(
    copy,
    "sons",
    grades[grades.length - 1],
    origin,
    "lapid",
  );
  const parent = invitations.invitationMessage(
    copy,
    "par",
    grades[0],
    origin,
    "lapid",
  );
  assert.notEqual(young, older);
  assert.ok(young.includes(origin + "/join?inst=lapid"));
  assert.ok(parent.includes(origin + "/join?for=dad"));
  assert.ok(!parent.includes("{"));
  assert.equal(
    invitations.invitationMessage(
      { young: "A", mPar: "", mSonsA: "{שכבה}", mSonsB: "" },
      "sons",
      "A",
      origin,
      "x",
    ),
    "A",
  );
});

test("institution code is sanitized and the saved grade must still exist", async () => {
  assert.equal(invitations.institutionCode("?inst=lapid"), "lapid");
  assert.equal(invitations.institutionCode("?inst=a%20b%3C"), "ab");
  assert.equal(invitations.institutionCode(""), "lapid");
  assert.equal(invitations.institutionCode("?inst=%3C%3E"), "lapid");
  assert.equal(
    invitations.institutionName([{ code: "x", name: "Example" }], "x"),
    "Example",
  );
  const values = {};
  const stored = await load(
    "src/lib/invitations.ts",
    {
      localStorage: {
        getItem: (key) => values[key] ?? null,
        setItem: (key, value) => {
          values[key] = value;
        },
      },
    },
    { "./share-links": shareLinks },
  );
  stored.saveGrade("ט׳");
  assert.equal(values["df:shlachG"], "ט׳");
  assert.equal(stored.savedGrade(["ז׳", "ט׳"]), "ט׳");
  assert.equal(stored.savedGrade(["ז׳"]), "");
  assert.equal(invitations.savedGrade(["ט׳"]), "");
});

test("team board rows tolerate broken cells and phone numbers normalize for WhatsApp", async () => {
  const team = await load("src/lib/team.ts", {}, { "./client": {} });
  const cards = team.parseTeamRows([
    ["ישיבה", "עדכון", "תגיות", "אנשים"],
    [
      "Example",
      "UPDATE",
      '["A","B",3]',
      '[{"name":"N","phone":"050-123 4567"},{"phone":"972501234567"},"bad"]',
    ],
    ["Broken", "", "{", 7],
  ]);
  assert.equal(cards.length, 2);
  same(cards[0].tags, ["A", "B"]);
  same(cards[0].people, [
    { name: "N", phone: "050-123 4567" },
    { name: "", phone: "972501234567" },
  ]);
  same(cards[1], { name: "Broken", update: "", tags: [], people: [] });
  assert.throws(() => team.parseTeamRows("rows"));
  assert.equal(team.whatsappNumber("050-123 4567"), "972501234567");
  assert.equal(team.whatsappNumber("972501234567"), "972501234567");
  assert.equal(team.phoneDigits("+972 50"), "97250");
});

test("team reads send the private key and log writes resolve only on acknowledgement", async () => {
  const calls = [];
  const team = await load(
    "src/lib/team.ts",
    {},
    {
      "./client": {
        action: async (operation, payload) => {
          calls.push([operation, payload]);
          if (payload.key === "BAD") throw new Error("Action failed");
          return operation === "read"
            ? { status: "ok", rows: [["h"], ["Example", "", "[]", "[]"]] }
            : { status: "ok" };
        },
      },
    },
  );
  const cards = await team.loadTeam("KEY");
  assert.equal(cards[0].name, "Example");
  same(calls[0], ["read", { team: "1", key: "KEY" }]);
  await team.logTeamAction("KEY", "", "Example", "שיחה");
  same(calls[1], [
    "write",
    {
      action: "teamlog",
      key: "KEY",
      cols: JSON.stringify([
        ["מי", "לא ידוע"],
        ["ישיבה", "Example"],
        ["פעולה", "שיחה"],
      ]),
    },
  ]);
  await assert.rejects(team.logTeamAction("BAD", "A", "B", "וואטסאפ"));
  await assert.rejects(team.loadTeam("BAD"));
});

test("saved team member must be one of the known members", async () => {
  const values = { "df:teamWho": "Stranger" };
  const team = await load(
    "src/lib/team.ts",
    {
      localStorage: {
        getItem: (key) => values[key] ?? null,
        setItem: (key, value) => {
          values[key] = value;
        },
        removeItem: (key) => {
          delete values[key];
        },
      },
    },
    { "./client": {} },
  );
  assert.equal(team.savedMember(), "");
  team.saveMember(team.teamMembers[0]);
  assert.equal(team.savedMember(), team.teamMembers[0]);
  team.saveMember("");
  assert.equal(values["df:teamWho"], undefined);
});
