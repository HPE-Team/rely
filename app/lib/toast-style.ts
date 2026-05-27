export const toastFill = () => {
  if (typeof document === "undefined") return "#171717";
  return document.documentElement.classList.contains("dark")
    ? "#171717"
    : "#f5f0eb";
};
