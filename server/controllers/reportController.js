import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import * as expenseModel from '../models/expenseModel.js';

function buildDateMatch(userId, from, to) {
  const match = {
    userId: new mongoose.Types.ObjectId(userId),
    status: 'completed',
  };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }
  return match;
}

// GET /api/reports/profit-loss?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getProfitLoss(req, res) {
  try {
    const { from, to } = req.query;
    const Order = mongoose.model('Order');

    const match = buildDateMatch(req.user._id, from, to);

    const [orderAgg] = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
          cogs: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $multiply: [{ $ifNull: ['$$this.costPrice', 0] }, '$$this.quantity'] },
                  ],
                },
              },
            },
          },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const revenue = orderAgg?.revenue ?? 0;
    const cogs = orderAgg?.cogs ?? 0;
    const orderCount = orderAgg?.orderCount ?? 0;
    const opex = await expenseModel.sumExpenses(req.user._id, { from, to });
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;

    res.json({ revenue, cogs, opex, grossProfit, netProfit, orderCount });
  } catch (error) {
    console.error('getProfitLoss error:', error);
    res.status(500).json({ message: 'Failed to calculate P&L.' });
  }
}

// GET /api/reports/export?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function exportExcel(req, res) {
  try {
    const { from, to } = req.query;
    const Order = mongoose.model('Order');

    const match = buildDateMatch(req.user._id, from, to);

    // Fetch orders + expenses in parallel
    const [orders, expenses] = await Promise.all([
      Order.find(match).sort({ createdAt: 1 }).lean(),
      expenseModel.getExpenses(req.user._id, { from, to }),
    ]);

    // Calculate totals
    let revenue = 0, cogs = 0;
    for (const o of orders) {
      revenue += o.total;
      for (const item of o.items) {
        cogs += (item.costPrice ?? 0) * item.quantity;
      }
    }
    const opex = expenses.reduce((s, e) => s + e.amount, 0);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;

    // Build label for report title
    const fromLabel = from ? new Date(from).toLocaleDateString('en-MY') : 'Semua';
    const toLabel = to ? new Date(to).toLocaleDateString('en-MY') : 'Semua';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EZOrder';
    workbook.created = new Date();

    // ─── Sheet 1: Ringkasan P&L ───────────────────────────────────────────────
    const summary = workbook.addWorksheet('Ringkasan P&L');
    summary.columns = [
      { key: 'label', width: 30 },
      { key: 'value', width: 18 },
    ];

    const titleRow = summary.addRow([`LAPORAN UNTUNG RUGI — ${fromLabel} hingga ${toLabel}`]);
    titleRow.font = { size: 14, bold: true };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
    titleRow.getCell(1).font = { size: 14, bold: true, color: { argb: 'FFFBBF24' } };
    summary.mergeCells(`A1:B1`);
    summary.addRow([]);

    const addSummaryRow = (label, value, bold = false, bg = null, fontColor = null) => {
      const row = summary.addRow({ label, value: value != null ? Number(value.toFixed(2)) : '' });
      if (bold) row.font = { bold: true };
      if (bg) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        });
      }
      if (fontColor) row.getCell('value').font = { bold: true, color: { argb: fontColor } };
      row.getCell('value').numFmt = '"RM"#,##0.00';
      return row;
    };

    addSummaryRow('Jumlah Pesanan (Bil)', orders.length);
    summary.addRow([]);
    addSummaryRow('HASIL (Revenue)', revenue, true);
    addSummaryRow('(-) Kos Barangan Dijual (COGS)', cogs);
    addSummaryRow('= KEUNTUNGAN KASAR (Gross Profit)', grossProfit, true);
    summary.addRow([]);
    addSummaryRow('(-) Kos Operasi (OPEX)', opex);
    summary.addRow([]);

    const netRow = addSummaryRow(
      netProfit >= 0 ? 'UNTUNG BERSIH (Net Profit)' : 'RUGI BERSIH (Net Loss)',
      Math.abs(netProfit),
      true,
      netProfit >= 0 ? 'FF064E3B' : 'FF7F1D1D',
      netProfit >= 0 ? 'FF34D399' : 'FFFC8181'
    );
    netRow.getCell('label').font = { bold: true, color: { argb: netProfit >= 0 ? 'FF34D399' : 'FFFC8181' } };

    // Border for summary data rows
    summary.eachRow(row => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF374151' } },
          bottom: { style: 'thin', color: { argb: 'FF374151' } },
          left: { style: 'thin', color: { argb: 'FF374151' } },
          right: { style: 'thin', color: { argb: 'FF374151' } },
        };
      });
    });

    // ─── Sheet 2: Senarai Jualan ──────────────────────────────────────────────
    const salesSheet = workbook.addWorksheet('Senarai Jualan');
    salesSheet.columns = [
      { header: 'Tarikh', key: 'date', width: 20 },
      { header: 'Bil #', key: 'bill', width: 12 },
      { header: 'Item', key: 'items', width: 40 },
      { header: 'Bayaran', key: 'payment', width: 12 },
      { header: 'Diskaun', key: 'discount', width: 12 },
      { header: 'COGS (RM)', key: 'cogs', width: 14 },
      { header: 'Jualan (RM)', key: 'total', width: 14 },
    ];

    // Header style
    salesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFBBF24' } };
    salesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };

    for (const o of orders) {
      const orderCogs = o.items.reduce((s, i) => s + (i.costPrice ?? 0) * i.quantity, 0);
      const discountStr = (o.discount ?? 0) > 0
        ? (o.discountType === 'percent' ? `${o.discount}%` : `RM${o.discount}`)
        : '';
      salesSheet.addRow({
        date: new Date(o.createdAt).toLocaleString('en-MY'),
        bill: o.customerName,
        items: o.items.map(i => `${i.name} x${i.quantity}`).join(', '),
        payment: o.paymentMethod === 'cash' ? 'Tunai' : o.paymentMethod === 'qr' ? 'QR' : '',
        discount: discountStr,
        cogs: parseFloat(orderCogs.toFixed(2)),
        total: parseFloat(o.total.toFixed(2)),
      });
    }

    // Total row
    const totalSalesRow = salesSheet.addRow({
      date: 'JUMLAH',
      cogs: parseFloat(cogs.toFixed(2)),
      total: parseFloat(revenue.toFixed(2)),
    });
    totalSalesRow.font = { bold: true };
    totalSalesRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    salesSheet.getColumn('cogs').numFmt = '#,##0.00';
    salesSheet.getColumn('total').numFmt = '#,##0.00';

    // ─── Sheet 3: Senarai Perbelanjaan ────────────────────────────────────────
    const expSheet = workbook.addWorksheet('Perbelanjaan');
    expSheet.columns = [
      { header: 'Tarikh', key: 'date', width: 18 },
      { header: 'Kategori', key: 'category', width: 16 },
      { header: 'Penerangan', key: 'description', width: 36 },
      { header: 'Bayaran', key: 'payment', width: 14 },
      { header: 'Jumlah (RM)', key: 'amount', width: 14 },
    ];

    expSheet.getRow(1).font = { bold: true, color: { argb: 'FFFBBF24' } };
    expSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };

    for (const e of expenses) {
      expSheet.addRow({
        date: new Date(e.date).toLocaleDateString('en-MY'),
        category: e.category,
        description: e.description,
        payment: e.paymentMethod === 'cash' ? 'Tunai' : 'Bank Transfer',
        amount: parseFloat(e.amount.toFixed(2)),
      });
    }

    const totalExpRow = expSheet.addRow({ date: 'JUMLAH', amount: parseFloat(opex.toFixed(2)) });
    totalExpRow.font = { bold: true };
    totalExpRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    expSheet.getColumn('amount').numFmt = '#,##0.00';

    // ─── Send file ────────────────────────────────────────────────────────────
    const dateTag = `${from || 'all'}_to_${to || 'all'}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="laporan_${dateTag}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('exportExcel error:', error);
    res.status(500).json({ message: 'Failed to generate Excel report.' });
  }
}
