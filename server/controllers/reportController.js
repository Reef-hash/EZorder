import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import * as expenseModel from '../models/expenseModel.js';
import User from '../models/userModel.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function styleHeaderRow(sheet, argbBg = 'FF1E293B', argbFont = 'FFFBBF24') {
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: argbFont } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbBg } };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFFBBF24' } } };
    cell.alignment = { vertical: 'middle' };
  });
  sheet.getRow(1).height = 20;
}

function addTotalRow(sheet, data, bg = 'FF1F2937') {
  const row = sheet.addRow(data);
  row.font = { bold: true };
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.border = { top: { style: 'medium', color: { argb: 'FF4B5563' } } };
  });
  return row;
}

function addCompanyHeader(sheet, user, title, period, numCols = 2) {
  const mergeEnd = String.fromCharCode(64 + numCols);
  sheet.mergeCells(`A1:${mergeEnd}1`);
  const nameRow = sheet.getRow(1);
  nameRow.getCell(1).value = (user && user.businessName) ? user.businessName : 'Perniagaan Saya';
  nameRow.getCell(1).font = { size: 14, bold: true };
  nameRow.getCell(1).alignment = { horizontal: 'center' };
  nameRow.height = 22;

  sheet.mergeCells(`A2:${mergeEnd}2`);
  sheet.getRow(2).getCell(1).value = (user && user.address) ? user.address : '';
  sheet.getRow(2).getCell(1).alignment = { horizontal: 'center' };

  sheet.mergeCells(`A3:${mergeEnd}3`);
  const tinStr = (user && user.tinNumber) ? `TIN: ${user.tinNumber}` : '';
  const sstStr = (user && user.sstRegNo) ? `No. SST: ${user.sstRegNo}` : '';
  sheet.getRow(3).getCell(1).value = [tinStr, sstStr].filter(Boolean).join('   |   ') || ' ';
  sheet.getRow(3).getCell(1).font = { size: 9, color: { argb: 'FF6B7280' } };
  sheet.getRow(3).getCell(1).alignment = { horizontal: 'center' };

  sheet.mergeCells(`A4:${mergeEnd}4`);
  const titleCell = sheet.getRow(4).getCell(1);
  titleCell.value = title;
  titleCell.font = { size: 12, bold: true, color: { argb: 'FFFBBF24' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center' };
  sheet.getRow(4).height = 20;

  sheet.mergeCells(`A5:${mergeEnd}5`);
  sheet.getRow(5).getCell(1).value = `Tempoh: ${period}`;
  sheet.getRow(5).getCell(1).font = { size: 9, italic: true, color: { argb: 'FF9CA3AF' } };
  sheet.getRow(5).getCell(1).alignment = { horizontal: 'center' };
  sheet.addRow([]);
  return 7;
}

// ─── GET /api/reports/profit-loss ─────────────────────────────────────────────
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
          totalTax: { $sum: { $ifNull: ['$totalTax', 0] } },
          cogs: {
            $sum: {
              $reduce: {
                input: '$items', initialValue: 0,
                in: { $add: ['$$value', { $multiply: [{ $ifNull: ['$$this.costPrice', 0] }, '$$this.quantity'] }] },
              },
            },
          },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const revenue = orderAgg?.revenue ?? 0;
    const cogs = orderAgg?.cogs ?? 0;
    const totalTax = orderAgg?.totalTax ?? 0;
    const orderCount = orderAgg?.orderCount ?? 0;
    const opex = await expenseModel.sumExpenses(req.user._id, { from, to });
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const revenueBeforeTax = revenue - totalTax;

    res.json({ revenue, revenueBeforeTax, totalTax, cogs, opex, grossProfit, netProfit, orderCount });
  } catch (error) {
    console.error('getProfitLoss error:', error);
    res.status(500).json({ message: 'Failed to calculate P&L.' });
  }
}

