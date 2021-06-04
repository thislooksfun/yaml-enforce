it("should", () => {
  expect(() => {
    throw new Error("some\nmultiline\nmessage\n");
  }).toThrow("some\nmultiline\nmessage\n");
});
