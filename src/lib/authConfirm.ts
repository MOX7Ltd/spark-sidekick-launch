export const confirmByEmailRequired =
  !(import.meta.env.VITE_DISABLE_EMAIL_CONFIRM === "true");

export const isEmailConfirmError = (e?: any) =>
  !!(e?.status === 400 && String(e?.message).toLowerCase().includes("confirm"));