// ─── GET /api/reports/by-item ─────────────────────────────────────────────────
export async function salesByItem(req, res) {
  try {
    const { from, to } = req.query;
    const Order = mongoose.model('Order');
    const match = buildDateMatch(req.user._id, from, to);

    const results = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          cogs: { $sum: { $multiply: [{ $ifNull: ['$items.costPrice', 0] }, '$items.quantity'] } },
          tax: { $sum: { $ifNull: ['$items.taxAmount', 0] } },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json(results.map(r => ({
      name: r._id,
      qty: r.qty,
      revenue: parseFloat(r.revenue.toFixed(2)),
      cogs: parseFloat(r.cogs.toFixed(2)),
      tax: parseFloat(r.tax.toFixed(2)),
      grossProfit: parseFloat((r.revenue - r.cogs).toFixed(2)),
    })));
  } catch (error) {
    console.error('salesByItem error:', error);
    res.status(500).json({ message: 'Failed.' });
  }
}

// ─── GET /api/reports/by-category ────────────────────────────────────────────
export async function salesByCategory(req, res) {
  try {
    const { from, to } = req.query;
    const Order = mongoose.model('Order');
    const Product = mongoose.model('Product');
    const match = buildDateMatch(req.user._id, from, to);

    const products = await Product.find({ userId: req.user._id }, { name: 1, category: 1 }).lean();
    const catMap = Object.fromEntries(products.map(p => [p.name.toLowerCase(), p.category]));

    const results = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          cogs: { $sum: { $multiply: [{ $ifNull: ['$items.costPrice', 0] }, '$items.quantity'] } },
        },
      },
    ]);

    const catTotals = {};
    for (const r of results) {
      const cat = catMap[r._id.toLowerCase()] || 'Others';
      if (!catTotals[cat]) catTotals[cat] = { revenue: 0, cogs: 0, qty: 0 };
      catTotals[cat].revenue += r.revenue;
      catTotals[cat].cogs += r.cogs;
      catTotals[cat].qty += r.qty;
    }

    const out = Object.entries(catTotals)
      .map(([cat, v]) => ({
        category: cat,
        qty: v.qty,
        revenue: parseFloat(v.revenue.toFixed(2)),
        cogs: parseFloat(v.cogs.toFixed(2)),
        grossProfit: parseFloat((v.revenue - v.cogs).toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    res.json(out);
  } catch (error) {
    console.error('salesByCategory error:', error);
    res.status(500).json({ message: 'Failed.' });
  }
}

// ─── GET /api/reports/by-payment ─────────────────────────────────────────────
export async function salesByPayment(req, res) {
  try {
    const { from, to } = req.query;
    const Order = mongoose.model('Order');
    const match = buildDateMatch(req.user._id, from, to);

    const results = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$total' },
          tax: { $sum: { $ifNull: ['$totalTax', 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json(results.map(r => ({
      method: r._id || 'unknown',
      count: r.count,
      total: parseFloat(r.total.toFixed(2)),
      tax: parseFloat(r.tax.toFixed(2)),
    })));
  } catch (error) {
    console.error('salesByPayment error:', error);
    res.status(500).json({ message: 'Failed.' });
  }
}

// ─── GET /api/reports/sst ────────────────────────────────────────────────────
export async function sstSummary(req, res) {
  try {
    const { from, to } = req.query;
    const Order = mongoose.model('Order');
    const match = buildDateMatch(req.user._id, from, to);

    const [agg] = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          grossSales: { $sum: '$total' },
          totalTax: { $sum: { $ifNull: ['$totalTax', 0] } },
          orderCount: { $sum: 1 },
          taxableItems: {
            $sum: {
              $reduce: {
                input: '$items', initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $gt: [{ $ifNull: ['$$this.taxRate', 0] }, 0] }, { $multiply: ['$$this.price', '$$this.quantity'] }, 0] },
                  ],
                },
              },
            },
          },
          exemptItems: {
            $sum: {
              $reduce: {
                input: '$items', initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $eq: [{ $ifNull: ['$$this.taxRate', 0] }, 0] }, { $multiply: ['$$this.price', '$$this.quantity'] }, 0] },
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    if (!agg) return res.json({ grossSales: 0, taxableAmount: 0, exemptAmount: 0, totalTax: 0, netSales: 0, orderCount: 0 });

    const netSales = agg.grossSales - agg.totalTax;
    res.json({
      grossSales: parseFloat(agg.grossSales.toFixed(2)),
      taxableAmount: parseFloat(agg.taxableItems.toFixed(2)),
      exemptAmount: parseFloat(agg.exemptItems.toFixed(2)),
      totalTax: parseFloat(agg.totalTax.toFixed(2)),
      netSales: parseFloat(netSales.toFixed(2)),
      orderCount: agg.orderCount,
      period: { from, to },
    });
  } catch (error) {
    console.error('sstSummary error:', error);
    res.status(500).json({ message: 'Failed.' });
  }
}

