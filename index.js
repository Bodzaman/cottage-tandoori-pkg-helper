const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock printer functionality for now - will work with actual printers
class MockPrinter {
    constructor() {
        this.connected = true;
        this.printerName = "Epson TM-T20III (Mock)";
    }

    async print(content) {
        console.log("🖨️  PRINTING TO:", this.printerName);
        console.log("📄 CONTENT:");
        console.log(content);
        console.log("✅ Print job completed");
        return { success: true, message: "Print job sent successfully" };
    }

    getStatus() {
        return {
            connected: this.connected,
            printerName: this.printerName,
            status: "Ready"
        };
    }
}

const printer = new MockPrinter();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Running',
        service: 'Cottage Tandoori Printer Helper',
        version: '1.0.4',
        printer: printer.getStatus()
    });
});

// Kitchen receipt printing
app.post('/print/kitchen', async (req, res) => {
    try {
        const { orderData } = req.body;

        // Format kitchen receipt
        const kitchenReceipt = `
╔══════════════════════════════════════╗
║           COTTAGE TANDOORI           ║
║            KITCHEN ORDER             ║
╚══════════════════════════════════════╝

Order #: ${orderData?.orderNumber || 'TEST-001'}
Time: ${new Date().toLocaleString()}
Type: ${orderData?.orderType || 'DINE-IN'}

──────────────────────────────────────────
ITEMS:
──────────────────────────────────────────
${orderData?.items?.map(item => 
    `${item.quantity}x ${item.name}\n` +
    `    ${item.spiceLevel ? 'Spice: ' + item.spiceLevel : ''}\n` +
    `    ${item.notes ? 'Notes: ' + item.notes : ''}`
).join('\n') || '1x Chicken Tikka Masala\n    Spice: Medium\n    Notes: Extra sauce'}

──────────────────────────────────────────
Special Instructions:
${orderData?.specialInstructions || 'None'}

══════════════════════════════════════════
        `;

        const result = await printer.print(kitchenReceipt);
        res.json({ success: true, message: 'Kitchen receipt printed', ...result });

    } catch (error) {
        console.error('Kitchen print error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Customer receipt printing  
app.post('/print/customer', async (req, res) => {
    try {
        const { orderData, paymentData } = req.body;

        // Format customer receipt
        const customerReceipt = `
╔══════════════════════════════════════╗
║           COTTAGE TANDOORI           ║
║         123 Restaurant Street        ║
║        London, UK SW1A 1AA           ║
║          Tel: 020 1234 5678          ║
╚══════════════════════════════════════╝

Receipt #: ${orderData?.orderNumber || 'TEST-001'}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Cashier: ${orderData?.cashier || 'Staff'}

──────────────────────────────────────────
${orderData?.items?.map(item => 
    `${item.quantity}x ${item.name.padEnd(20)} £${(item.price * item.quantity).toFixed(2)}`
).join('\n') || '1x Chicken Tikka Masala    £12.95\n1x Pilau Rice             £3.50'}

──────────────────────────────────────────
Subtotal:                        £${paymentData?.subtotal || '16.45'}
Service Charge (10%):            £${paymentData?.serviceCharge || '1.65'}
──────────────────────────────────────────
TOTAL:                          £${paymentData?.total || '18.10'}

Payment Method: ${paymentData?.method || 'Card'}
${paymentData?.method === 'Card' ? 'Card Payment Approved' : ''}

══════════════════════════════════════════
     Thank you for your visit!
    Please come again soon!
══════════════════════════════════════════
        `;

        const result = await printer.print(customerReceipt);
        res.json({ success: true, message: 'Customer receipt printed', ...result });

    } catch (error) {
        console.error('Customer print error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test print
app.post('/print/test', async (req, res) => {
    try {
        const testReceipt = `
╔══════════════════════════════════════╗
║           COTTAGE TANDOORI           ║
║            PRINTER TEST              ║
╚══════════════════════════════════════╝

Test Date: ${new Date().toLocaleString()}
Printer Helper Version: 1.0.4

This is a test print to verify your
printer is working correctly.

✅ If you can read this, your printer
   is connected and functioning!

══════════════════════════════════════════
        `;

        const result = await printer.print(testReceipt);
        res.json({ success: true, message: 'Test receipt printed', ...result });

    } catch (error) {
        console.error('Test print error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Printer status
app.get('/status', (req, res) => {
    res.json({
        service: 'Cottage Tandoori Printer Helper',
        version: '1.0.4',
        status: 'Running',
        printer: printer.getStatus(),
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🖨️  Cottage Tandoori Printer Helper v1.0.4`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 Endpoints:`);
    console.log(`   GET  /health         - Service health check`);
    console.log(`   GET  /status         - Printer status`);
    console.log(`   POST /print/kitchen  - Print kitchen receipt`);
    console.log(`   POST /print/customer - Print customer receipt`);
    console.log(`   POST /print/test     - Print test receipt`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Cottage Tandoori Printer Helper...');
    process.exit(0);
});
