import { searchLocalPlaces } from "./place-search";

describe("local Philippine place search", () => {
  test.each([
    ["kyusi", "Quezon City"],
    ["luneta", "Rizal Park"],
    ["ust", "University of Santo Tomas"],
    ["escolt", "Escolta"],
  ])("ranks %s as %s", (query, expected) => {
    expect(searchLocalPlaces(query)[0]?.name).toBe(expected);
  });
});
