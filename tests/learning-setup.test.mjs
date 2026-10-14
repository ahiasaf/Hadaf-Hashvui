import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
const source = await fs.readFile("src/shared/learning-setup.js", "utf8");
function visit(path, values = {}, standalone = false, mobile = true) {
  const url = new URL(path, "https://hadaf.invalid"),
    storage = new Map(
      Object.entries(values).map(([key, value]) => [
        "df:" + key,
        JSON.stringify(value),
      ]),
    );
  let target;
  vm.runInNewContext(source, {
    URLSearchParams,
    navigator: {
      standalone,
      userAgent: mobile ? "Android Chrome Mobile" : "Linux Chrome",
    },
    matchMedia: () => ({ matches: standalone }),
    location: {
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      replace: (value) => {
        target = value;
      },
    },
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  });
  return { target, storage };
}
test("first learning visit starts signup and retains the exact requested unit", () => {
  const result = visit("/learn?mas=taanit&daf=ב&amud=2");
  assert.equal(
    new URL(result.target, "https://hadaf.invalid").pathname,
    "/join",
  );
  assert.equal(
    JSON.parse(result.storage.get("df:setupNext")),
    "/learn?mas=taanit&daf=%D7%91&amud=2",
  );
});
test("phone browsers require app mode even with saved installation flags", () => {
  const me = { id: "STUDENT" };
  assert.ok(
    visit("/lesson-tools?mas=taanit", { me }).target.startsWith("/start?next="),
  );
  assert.ok(
    visit("/lesson-tools?mas=taanit", {
      me,
      installed: true,
    }).target.startsWith("/start?next="),
  );
  assert.equal(
    visit("/lesson-tools?mas=taanit", { me }, true).target,
    undefined,
  );
  assert.ok(
    visit("/app", { me, browserSetup: true }).target.startsWith("/start?next="),
  );
  assert.ok(
    visit("/app", { installed: true }).target.startsWith("/join?next="),
  );
});
test("installed app resumes the requested lesson once and rejects unrelated pending routes", () => {
  const values = {
    me: { id: "STUDENT" },
    setupNext: "/lesson-tools?mas=taanit&amud=2",
  };
  const result = visit("/app", values, true);
  assert.equal(result.target, values.setupNext);
  assert.equal(result.storage.has("df:setupNext"), false);
  for (const setupNext of ["//other.invalid/learn", "/admin", "/join"])
    assert.equal(
      visit("/app", { ...values, setupNext }, true).target,
      undefined,
    );
});
test("public pages and embedded or staff lesson tools do not enter student setup", () => {
  assert.equal(visit("/").target, undefined);
  assert.equal(visit("/join").target, undefined);
  assert.equal(visit("/lesson-tools?embed=1").target, undefined);
  assert.equal(visit("/lesson-tools?rec=1").target, undefined);
  assert.equal(visit("/lesson-tools", { admOk: 1 }).target, undefined);
});

test("desktop users continue normally after signup without installation flags", () => {
  assert.equal(
    visit("/learn?mas=taanit", { me: { id: "STUDENT" } }, false, false).target,
    undefined,
  );
  assert.ok(
    visit("/learn?mas=taanit", {}, false, false).target.startsWith(
      "/join?next=",
    ),
  );
});
