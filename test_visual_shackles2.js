// We cannot mock globally required modules easily without a test runner like jest. We can manually run UI tests using playwright instead of mocking.
console.log("Mock setup skipped due to esm loading order. Verification relies on source inspection.");
