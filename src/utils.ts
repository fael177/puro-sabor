/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CartItem, Order } from './types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function padText(left: string, right: string, width: number = 32): string {
  const spaces = width - (left.length + right.length);
  return left + (spaces > 0 ? " ".repeat(spaces) : " ") + right;
}

export function formatAsMonospaceReceipt(
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  items: { productName: string; quantity: number; price: number; notes?: string; addOns?: { name: string; price: number; quantity?: number }[] }[],
  subtotal: number,
  deliveryFee: number,
  total: number,
  notes?: string
): string {
  const width = 31; // Perfect fit for normal screen sizes without word wraps
  const lineStr = "-".repeat(width);
  const doubleLineStr = "=".repeat(width);
  
  let receipt = "";
  receipt += `${doubleLineStr}\n`;
  receipt += `     🍔 PURO SABOR BURGER 🍔     \n`;
  receipt += `${doubleLineStr}\n`;
  
  receipt += `CLIENTE: ${customerName.substring(0, 21)}\n`;
  receipt += `CELULAR: ${customerPhone.substring(0, 21)}\n`;
  
  // Pretty-print address details with wrapping
  const cleanAddr = customerAddress;
  receipt += `ENDERECO:\n`;
  for (let i = 0; i < cleanAddr.length; i += width - 2) {
    receipt += `  ${cleanAddr.substring(i, i + width - 2)}\n`;
  }
  
  receipt += `${lineStr}\n`;
  receipt += `QTD  PRODUTO             TOTAL\n`;
  receipt += `${lineStr}\n`;
  
  items.forEach((item) => {
    const baseItemPrice = item.price;
    const formattedPrice = formatCurrency(baseItemPrice * item.quantity);
    const qtyPrefix = `${item.quantity}x `;
    
    // Compute max characters available for product name
    const maxNameLen = width - qtyPrefix.length - formattedPrice.length - 1;
    let nameToPrint = item.productName;
    if (nameToPrint.length > maxNameLen) {
      nameToPrint = nameToPrint.substring(0, maxNameLen - 3) + "...";
    }
    
    receipt += padText(`${qtyPrefix}${nameToPrint}`, formattedPrice, width) + "\n";
    
    if (item.addOns && item.addOns.length > 0) {
      item.addOns.forEach((add) => {
        const qty = add.quantity || 1;
        const addValue = add.price * qty;
        const addText = `+ ${qty > 1 ? `${qty}x ` : ''}${add.name}`;
         const addPriceText = `+${formatCurrency(addValue)}`;
        
        const maxAddLen = width - 4 - addPriceText.length;
        let addNameToPrint = addText;
        if (addNameToPrint.length > maxAddLen) {
          addNameToPrint = addNameToPrint.substring(0, maxAddLen - 3) + "...";
        }
        receipt += padText(`  ${addNameToPrint}`, addPriceText, width) + "\n";
      });
    }
    
    if (item.notes) {
      receipt += `  Obs: "${item.notes.substring(0, 24)}"\n`;
    }
  });
  
  receipt += `${doubleLineStr}\n`;
  receipt += padText("SUBTOTAL:", formatCurrency(subtotal), width) + "\n";
  
  const deliveryStr = deliveryFee > 0 ? formatCurrency(deliveryFee) : "GRATIS (Sapucaia)";
  receipt += padText("TAXA DE ENTREGA:", deliveryStr, width) + "\n";
  
  receipt += `${lineStr}\n`;
  receipt += padText("VALOR TOTAL:", formatCurrency(total), width) + "\n";
  receipt += `${doubleLineStr}\n`;
  
  if (notes) {
    receipt += `OBSERVACOES GERAIS:\n`;
    for (let i = 0; i < notes.length; i += width - 2) {
      receipt += `  ${notes.substring(i, i + width - 2)}\n`;
    }
    receipt += `${lineStr}\n`;
  }
  
  receipt += `Muito obrigado p/ preferencia! ❤️\n`;
  receipt += `===============================\n`;
  
  return receipt;
}

export function generateWhatsAppLink(
  restaurantPhone: string,
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  paymentMethod: string,
  items: CartItem[],
  deliveryFee: number,
  notes?: string
): string {
  const cleanPhone = restaurantPhone.replace(/\D/g, '');
  
  let subtotal = 0;
  const mappedItems = items.map((item) => {
    const addOnsPrice = item.addOns?.reduce((sum, a) => sum + a.price * (a.quantity || 1), 0) || 0;
    const itemUnitPrice = item.product.price + addOnsPrice;
    subtotal += itemUnitPrice * item.quantity;
    
    return {
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price, // base price
      addOns: item.addOns,
      notes: item.notes
    };
  });
  
  const total = subtotal + deliveryFee;
  const monochromaticCoupon = formatAsMonospaceReceipt(
    customerName,
    customerPhone,
    customerAddress,
    mappedItems,
    subtotal,
    deliveryFee,
    total,
    notes
  );

  // Use WhatsApp's triple backticks to instruct native Courier/monospace formatting block injection
  let message = `🚀 *NOVO PEDIDO CONFIRMADO DIRETORIO* 🚀\n\n`;
  message += `\`\`\`\n${monochromaticCoupon}\`\`\`\n\n`;
  message += `_Por favor, confirme se recebeu o pedido para iniciarmos o preparo!_ 🙏🔥`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// LocalStorage helpers with fallback safety
export function getLocalStorageData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading key ${key} from LocalStorage:`, error);
    return defaultValue;
  }
}

export function setLocalStorageData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key ${key} to LocalStorage:`, error);
  }
}
