#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { SerialPort } = require('serialport');
const escpos = require('escpos');
require('escpos-usb')(escpos);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store printer connection
let printer = null;

// Initialize ESC/POS Printer
async function initializePrinter() {
    try {
        // Try to connect to Epson TM-T20III via USB
        const device = new escpos.USB();
        printer = new escpos.Printer(device);

        console.log('✅ Printer connected successfully');
        return true;
    } catch (error) {
        console.log('⚠️ Printer not connected:', error.message);
        console.log('💡 Will simulate printing to console');
        return false;
    }
}

// Utility function to print or simulate
function printOrSimulate(content, callback) {
    if (printer) {
        try {
            printer.open(() => {
                printer
                    .font('a')
                    .align('ct')
                    .style('bu')
                    .size(2, 2)
                    .text('COTTAGE TANDOORI')
                    .feed(1)
                    .style('normal')
                    .size(1, 1)
                    .text('123 High Street, London')
                    .text('Tel: 020 1234 5678')
                    .feed(2)
                    .align('lt')
                    .text(content)
                    .feed(3)
                    .cut()
                    .close(callback);
            });
        } catch (error) {
            console.log('🖨️ SIMULATED PRINT (Printer Error):');
            console.log(content);
            callback();
        }
    } else {
        console.log('🖨️ SIMULATED PRINT:');
        console.log('================================');
        console.log('      COTTAGE TANDOORI');
        console.log('   123 High Street, London');
        console.log('     Tel: 020 1234 5678');
        console.log('================================');
        console.log(content);
        console.log('================================');
        callback();
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        message: 'Cottage Tandoori Printer Helper is operational',
        timestamp: new Date().toISOString(),
        printer_connected: printer !== null
    });
});

// Test print endpoint
app.post('/api/test-print', (req, res) => {
    const testContent = `
TEST RECEIPT
-----------
Date: ${new Date().toLocaleString()}
Test Item 1..................£8.50
Test Item 2..................£12.00
                        -----------
Subtotal....................£20.50
VAT (20%)...................£4.10
                        -----------
TOTAL......................£24.60

Thank you for visiting!
    `;

    printOrSimulate(testContent, () => {
        res.json({
            success: true,
            message: 'Test receipt printed successfully',
            timestamp: new Date().toISOString()
        });
    });
});

// Kitchen receipt endpoint
app.post('/api/print-kitchen', (req, res) => {
    const { order, orderNumber, timestamp } = req.body;

    if (!order || !orderNumber) {
        return res.status(400).json({
            success: false,
            message: 'Order data and order number are required'
        });
    }

    let kitchenContent = `
KITCHEN ORDER #${orderNumber}
${timestamp || new Date().toLocaleString()}
============================

`;

    // Group items by section for kitchen efficiency
    const sections = {
        'Starters': [],
        'Mains': [],
        'Rice & Bread': [],
        'Drinks': [],
        'Others': []
    };

    order.items.forEach(item => {
        const section = item.category || 'Others';
        const targetSection = sections[section] || sections['Others'];

        targetSection.push(`${item.quantity}x ${item.name}`);

        if (item.spiceLevel) {
            targetSection.push(`   🌶️ ${item.spiceLevel}`);
        }

        if (item.specialInstructions) {
            targetSection.push(`   📝 ${item.specialInstructions}`);
        }

        if (item.allergens && item.allergens.length > 0) {
            targetSection.push(`   ⚠️ ALLERGENS: ${item.allergens.join(', ')}`);
        }
    });

    // Print each section
    Object.entries(sections).forEach(([sectionName, items]) => {
        if (items.length > 0) {
            kitchenContent += `[${sectionName.toUpperCase()}]\n`;
            items.forEach(item => {
                kitchenContent += `${item}\n`;
            });
            kitchenContent += `\n`;
        }
    });

    if (order.specialInstructions) {
        kitchenContent += `
🍽️ SPECIAL INSTRUCTIONS:
${order.specialInstructions}

`;
    }

    kitchenContent += `
Table: ${order.tableNumber || 'N/A'}
Order Type: ${order.orderType || 'DINE-IN'}
============================
    `;

    printOrSimulate(kitchenContent, () => {
        res.json({
            success: true,
            message: 'Kitchen receipt printed successfully',
            orderNumber: orderNumber,
            timestamp: new Date().toISOString()
        });
    });
});

// Customer receipt endpoint
app.post('/api/print-customer', (req, res) => {
    const { order, payment, orderNumber, timestamp } = req.body;

    if (!order || !payment || !orderNumber) {
        return res.status(400).json({
            success: false,
            message: 'Order data, payment details, and order number are required'
        });
    }

    let customerContent = `
CUSTOMER RECEIPT
Order #${orderNumber}
${timestamp || new Date().toLocaleString()}
============================

`;

    // List all items with prices
    order.items.forEach(item => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        customerContent += `${item.quantity}x ${item.name.padEnd(20)}£${itemTotal}\n`;

        if (item.modifiers && item.modifiers.length > 0) {
            item.modifiers.forEach(modifier => {
                customerContent += `   + ${modifier.name.padEnd(16)}£${modifier.price.toFixed(2)}\n`;
            });
        }
    });

    customerContent += `
----------------------------
Subtotal................£${order.subtotal.toFixed(2)}`;

    if (order.discountAmount > 0) {
        customerContent += `\nDiscount................-£${order.discountAmount.toFixed(2)}`;
    }

    if (order.deliveryFee > 0) {
        customerContent += `\nDelivery Fee............£${order.deliveryFee.toFixed(2)}`;
    }

    customerContent += `
VAT (20%)...............£${order.vatAmount.toFixed(2)}
----------------------------
TOTAL...................£${order.total.toFixed(2)}

PAYMENT DETAILS:
Method: ${payment.method}
Status: ${payment.status}`;

    if (payment.cardLast4) {
        customerContent += `\nCard: ****${payment.cardLast4}`;
    }

    customerContent += `

Order Type: ${order.orderType}`;

    if (order.deliveryAddress) {
        customerContent += `\nDelivery Address:\n${order.deliveryAddress}`;
    }

    customerContent += `

Thank you for your order!
Visit us again soon.
============================
    `;

    printOrSimulate(customerContent, () => {
        res.json({
            success: true,
            message: 'Customer receipt printed successfully',
            orderNumber: orderNumber,
            timestamp: new Date().toISOString()
        });
    });
});

// Get printer status
app.get('/api/printer-status', (req, res) => {
    res.json({
        connected: printer !== null,
        status: printer ? 'ready' : 'disconnected',
        message: printer ? 'Printer ready for printing' : 'Printer not connected - simulating prints',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Cottage Tandoori Printer Helper running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🖨️ Initializing printer connection...`);

    // Initialize printer on startup
    initializePrinter().then(connected => {
        if (connected) {
            console.log(`✅ Ready for printing to Epson TM-T20III`);
        } else {
            console.log(`📱 Running in simulation mode`);
        }
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Cottage Tandoori Printer Helper...');
    if (printer) {
        printer.close(() => {
            console.log('✅ Printer connection closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});
