#!/usr/bin/env node

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 Cottage Tandoori Printer Helper v1.0.2');
console.log('💡 Simplified version for reliable PKG compilation');

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        message: 'Cottage Tandoori Printer Helper is operational',
        timestamp: new Date().toISOString(),
        version: '1.0.2',
        printer_connected: false // Will implement actual printer detection later
    });
});

// Test print endpoint (simulation mode for now)
app.post('/api/test-print', (req, res) => {
    const testContent = `
COTTAGE TANDOORI - TEST RECEIPT
===============================
Date: ${new Date().toLocaleString()}
Test Item 1..................£8.50
Test Item 2..................£12.00
                        -----------
Subtotal....................£20.50
VAT (20%)...................£4.10
                        -----------
TOTAL......................£24.60

Thank you for visiting!
===============================
    `;

    console.log('🖨️ SIMULATED PRINT:');
    console.log(testContent);

    res.json({
        success: true,
        message: 'Test receipt printed successfully (simulated)',
        timestamp: new Date().toISOString()
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
COTTAGE TANDOORI - KITCHEN ORDER
================================
Order #${orderNumber}
${timestamp || new Date().toLocaleString()}
================================

`;

    // Simple item listing for kitchen
    order.items.forEach(item => {
        kitchenContent += `${item.quantity}x ${item.name}\n`;

        if (item.spiceLevel) {
            kitchenContent += `   🌶️ ${item.spiceLevel}\n`;
        }

        if (item.specialInstructions) {
            kitchenContent += `   📝 ${item.specialInstructions}\n`;
        }
    });

    kitchenContent += `
================================
Table: ${order.tableNumber || 'N/A'}
Order Type: ${order.orderType || 'DINE-IN'}
================================
    `;

    console.log('🖨️ KITCHEN PRINT (SIMULATED):');
    console.log(kitchenContent);

    res.json({
        success: true,
        message: 'Kitchen receipt printed successfully (simulated)',
        orderNumber: orderNumber,
        timestamp: new Date().toISOString()
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
COTTAGE TANDOORI - CUSTOMER RECEIPT
===================================
Order #${orderNumber}
${timestamp || new Date().toLocaleString()}
===================================

`;

    // List all items with prices
    order.items.forEach(item => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        customerContent += `${item.quantity}x ${item.name}...........£${itemTotal}\n`;
    });

    customerContent += `
-----------------------------------
Subtotal................£${order.subtotal.toFixed(2)}
VAT (20%)...............£${order.vatAmount.toFixed(2)}
-----------------------------------
TOTAL...................£${order.total.toFixed(2)}

Payment: ${payment.method} - ${payment.status}
Order Type: ${order.orderType}

Thank you for your order!
===================================
    `;

    console.log('🖨️ CUSTOMER PRINT (SIMULATED):');
    console.log(customerContent);

    res.json({
        success: true,
        message: 'Customer receipt printed successfully (simulated)',
        orderNumber: orderNumber,
        timestamp: new Date().toISOString()
    });
});

// Get printer status
app.get('/api/printer-status', (req, res) => {
    res.json({
        connected: false,
        status: 'simulated',
        message: 'Running in simulation mode - actual printer integration will be added in next version',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Cottage Tandoori Printer Helper running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🖨️ Running in simulation mode for reliable PKG compilation`);
    console.log(`💡 Physical printer integration can be added once PKG build is stable`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Cottage Tandoori Printer Helper...');
    console.log('✅ Server stopped cleanly');
    process.exit(0);
});
