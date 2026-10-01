import { describe, expect, it } from "vitest";
import { parseAuthorizationRequest, readOAuthQuery } from "./authorization-request";

const signed =
  "response_type=code&client_id=abc&redirect_uri=https%3A%2F%2Fclaude.ai%2Fapi%2Fmcp%2Fauth_callback" +
  "&scope=openid+profile+email+offline_access&state=xyz&exp=2000000000&sig=s1g";

describe("readOAuthQuery", () => {
  it("keeps the signed query byte-for-byte", () => {
    expect(readOAuthQuery(`?${signed}`)).toBe(signed);
    expect(readOAuthQuery(signed)).toBe(signed);
  });

  it("ignores pages that are not part of an authorization", () => {
    expect(readOAuthQuery("?error=google")).toBeNull();
    expect(readOAuthQuery("")).toBeNull();
  });
});

describe("parseAuthorizationRequest", () => {
  it("extracts the client, the redirect host and readable scopes", () => {
    const request = parseAuthorizationRequest(signed, 1_000_000_000_000);
    expect(request.clientId).toBe("abc");
    expect(request.redirectHost).toBe("claude.ai");
    expect(request.scopes.map((s) => s.scope)).toEqual([
      "openid",
      "profile",
      "email",
      "offline_access",
    ]);
    expect(request.scopes[2].description).toBe("See your email address");
    expect(request.expired).toBe(false);
  });

  it("flags expired links and tolerates odd input", () => {
    const request = parseAuthorizationRequest(
      "client_id=c&redirect_uri=not-a-url&scope=openid%20custom%20openid&exp=10&sig=x",
      20_000,
    );
    expect(request.expired).toBe(true);
    expect(request.redirectHost).toBeNull();
    expect(request.scopes).toEqual([
      { scope: "openid", description: "Confirm who you are" },
      { scope: "custom", description: "custom" },
    ]);
  });
});
