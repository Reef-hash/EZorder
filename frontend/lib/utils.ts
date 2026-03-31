export const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString()
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export const generateWhatsAppMessage = (
  customerName: string,
  items: Array<{ name: string; quantity: number }>,
  total: number
): string => {
  const itemsList = items.map((item) => `• ${item.name} x${item.quantity}`).join('\n')
  return `Hi ${customerName},\n\nYour order:\n${itemsList}\n\nTotal: RM${total.toFixed(2)}\n\nThank you!`
}
