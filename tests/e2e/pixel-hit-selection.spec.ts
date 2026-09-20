import { expect, test } from "@playwright/test";
import path from "node:path";

test.setTimeout(180_000);

test("Baddies canvas raises small grab targets and preserves large-layer pixel selection", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    localStorage.setItem("nf:pwa-install-ack:v1", "1");
    localStorage.setItem("nf:saveNoticeDismissed", "1");
    localStorage.setItem("nf:onboarded:v1", "1");
    sessionStorage.setItem("nightlife-flyers:coco-startup-intro:v1", "1");
  });
  await page.goto("/?studio=1&template=new-york&format=square", {
    waitUntil: "domcontentloaded",
  });
  const continueButton = page.getByRole("button", { name: /continue for now/i });
  await continueButton.click({ timeout: 5_000 }).catch(() => {});
  const moreTools = page.getByTestId('coco-canvas-tools').getByRole('button', { name: 'More tools', exact: true });
  await expect(moreTools).toBeVisible({ timeout: 45_000 });
  await moreTools.click();
  const projectToggle = page.locator('button[aria-expanded]').filter({ hasText: /project/i }).first();
  await expect(projectToggle).toBeVisible({ timeout: 45_000 });
  if ((await projectToggle.getAttribute("aria-expanded")) !== "true") await projectToggle.click();
  const projectInput = page.locator('input[type="file"][accept*=".nflyer"]').first();
  await projectInput.setInputFiles(
    process.env.BADDIES_PROJECT_FILE ||
      path.resolve(process.cwd(), "public/generated-flyers/baddies-n-bundles.nflyer"),
  );
  await expect(page.locator('[data-tour="artboard"]')).toBeVisible();

  const background = page.locator('[data-coco-compiled-object="background"]');
  await expect(background).toBeVisible();
  expect(await background.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe("none");
  const unlockBackground = page.getByRole("button", { name: "Unlock background", exact: true });
  await expect(unlockBackground).toBeVisible();
  for (const objectId of [
    "green-glow",
    "stripe-left",
    "stripe-orb-top",
    "stripe-orb-right",
    "stripe-orb-bottom",
    "dot-trail",
    "accent-waves-left",
    "accent-waves-right",
  ]) {
    const artwork = page.locator(`[data-coco-compiled-object="${objectId}"]`);
    await expect(artwork).toBeVisible();
    expect(
      await artwork.evaluate((element) => getComputedStyle(element).pointerEvents),
      `${objectId} must remain selectable above the locked base background`,
    ).toBe("auto");
  }
  expect(
    await background.getAttribute("data-hit-mask-ready"),
    "the locked full-canvas background must not delay selectable CSS hit masks",
  ).toBeNull();

  // A real browser click (not a dispatched event) must reach painted
  // background artwork through the locked, full-canvas base layer. Do not
  // wait for its mask: the first interaction itself must survive mask warming.
  const selectableStripe = page.locator('[data-coco-compiled-object="stripe-left"]');
  // Object-local samples remain on the narrow painted stripe after the layer
  // is moved, scaled, rotated, or rendered at a different editor zoom.
  const selectableStripePoints = await selectableStripe.evaluate((element) => {
    const html = element as HTMLElement;
    const bounds = html.getBoundingClientRect();
    const width = html.offsetWidth;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(html).transform || undefined);
    return [0.477, 0.49, 0.465].map((ratioX) => {
      const point = new DOMPoint(
        (ratioX - 0.5) * width,
        0,
      ).matrixTransform(matrix);
      return {
        x: bounds.left + bounds.width / 2 + point.x,
        y: bounds.top + bounds.height / 2 + point.y,
      };
    });
  });
  let realBackgroundClickSelected = false;
  for (const point of selectableStripePoints) {
    await page.mouse.click(point.x, point.y);
    await expect
      .poll(() => selectableStripe.getAttribute("data-coco-compiled-selected"), {
        timeout: 10_000,
      })
      .toBe("true")
      .catch(() => {});
    if ((await selectableStripe.getAttribute("data-coco-compiled-selected")) === "true") {
      realBackgroundClickSelected = true;
      break;
    }
  }
  expect(realBackgroundClickSelected).toBe(true);

  // Fully painted CSS gradients must be selectable directly. The connector
  // disc is a dark radial gradient over the headline; raster mask generation
  // previously returned an empty mask and handed every click to the text.
  const connectorDisc = page.locator('[data-coco-compiled-object="connector-disc"]');
  await expect(connectorDisc).toBeVisible();
  const connectorDiscBox = await connectorDisc.boundingBox();
  expect(connectorDiscBox).not.toBeNull();
  await page.mouse.click(
    connectorDiscBox!.x + connectorDiscBox!.width / 2,
    connectorDiscBox!.y + connectorDiscBox!.height * 0.08,
  );
  await expect(connectorDisc).toHaveAttribute("data-coco-compiled-selected", "true");

  // This dot is visually exposed through a transparent part of the subject,
  // while the dot-trail layer itself sits below that full image wrapper.
  // Its mask must be generated from the layer, not from the occluded stack.
  const dotTrail = page.locator('[data-coco-compiled-object="dot-trail"]');
  await expect(dotTrail).toHaveAttribute("data-hit-mask-ready", "true", { timeout: 20_000 });
  const dotTrailPoint = await dotTrail.evaluate((element) => {
    const html = element as HTMLElement;
    const bounds = html.getBoundingClientRect();
    const width = html.offsetWidth;
    const height = html.offsetHeight;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(html).transform || undefined);
    const point = new DOMPoint(
      (0.57 - 0.5) * width,
      (0.61 - 0.5) * height,
    ).matrixTransform(matrix);
    return {
      x: bounds.left + bounds.width / 2 + point.x,
      y: bounds.top + bounds.height / 2 + point.y,
    };
  });
  await page.mouse.click(dotTrailPoint.x, dotTrailPoint.y);
  await expect(dotTrail).toHaveAttribute("data-coco-compiled-selected", "true");

  await unlockBackground.click();
  await expect(background).toHaveAttribute("data-coco-compiled-selected", "true");
  expect(await background.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe("auto");
  await expect(unlockBackground).toBeHidden();

  const plus = page.locator('[data-coco-compiled-object="accent-plus"]');
  await expect(plus).toBeVisible();
  await expect(plus.locator('img[data-hit-source="true"]')).toBeAttached();
  const plusMask = await plus.locator('img[data-hit-source="true"]').evaluate((node) => {
    const image = node as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    return {
      complete: image.complete,
      width: image.naturalWidth,
      height: image.naturalHeight,
      center: Array.from(
        context.getImageData(
          Math.floor(image.naturalWidth / 2),
          Math.floor(image.naturalHeight / 2),
          1,
          1,
        ).data,
      ),
    };
  });
  expect(plusMask.complete).toBe(true);
  expect(plusMask.width).toBeGreaterThan(0);
  expect(plusMask.center[3]).toBeGreaterThan(12);

  const plusBox = await plus.boundingBox();
  expect(plusBox).not.toBeNull();
  const dispatchPointer = async (target: typeof plus, x: number, y: number) => {
    await target.dispatchEvent("pointerdown", {
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: x,
      clientY: y,
    });
    await target.dispatchEvent("pointerup", {
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: 0,
      clientX: x,
      clientY: y,
    });
  };
  // Small graphics intentionally have a larger top-layer grab target now.
  // A real click in its transparent corner must select the plus, even over
  // other artwork. Large layers retain their normal pixel hit testing.
  const plusGrabId = await plus.locator('[data-small-grab-anchor="true"]').getAttribute('data-grab-target');
  const plusGrab = page.locator(`[id="${plusGrabId}"]`);
  await expect(plusGrab).toBeVisible();
  const plusGrabBox = (await plusGrab.boundingBox())!;
  await page.mouse.click(plusGrabBox.x + 2, plusGrabBox.y + 2);
  await expect(plus).toHaveAttribute("data-coco-compiled-selected", "true");
  await dispatchPointer(plus, plusBox!.x + plusBox!.width / 2, plusBox!.y + plusBox!.height / 2);
  await expect(plus).toHaveAttribute("data-coco-compiled-selected", "true");

  const dateFrame = page.locator('[data-coco-compiled-object="date-frame"]');
  await expect(dateFrame).toHaveAttribute("data-hit-mode", "alpha-envelope");
  await expect(dateFrame).toHaveAttribute("data-hit-mask-ready", "true", { timeout: 20_000 });
  const dateFrameBox = await dateFrame.boundingBox();
  expect(dateFrameBox).not.toBeNull();
  await dispatchPointer(
    dateFrame,
    dateFrameBox!.x + dateFrameBox!.width / 2,
    dateFrameBox!.y + dateFrameBox!.height / 2,
  );
  await expect(dateFrame).toHaveAttribute("data-coco-compiled-selected", "true");

  const logo = page.locator('[data-coco-compiled-object="logo"]');
  await expect(logo).toHaveAttribute("data-hit-mode", "alpha-envelope");
  const logoBox = await logo.boundingBox();
  expect(logoBox).not.toBeNull();
  await dispatchPointer(logo, logoBox!.x + logoBox!.width / 2, logoBox!.y + logoBox!.height / 2);
  await expect(logo).toHaveAttribute("data-coco-compiled-selected", "true");
  const replaceLogoButton = page.getByRole("button", { name: "Replace Logo", exact: true }).first();
  await expect(replaceLogoButton).toBeVisible();
  const logoFileChooser = page.waitForEvent("filechooser");
  await replaceLogoButton.click();
  await (await logoFileChooser).setFiles(
    path.resolve(process.cwd(), "public/branding/nf-logo-192.png"),
  );
  await expect(logo.locator('img[data-hit-source="true"]')).toHaveAttribute("src", /^data:image\//);
  const logoPanelToggle = page
    .locator('button[aria-expanded]')
    .filter({ hasText: /logo \/ 3d/i })
    .first();
  await expect(logoPanelToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#logo-selected-controls")).toBeVisible();

  await page
    .getByRole("button", { name: "Dismiss save notice", exact: true })
    .click({ timeout: 2_000 })
    .catch(() => {});
  const quickEditButton = page.getByRole("button", { name: "Quick Edit", exact: true });
  await expect(quickEditButton).toBeVisible();
  await quickEditButton.evaluate((button) => (button as HTMLButtonElement).click());
  const dateField = page.getByTestId("coco-quick-date");
  await expect(dateField).toBeVisible();
  await dateField.fill("Dec 1 2026");
  await expect
    .poll(() =>
      page
        .locator('[data-coco-compiled-object="date"] [data-coco-compiled-visible-run]')
        .allTextContents(),
    )
    .toEqual(["TUESDAY", "1", "DEC"]);
  const hostField = page.locator('[data-testid="coco-quick-details"]');
  await expect(hostField).toBeVisible();
  await hostField.fill("Host One\nHost Two");
  const hostRunGeometry = await page
    .locator('[data-coco-compiled-object="hype"]')
    .locator('[data-coco-compiled-visible-run]')
    .evaluateAll((runs) =>
      runs.map((run) => ({
        fontSize: Number.parseFloat(getComputedStyle(run).fontSize),
        text: run.textContent,
      })),
    );
  expect(hostRunGeometry.map((run) => run.text)).toEqual(["hosted by", "Host One", "Host Two"]);
  expect(hostRunGeometry[0].fontSize).toBeLessThan(hostRunGeometry[1].fontSize);
  expect(hostRunGeometry[1].fontSize).toBe(hostRunGeometry[2].fontSize);

  const lineupField = page.locator('[data-testid="coco-quick-lineup"]');
  await lineupField.fill("DJ One\nDJ Two");
  const lineupRunGeometry = await page
    .locator('[data-coco-compiled-object="dj-lineup"]')
    .locator('[data-coco-compiled-visible-run]')
    .evaluateAll((runs) =>
      runs.map((run) => ({
        fontSize: Number.parseFloat(getComputedStyle(run).fontSize),
        text: run.textContent,
      })),
    );
  expect(lineupRunGeometry.map((run) => run.text)).toEqual(["music by", "DJ One", "DJ Two"]);
  expect(lineupRunGeometry[0].fontSize).toBeLessThan(lineupRunGeometry[1].fontSize);
  expect(lineupRunGeometry[1].fontSize).toBe(lineupRunGeometry[2].fontSize);

  const stripe = page.locator('[data-coco-compiled-object="stripe-left"]');
  await expect(stripe).toHaveAttribute("data-hit-mask-ready", "true", { timeout: 20_000 });
  const stripePoints = await stripe.evaluate((element) => {
    const html = element as HTMLElement;
    const bounds = html.getBoundingClientRect();
    const width = html.offsetWidth;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(html).transform || undefined);
    const clientPoint = (localX: number) => {
      const point = new DOMPoint(localX - width / 2, 0).matrixTransform(matrix);
      return { x: bounds.left + bounds.width / 2 + point.x, y: bounds.top + bounds.height / 2 + point.y };
    };
    return {
      candidates: Array.from({ length: 33 }, (_, index) => clientPoint(index * 0.5)),
      gap: clientPoint(4),
    };
  });

  await dispatchPointer(stripe, stripePoints.gap.x, stripePoints.gap.y);
  await expect(stripe).not.toHaveAttribute("data-coco-compiled-selected", "true");
  let paintedStripeSelected = false;
  for (const point of stripePoints.candidates) {
    await dispatchPointer(stripe, point.x, point.y);
    if ((await stripe.getAttribute("data-coco-compiled-selected")) === "true") {
      paintedStripeSelected = true;
      break;
    }
  }
  expect(paintedStripeSelected).toBe(true);

  const textOwner = page.locator('[data-node]:has([data-text-glyph-box="true"]):visible').first();
  const textSurface = textOwner.locator('[data-text-hit-surface="true"]:visible').first();
  await expect(textSurface).toBeVisible();
  const textHitStyles = await textSurface.evaluate((surface) => ({
    owner: getComputedStyle(surface.closest('[data-node]')!).pointerEvents,
    surface: getComputedStyle(surface).pointerEvents,
  }));
  expect(textHitStyles.owner).toBe("none");
  expect(textHitStyles.surface.toLowerCase()).toBe("visiblepainted");

  // The disabled text wrapper must not suppress its painted SVG glyph target.
  const paintedTextPointFound = await textSurface.evaluate((surface) => {
    const bounds = surface.getBoundingClientRect();
    for (let row = 1; row < 12; row += 1) {
      for (let column = 1; column < 24; column += 1) {
        const x = bounds.left + (bounds.width * column) / 24;
        const y = bounds.top + (bounds.height * row) / 12;
        const hits = document.elementsFromPoint(x, y);
        if (
          hits.some(
            (hit) => hit === surface || hit.closest('[data-text-hit-surface="true"]') === surface,
          )
        ) return true;
      }
    }
    return false;
  });
  expect(paintedTextPointFound).toBe(true);

  const compiledDate = page.locator('[data-coco-compiled-object="date"]');
  const styledDateGeometry = await compiledDate.evaluate((owner) => {
    const rect = (element: Element) => {
      const bounds = element.getBoundingClientRect();
      return {
        centerX: bounds.left + bounds.width / 2,
        centerY: bounds.top + bounds.height / 2,
        height: bounds.height,
        width: bounds.width,
      };
    };
    return {
      hit: Array.from(owner.querySelectorAll('[data-text-hit-run]')).map(rect),
      visible: Array.from(owner.querySelectorAll('[data-coco-compiled-visible-run]')).map(rect),
    };
  });
  expect(styledDateGeometry.visible.length).toBeGreaterThanOrEqual(2);
  expect(styledDateGeometry.hit).toHaveLength(styledDateGeometry.visible.length);
  styledDateGeometry.visible.forEach((visibleRun, index) => {
    const hitRun = styledDateGeometry.hit[index];
    expect(Math.abs(hitRun.centerX - visibleRun.centerX)).toBeLessThan(5);
    expect(Math.abs(hitRun.centerY - visibleRun.centerY)).toBeLessThan(8);
    expect(hitRun.width).toBeLessThan(visibleRun.width * 1.2 + 3);
  });

  await page
    .getByTestId("coco-quick-fine-tune")
    .evaluate((button) => (button as HTMLButtonElement).click());
  await expect(projectToggle).toBeVisible();
  if ((await projectToggle.getAttribute("aria-expanded")) !== "true") {
    await projectToggle.evaluate((button) => (button as HTMLButtonElement).click());
  }
  const reloadedProjectInput = page.locator('input[type="file"][accept*=".nflyer"]').first();
  await reloadedProjectInput.setInputFiles(
    path.resolve(process.cwd(), "public/generated-flyers/glow-in-the-dark.nflyer"),
  );
  await expect(page.locator('[data-coco-compiled-object="dark-title"]')).toBeVisible();
  const price = page.locator('[data-node="price"]:visible');
  await expect(price).toBeVisible();
  const priceHitGeometry = await price.evaluate((owner) => {
    const bounds = owner.getBoundingClientRect();
    const cornerX = bounds.left + 2;
    const cornerY = bounds.top + 2;
    const cornerHitsOwner = document.elementsFromPoint(cornerX, cornerY).some(
      (element) => element === owner || element.closest('[data-node="price"]') === owner,
    );
    return {
      cornerHitsOwner,
      ownerPointerEvents: getComputedStyle(owner).pointerEvents,
      ringHitSurfaces: owner.querySelectorAll('circle[data-text-hit-surface="true"]').length,
      textHitSurfaces: owner.querySelectorAll('text[data-text-hit-surface="true"]').length,
    };
  });
  expect(priceHitGeometry.ownerPointerEvents).toBe("none");
  expect(priceHitGeometry.cornerHitsOwner).toBe(false);
  expect(priceHitGeometry.ringHitSurfaces).toBe(0);
  expect(priceHitGeometry.textHitSurfaces).toBeGreaterThan(0);

  expect(pageErrors).toEqual([]);
});
