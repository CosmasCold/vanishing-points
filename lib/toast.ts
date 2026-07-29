export function showToast(
  message: string,
  type: "success" | "info" | "warning" = "info"
) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("showtoast", { detail: { message, type } })
    );
  }
}