// ─── GET /api/reports/export ─────────────────────────────────────────────────
export async function exportExcel(req, res) {
  try {
    const { from, to } = req.query;
    const Order = mongoose.model('Order');
    const match = buildDateMatch(req.user._id, from, to);
    const user = await User.findById(req.user._id).lean();

    const [orders, expenses] = await Promise.all([
      Order.find(match).sort({ createdAt: 1 }).lean(),
      expenseModel.getExpenses(req.user._id, { from, to }),
    ]);

    let revenue = 0, cogs = 0, totalTax = 0;
    for (const o of orders) {
      revenue += o.total;
      totalTax += o.totalTax ?? 0;
      for (const item of o.items) cogs += (item.costPrice ?? 0) * item.quantity;
    }
    const opex = expenses.reduce((s, e) => s + e.amount, 0);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const revenueBeforeTax = revenue - totalTax;

    const fromLabel = from ? new Date(from).toLocaleDateString('ms-MY') : 'Semua';
    const toLabel = to ? new Date(to).toLocaleDateString('ms-MY') : 'Semua';
    const period = (from || to) ? `${fromLabel} hingga ${toLabel}` : 'Semua Rekod';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EZOrder';
    workbook.created = new Date();

    // ── Sheet 1: Penyata Untung Rugi ─────────────────────────────────────────
    const plSheet = workbook.addWorksheet('Penyata Untung Rugi');
    plSheet.columns = [{ key: 'label', width: 42 }, { key: 'value', width: 22 }];
    addCompanyHeader(plSheet, user, 'PENYATA UNTUNG RUGI / INCOME STATEMENT', period, 2);

    const plRows = [
      ['HASIL / REVENUE', null],
      ['Jualan Kasar (Gross Sales)', revenue],
      ['(-) Cukai Perkhidmatan SST', -totalTax],
      ['= Jualan Bersih (Net Sales)', revenueBeforeTax],
      [null, null],
      ['KOS JUALAN / COST OF SALES', null],
      ['(-) Kos Barangan Dijual (COGS)', -cogs],
      ['= UNTUNG KASAR (GROSS PROFIT)', grossProfit],
      [null, null],
      ['PERBELANJAAN OPERASI / OPERATING EXPENSES', null],
      ['(-) Jumlah OPEX', -opex],
      [null, null],
      ['UNTUNG / (RUGI) BERSIH', netProfit],
    ];

    let ri = 7;
    for (const [label, value] of plRows) {
      const row = plSheet.getRow(ri++);
      row.getCell('label').value = label || '';
      if (value !== null && value !== undefined) {
        row.getCell('value').value = parseFloat(value.toFixed(2));
        row.getCell('value').numFmt = '"RM"#,##0.00;[Red](-"RM"#,##0.00)';
      }
      if (label && value === null) {
        row.getCell('label').font = { bold: true, color: { argb: 'FFFBBF24' } };
        row.getCell('label').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      }
      if (label === 'UNTUNG / (RUGI) BERSIH') {
        row.eachCell(c => {
          c.font = { bold: true, color: { argb: netProfit >= 0 ? 'FF34D399' : 'FFFC8181' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: netProfit >= 0 ? 'FF064E3B' : 'FF7F1D1D' } };
          c.border = { top: { style: 'double', color: { argb: 'FF4B5563' } } };
        });
      }
    }

    // ── Sheet 2: Ringkasan Jualan (by date) ──────────────────────────────────
    const sumSheet = workbook.addWorksheet('Ringkasan Jualan');
    sumSheet.columns = [
      { header: 'Tarikh', key: 'date', width: 14 },
      { header: 'Jualan Kasar (RM)', key: 'gross', width: 18 },
      { header: 'Diskaun (RM)', key: 'discount', width: 14 },
      { header: 'Cukai SST (RM)', key: 'tax', width: 14 },
      { header: 'Jualan Bersih (RM)', key: 'net', width: 18 },
      { header: 'COGS (RM)', key: 'cogs', width: 14 },
      { header: 'Untung Kasar (RM)', key: 'profit', width: 18 },
    ];
    styleHeaderRow(sumSheet);

    const byDate = {};
    for (const o of orders) {
      const d = new Date(o.createdAt).toLocaleDateString('ms-MY');
      if (!byDate[d]) byDate[d] = { gross: 0, discount: 0, tax: 0, cogs: 0 };
      byDate[d].gross += o.total;
      byDate[d].tax += o.totalTax ?? 0;
      const rawTotal = o.items ? o.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0;
      const discAmt = o.discountType === 'percent' ? rawTotal * (o.discount / 100) : (o.discount ?? 0);
      byDate[d].discount += discAmt;
      for (const item of (o.items || [])) byDate[d].cogs += (item.costPrice ?? 0) * item.quantity;
    }
    for (const [date, v] of Object.entries(byDate)) {
      const net = v.gross - v.tax;
      sumSheet.addRow({ date, gross: +v.gross.toFixed(2), discount: +v.discount.toFixed(2), tax: +v.tax.toFixed(2), net: +net.toFixed(2), cogs: +v.cogs.toFixed(2), profit: +(net - v.cogs).toFixed(2) });
    }
    addTotalRow(sumSheet, { date: 'JUMLAH', gross: +revenue.toFixed(2), tax: +totalTax.toFixed(2), net: +revenueBeforeTax.toFixed(2), cogs: +cogs.toFixed(2), profit: +(revenueBeforeTax - cogs).toFixed(2) });
    ['gross', 'discount', 'tax', 'net', 'cogs', 'profit'].forEach(k => { sumSheet.getColumn(k).numFmt = '#,##0.00'; });

    // ── Sheet 3: Jualan Terperinci ────────────────────────────────────────────
    const detailSheet = workbook.addWorksheet('Jualan Terperinci');
    detailSheet.columns = [
      { header: 'Tarikh & Masa', key: 'date', width: 20 },
      { header: 'No. Bil', key: 'bill', width: 12 },
      { header: 'Item', key: 'items', width: 38 },
      { header: 'Bayaran', key: 'payment', width: 11 },
      { header: 'Diskaun', key: 'discount', width: 11 },
      { header: 'SST (RM)', key: 'tax', width: 11 },
      { header: 'Jualan (RM)', key: 'total', width: 13 },
    ];
    styleHeaderRow(detailSheet);
    for (const o of orders) {
      detailSheet.addRow({
        date: new Date(o.createdAt).toLocaleString('ms-MY'),
        bill: o.customerName,
        items: (o.items || []).map(i => `${i.name} x${i.quantity}`).join(', '),
        payment: o.paymentMethod === 'cash' ? 'Tunai' : o.paymentMethod === 'qr' ? 'QR/Online' : '-',
        discount: (o.discount ?? 0) > 0 ? (o.discountType === 'percent' ? `${o.discount}%` : `RM${o.discount}`) : '',
        tax: +(o.totalTax ?? 0).toFixed(2),
        total: +o.total.toFixed(2),
      });
    }
    addTotalRow(detailSheet, { date: 'JUMLAH', tax: +totalTax.toFixed(2), total: +revenue.toFixed(2) });
    detailSheet.getColumn('tax').numFmt = '#,##0.00';
    detailSheet.getColumn('total').numFmt = '#,##0.00';

    // ── Sheet 4: Laporan SST ──────────────────────────────────────────────────
    const sstSheet = workbook.addWorksheet('Laporan SST');
    sstSheet.columns = [{ key: 'label', width: 44 }, { key: 'value', width: 22 }];
    addCompanyHeader(sstSheet, user, 'LAPORAN CUKAI PERKHIDMATAN (SST-02)', period, 2);

    let taxableAmt = 0, exemptAmt = 0;
    for (const o of orders) {
      for (const item of (o.items || [])) {
        const lineAmt = item.price * item.quantity;
        if ((item.taxRate ?? 0) > 0) taxableAmt += lineAmt;
        else exemptAmt += lineAmt;
      }
    }

    const sstRows = [
      ['MAKLUMAT PERNIAGAAN / BUSINESS INFO', null],
      ['Nama Perniagaan', user ? user.businessName : ''],
      ['No. TIN (LHDN)', user && user.tinNumber ? user.tinNumber : '— tidak diisi —'],
      ['No. Pendaftaran SST', user && user.sstRegNo ? user.sstRegNo : '— tidak didaftarkan —'],
      ['Alamat', user && user.address ? user.address : ''],
      [null, null],
      ['RINGKASAN JUALAN / SALES SUMMARY', null],
      ['Jumlah Bil / Transaksi', orders.length],
      ['Jualan Kasar (Gross Sales)', revenue],
      ['= Jualan Bersih sebelum Cukai', revenueBeforeTax],
      [null, null],
      ['BUTIRAN CUKAI / TAX DETAILS (SST-02)', null],
      ['Jualan Bercukai (Taxable Sales)', taxableAmt],
      ['Jualan Dikecualikan Cukai (Exempt)', exemptAmt],
      ['Kadar Cukai Perkhidmatan', '6%'],
      ['Jumlah Cukai SST Dikutip', totalTax],
      [null, null],
      ['Tarikh Laporan Dijana', new Date().toLocaleString('ms-MY')],
      ['NOTA: Gunakan maklumat ini untuk mengisi Borang SST-02 di MySST Portal', null],
    ];

    let sstRi = 7;
    for (const [label, value] of sstRows) {
      const row = sstSheet.getRow(sstRi++);
      row.getCell('label').value = label || '';
      if (value !== null && value !== undefined && typeof value === 'number') {
        row.getCell('value').value = parseFloat(value.toFixed(2));
        row.getCell('value').numFmt = '"RM"#,##0.00';
      } else if (value !== null && value !== undefined) {
        row.getCell('value').value = value;
      }
      if (label && value === null) {
        row.getCell('label').font = { bold: true, color: { argb: 'FFFBBF24' } };
        row.getCell('label').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      }
      if (label === 'Jumlah Cukai SST Dikutip') {
        row.eachCell(c => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }; });
      }
    }

    // ── Sheet 5: Perbelanjaan Operasi ─────────────────────────────────────────
    const expSheet = workbook.addWorksheet('Perbelanjaan Operasi');
    expSheet.columns = [
      { header: 'Tarikh', key: 'date', width: 14 },
      { header: 'Kategori', key: 'category', width: 16 },
      { header: 'Penerangan', key: 'description', width: 36 },
      { header: 'Kaedah Bayaran', key: 'payment', width: 16 },
      { header: 'Jumlah (RM)', key: 'amount', width: 14 },
    ];
    styleHeaderRow(expSheet);
    for (const e of expenses) {
      expSheet.addRow({ date: new Date(e.date).toLocaleDateString('ms-MY'), category: e.category, description: e.description, payment: e.paymentMethod === 'cash' ? 'Tunai' : 'Pindahan Bank', amount: +e.amount.toFixed(2) });
    }
    addTotalRow(expSheet, { date: 'JUMLAH', amount: +opex.toFixed(2) });
    expSheet.getColumn('amount').numFmt = '#,##0.00';

    // ── Send file ─────────────────────────────────────────────────────────────
    const dateTag = from ? `${from}_${to || from}` : 'semua';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="EZOrder_Laporan_${dateTag}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('exportExcel error:', error);
    res.status(500).json({ message: 'Failed to generate Excel report.' });
  }
}
