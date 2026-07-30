import { describe, it, expect } from "vitest";

import { parseCSV, CSVImportError } from "../../src/campaign-engine/csv-import.js";

describe("parseCSV", () => {
  it("parses a simple phone-only CSV", () => {
    const r = parseCSV("phone\n+919999999999\n+919811111111\n");
    expect(r.numbers).toHaveLength(2);
    expect(r.numbers[0]).toEqual({ phone: "+919999999999", customData: {} });
    expect(r.rejected).toEqual([]);
  });

  it("captures extra columns as customData", () => {
    const r = parseCSV("phone,name,score\n+919999999999,Asha,87\n");
    expect(r.numbers[0]).toEqual({
      phone: "+919999999999",
      customData: { name: "Asha", score: "87" },
    });
  });

  it("is case-insensitive on the phone header and accepts phone_number alias", () => {
    expect(parseCSV("Phone\n+919999999999\n").numbers).toHaveLength(1);
    expect(parseCSV("phone_number\n+919999999999\n").numbers).toHaveLength(1);
  });

  it("rejects invalid phone rows with line numbers but continues", () => {
    const r = parseCSV("phone\n+919999999999\nnot-a-phone\n+919811111111\n");
    expect(r.numbers).toHaveLength(2);
    expect(r.rejected).toEqual([{ line: 3, reason: 'invalid phone "not-a-phone"' }]);
  });

  it("handles quoted fields with embedded commas and escaped quotes", () => {
    const r = parseCSV('phone,note\n+919999999999,"hello, world ""quoted"""\n');
    expect(r.numbers[0]).toEqual({
      phone: "+919999999999",
      customData: { note: 'hello, world "quoted"' },
    });
  });

  it("accepts \\r\\n line endings", () => {
    const r = parseCSV("phone\r\n+919999999999\r\n+919811111111\r\n");
    expect(r.numbers).toHaveLength(2);
  });

  it("throws when the phone column is missing", () => {
    expect(() => parseCSV("name,score\nAsha,87\n")).toThrow(CSVImportError);
  });

  it("throws on empty input", () => {
    expect(() => parseCSV("")).toThrow(CSVImportError);
  });

  it("skips trailing blank lines", () => {
    const r = parseCSV("phone\n+919999999999\n\n\n");
    expect(r.numbers).toHaveLength(1);
    expect(r.rejected).toEqual([]);
  });

  it("handles BOM and flexible headers like Mobile Number", () => {
    const r = parseCSV("\uFEFF\"Mobile Number\",Name\n\"+91 99999-99999\",Asha\n");
    expect(r.numbers).toHaveLength(1);
    expect(r.numbers[0]).toEqual({
      phone: "+919999999999",
      customData: { name: "Asha" },
    });
  });

  it("sanitizes formatted phone numbers with spaces, dashes, and parens", () => {
    const r = parseCSV("phone\n+91 (981) 111-1111\n'9848012345'\n");
    expect(r.numbers).toHaveLength(2);
    expect(r.numbers[0].phone).toBe("+919811111111");
    expect(r.numbers[1].phone).toBe("9848012345");
  });
});
