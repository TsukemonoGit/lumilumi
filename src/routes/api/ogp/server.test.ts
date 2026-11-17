import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./+server";

const call = (target: string) =>
  GET({
    url: new URL(`https://lumilumi.app/api/ogp?url=${encodeURIComponent(target)}`),
  } as Parameters<typeof GET>[0]);

const html = (title: string) =>
  new Response(
    `<html><head><meta property="og:title" content="${title}"></head></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );

const redirect = (location: string) =>
  new Response(null, { status: 302, headers: { location } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/api/ogp redirects", () => {
  it("does not follow a redirect to a private address", async () => {
    const fetchMock = vi.fn(async () =>
      redirect("https://169.254.169.254/latest/meta-data/"),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(call("https://public.example/start")).rejects.toMatchObject({
      status: 404,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("still follows a redirect to another public page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(redirect("https://www.public.example/page"))
      .mockResolvedValueOnce(html("Moved page"));
    vi.stubGlobal("fetch", fetchMock);

    const response = await call("https://public.example/start");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await response.json()).toMatchObject({ title: "Moved page" });
  });
});
