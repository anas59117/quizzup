const assert = require("assert/strict"),
  fs = require("fs"),
  path = require("path"),
  { randomBytes } = require("crypto"),
  { spawn } = require("child_process");
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const server = require("./serve.cjs"),
  out = path.resolve(__dirname, "../../.mobile-preview");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const data = fs.mkdtempSync(path.join(out, "social-qa-"));
  const backend = spawn(
    process.execPath,
    [path.resolve(__dirname, "../../../backend/server.js")],
    {
      windowsHide: true,
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: "3003",
        DATA_DIR: data,
        CORS_ORIGIN: "http://127.0.0.1:4330",
        GUEST_AUTH_SECRET: randomBytes(32).toString("hex"),
      },
      stdio: "ignore",
    },
  );
  let browser;
  try {
    await new Promise((r) => server.listen(4330, "127.0.0.1", r));
    for (let i = 0; i < 50; i++) {
      if (
        await fetch("http://127.0.0.1:3003/health")
          .then((r) => r.ok)
          .catch(() => false)
      )
        break;
      await wait(200);
    }
    browser = await chromium.launch({
      executablePath:
        process.env.EDGE_PATH ||
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      headless: true,
    });
    const pages = [],
      errors = [];
    for (const name of ["AliceSocial", "BobSocial"]) {
      const ctx = await browser.newContext({
        viewport: {
          width: 390,
          height: 844,
        },
        reducedMotion: "reduce",
      });
      await ctx.addInitScript((name) => {
        localStorage.setItem("quizzup-onboarded", "1");
        localStorage.setItem("quizzup-name", name);
        localStorage.setItem("quizzup-avatar", "robot");
        localStorage.setItem("quizzup-lang", "fr");
        const Native = window.WebSocket;
        window.__sockets = [];
        window.__events = [];
        window.WebSocket = class extends Native {
          constructor(...args) {
            super(...args);
            window.__sockets.push(this);
            this.addEventListener("message", (e) => {
              try {
                window.__events.push(JSON.parse(e.data));
              } catch {}
            });
          }
        };
      }, name);
      const p = await ctx.newPage();
      p.on("pageerror", (e) => {
        errors.push(e.message);
        console.error(e.stack);
      });
      await p.goto("http://127.0.0.1:4330/?app", {
        waitUntil: "commit",
      });
      await p.locator(".home-head").waitFor({timeout:60000});
      await p.waitForFunction(() =>
        window.__events.some((e) => e.type === "identified"),
      );
      pages.push(p);
    }
    const [a, b] = pages;
    const capture = async (page, label) => {
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${label} overflow ${width}`,
        );
        await page.screenshot({
          path: path.join(out, `social-${label}-${width}.png`),
          fullPage: true,
        });
      }
    };
    await capture(a, "home");
    const uid = await b.evaluate(
      () =>
        JSON.parse(
          atob(localStorage.getItem("quizzup-guest-token-v1").split(".")[1]),
        ).sub,
    );
    // Create the request through the live authenticated app socket; accept in the real UI.
    await a.evaluate(
      (id) =>
        window.__sockets.at(-1).send(
          JSON.stringify({
            type: "friend_request",
            targetId: id,
          }),
        ),
      uid,
    );
    await b
      .getByRole("button", {
        name: /^Messages/,
      })
      .click();
    await b.locator(".messenger-requests summary").click();
    await b
      .getByRole("button", {
        name: "Accepter",
        exact: true,
      })
      .click();
    await b
      .locator(".messenger-row")
      .filter({
        hasText: "AliceSocial",
      })
      .waitFor();
    await a
      .getByRole("button", {
        name: /^Messages/,
      })
      .click();
    await a
      .locator(".messenger-row")
      .filter({
        hasText: "BobSocial",
      })
      .click();
    await a.locator("#messenger-draft").fill("Bonjour persistant");
    await a
      .getByRole("button", {
        name: "Envoyer",
        exact: true,
      })
      .click();
    await a
      .locator(".messenger-bubble")
      .filter({
        hasText: "Bonjour persistant",
      })
      .waitFor();
    await b.locator(".messenger-row-meta b").waitFor();
    await b
      .locator(".messenger-row")
      .filter({
        hasText: "AliceSocial",
      })
      .click();
    await b
      .locator(".messenger-bubble")
      .filter({
        hasText: "Bonjour persistant",
      })
      .waitFor();
    await b.context().setOffline(true);
    await wait(500);
    await a.locator("#messenger-draft").fill("Pendant ton absence");
    await a
      .getByRole("button", {
        name: "Envoyer",
        exact: true,
      })
      .click();
    await b.context().setOffline(false);
    await b.reload({ waitUntil: "commit" });
    await b.locator(".home-head").waitFor();
    await b
      .getByRole("button", {
        name: /^Messages/,
      })
      .click();
    await b
      .locator(".messenger-row")
      .filter({
        hasText: "AliceSocial",
      })
      .click();
    await b
      .locator(".messenger-bubble")
      .filter({
        hasText: "Pendant ton absence",
      })
      .waitFor();
    await a.locator("#messenger-draft").fill("Brouillon conservé");
    await a.getByRole("button", { name: "Défier", exact: true }).click();
    await a.goBack();
    await a.locator(".messenger-sheet").waitFor({ state: "hidden" });
    await a.goBack();
    await capture(a, "inbox");
    await a.locator(".messenger-row").filter({ hasText: "BobSocial" }).click();
    assert.equal(
      await a.locator("#messenger-draft").inputValue(),
      "Brouillon conservé",
    );
    await a.locator("#messenger-draft").fill("");
    await a.setViewportSize({ width: 320, height: 500 });
    await a.locator("#messenger-draft").focus();
    assert(
      await a
        .locator(".messenger-composer")
        .evaluate((el) => el.getBoundingClientRect().bottom <= innerHeight + 1),
      "keyboard composer fits",
    );
    await capture(a, "thread");
    console.log(
      "PASS real friend accept, persistent DM, unread, offline recipient/reconnect",
    );
    await a
      .getByRole("button", {
        name: "Défier",
        exact: true,
      })
      .click();
    await a.locator(".messenger-themes button").first().click();
    await b
      .getByRole("button", {
        name: "Accepter",
        exact: true,
      })
      .click();
    for (let round = 1; round <= 6; round++) {
      await Promise.all(
        pages.map((p) =>
          p
            .locator(".game-progress-text")
            .filter({
              hasText: `Question ${round} / 6`,
            })
            .waitFor({
              timeout: 25000,
            }),
        ),
      );
      await Promise.all(
        pages.map((p) =>
          p.waitForFunction(
            () => document.querySelectorAll(".answer:enabled").length === 4,
          ),
        ),
      );
      await a.locator(".answer").first().click();
      await b.locator(".answer").nth(1).click();
    }
    await a.locator(".res-cta").waitFor({
      timeout: 20000,
    });
    console.log(
      "PASS friend challenge starts existing live duel; six rounds finish",
    );
    await a
      .getByRole("button", {
        name: /Messages · BobSocial/,
      })
      .click();
    await a.locator(".messenger-result").waitFor();
    await a.goto("http://127.0.0.1:4330/?app", {
      waitUntil: "commit",
    });
    await a.locator(".home-head").waitFor();
    await a
      .getByRole("button", {
        name: "Historique",
        exact: true,
      })
      .click();
    await a.locator(".history-card").waitFor();
    await capture(a, "history");
    assert(
      (await a.locator(".history-card").innerText()).includes("BobSocial"),
    );
    await a
      .getByRole("button", {
        name: "Retour",
        exact: true,
      })
      .click();
    await a
      .getByRole("button", {
        name: "Accueil",
        exact: true,
      })
      .click();
    await a
      .getByRole("button", {
        name: "Communauté",
        exact: true,
      })
      .click();
    const post = async (text) => {
      await a
        .getByLabel("Ta publication", {
          exact: true,
        })
        .fill(text);
      await a
        .getByRole("button", {
          name: "Publier",
          exact: true,
        })
        .click();
      await a
        .locator(".feed-post-text")
        .filter({
          hasText: text,
        })
        .waitFor();
    };
    await post("Publication réelle");
    await a
      .getByRole("button", {
        name: "Photo",
        exact: true,
      })
      .click();
    const jpeg = await a.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 50;
      c.height = 50;
      c.getContext("2d").fillRect(0, 0, 50, 50);
      return c.toDataURL("image/jpeg").split(",")[1];
    });
    await a
      .getByLabel("Photo", {
        exact: true,
      })
      .setInputFiles({
        name: "post.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from(jpeg, "base64"),
      });
    await post("Photo réelle");
    await a.locator(".community-photo").evaluate((img) => img.decode());
    await a
      .getByRole("button", {
        name: "Question",
        exact: true,
      })
      .click();
    await a
      .getByLabel("Question", {
        exact: true,
      })
      .fill("Deux plus deux ?");
    for (let i = 1; i <= 4; i++)
      await a
        .getByLabel(`Réponse ${i}`, {
          exact: true,
        })
        .fill(String(i + 3));
    await post("Question réelle");
    const card = a.locator(".feed-post").filter({
      hasText: "Question réelle",
    });
    await card
      .getByRole("button", {
        name: "4",
        exact: true,
      })
      .click();
    await card
      .getByRole("status")
      .filter({
        hasText: "Bonne réponse",
      })
      .waitFor();
    await card
      .getByRole("button", {
        name: /Commentaires/,
      })
      .click();
    await card.getByLabel("Ton commentaire").fill("Commentaire réel");
    await card
      .getByRole("button", {
        name: "Envoyer",
        exact: true,
      })
      .click();
    await card
      .getByText("Commentaire réel", {
        exact: false,
      })
      .waitFor();
    console.log(
      "PASS community text, HTTP image upload, canonical question result and real comment",
    );
    for (const width of [320, 375, 390, 430]) {
      await a.setViewportSize({
        width,
        height: 844,
      });
      assert(
        await a.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow ${width}`,
      );
      await a.screenshot({
        path: path.join(out, `social-community-${width}.png`),
        fullPage: true,
      });
    }
    const sharedId = await card.getAttribute("id");
    await a.goto(`http://127.0.0.1:4330/?app#${sharedId}`, {
      waitUntil: "commit",
    });
    await a.getByRole("heading", { name: "Communauté", exact: true }).waitFor();
    await a.locator(`#${sharedId}`).waitFor();
    await a.goto("http://127.0.0.1:4330/?app#post-missing-share", {
      waitUntil: "commit",
    });
    await a
      .getByRole("alert")
      .filter({ hasText: "Cette publication est indisponible" })
      .waitFor();
    console.log(
      "PASS authenticated shared post deep link and missing post feedback",
    );
    await a.goto("http://127.0.0.1:4330/?app", {
      waitUntil: "commit",
    });
    await a.locator(".home-head").waitFor();
    await a.getByRole("button", { name: /^Messages/ }).click();
    await a.locator(".messenger-row").filter({ hasText: "BobSocial" }).click();
    await a.getByRole("button", { name: "Défier", exact: true }).click();
    await a
      .getByRole("button", { name: "Chacun son tour", exact: true })
      .click();
    await a.locator(".messenger-themes button").first().click();
    await a
      .getByRole("button", { name: "Jouer mes 6 questions", exact: true })
      .click();
    await a.locator(".async-duel").waitFor();
    await a.goBack();
    await a.locator(".async-duel").waitFor({ state: "hidden" });
    await a.locator("#messenger-draft").waitFor();
    console.log("PASS browser Back closes async sheet before thread");
    await wait(2200);
    await a
      .getByRole("button", { name: "Voir le profil · BobSocial", exact: true })
      .click();
    const profile = a.getByRole("dialog", { name: "BobSocial", exact: true });
    await profile
      .getByRole("button", { name: "Retirer cet ami", exact: true })
      .click();
    await profile
      .getByRole("button", { name: "Confirmer la suppression", exact: true })
      .click();
    await a.waitForFunction(() =>
      window.__events.some((event) => event.type === "friend_removed"),
    );
    await profile
      .getByRole("button", { name: "Ajouter", exact: false })
      .waitFor();
    assert.equal(
      await profile
        .getByRole("button", { name: "Message / Défi", exact: true })
        .count(),
      0,
    );
    console.log(
      "PASS confirmed reachable Remove friend revokes membership from actual App profile",
    );
    assert.deepEqual(errors, []);
    console.log("PASS mobile widths320/375/390/430 and zero runtime errors");
  } catch (error) {
    if (browser) {
      for (const [index, page] of browser
        .contexts()
        .flatMap((ctx) => ctx.pages())
        .entries()) {
        await page
          .screenshot({
            path: path.join(out, `social-failure-${index}.png`),
            fullPage: true,
          })
          .catch(() => {});
        console.error(
          "PAGE",
          index,
          await page
            .locator("body")
            .innerText()
            .catch(() => ""),
        );
      }
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    backend.kill();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
