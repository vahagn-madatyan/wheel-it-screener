import { describe, it, expect } from "vitest";
import { formatNum, formatMktCap, escapeHtml, truncate } from "../formatters";

describe("formatNum", () => {
  it("formats normal numbers with specified decimals", () => {
    expect(formatNum(1234.5678, 2)).toBe("1,234.57");
    expect(formatNum(42, 0)).toBe("42");
    expect(formatNum(0.123, 3)).toBe("0.123");
  });

  it("returns em-dash for null, undefined, NaN", () => {
    expect(formatNum(null, 2)).toBe("—");
    expect(formatNum(undefined, 2)).toBe("—");
    expect(formatNum(NaN, 2)).toBe("—");
  });

  it("handles locale grouping for large numbers", () => {
    expect(formatNum(1000000, 0)).toBe("1,000,000");
    expect(formatNum(999999.99, 1)).toBe("1,000,000.0");
  });

  it("handles zero", () => {
    expect(formatNum(0, 2)).toBe("0.00");
  });

  it("handles negative numbers", () => {
    expect(formatNum(-42.5, 1)).toBe("-42.5");
  });

  it("handles various decimal counts", () => {
    expect(formatNum(3.14159, 0)).toBe("3");
    expect(formatNum(3.14159, 1)).toBe("3.1");
    expect(formatNum(3.14159, 4)).toBe("3.1416");
  });
});

describe("formatMktCap", () => {
  it("formats trillions", () => {
    expect(formatMktCap(2.5e12)).toBe("$2.5T");
    expect(formatMktCap(1e12)).toBe("$1.0T");
  });

  it("formats billions", () => {
    expect(formatMktCap(150e9)).toBe("$150.0B");
    expect(formatMktCap(1.5e9)).toBe("$1.5B");
  });

  it("formats millions", () => {
    expect(formatMktCap(500e6)).toBe("$500M");
    expect(formatMktCap(42e6)).toBe("$42M");
  });

  it("formats sub-million with locale", () => {
    expect(formatMktCap(999999)).toBe("$999,999");
  });

  it("returns em-dash for zero, negative, null, undefined", () => {
    expect(formatMktCap(0)).toBe("—");
    expect(formatMktCap(-100)).toBe("—");
    expect(formatMktCap(null)).toBe("—");
    expect(formatMktCap(undefined)).toBe("—");
  });
});

describe("escapeHtml", () => {
  it("escapes all 5 special characters", () => {
    expect(escapeHtml("<script>alert('x\"&')</script>")).toBe(
      "&lt;script&gt;alert(&#39;x&quot;&amp;&#39;)&lt;/script&gt;",
    );
  });

  it("escapes ampersand", () => {
    expect(escapeHtml("A&B")).toBe("A&amp;B");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hi"')).toBe("say &quot;hi&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("returns empty string for empty/null/undefined input", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("passes through clean strings unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });
});

describe("truncate", () => {
  it("returns full string when under limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns full string when at exact limit", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates and appends ... when over limit", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });

  it("returns empty string for null/undefined/empty", () => {
    expect(truncate("", 5)).toBe("");
    expect(truncate(null, 5)).toBe("");
    expect(truncate(undefined, 5)).toBe("");
  });
});
