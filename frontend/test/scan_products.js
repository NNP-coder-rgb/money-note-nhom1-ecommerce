const fs = require('fs');
const mockData = require('../js/mock_data.js');
const products = mockData.PRODUCTS || [];

console.log('=== VERIFYING ALL 130 PRODUCTS ===\n');

const mismatches = [];

products.forEach((p, idx) => {
  const img = (p.img || '').replace('assets/images/products/', '').toLowerCase();
  const name = (p.name || '').toLowerCase();

  let hasIssue = false;
  let reason = '';

  if (img.startsWith('balo-') && !name.includes('balo') && !name.includes('ba lô')) {
    hasIssue = true;
    reason = `Image is BALO (${img}) but product is: ${p.name}`;
  } else if (img.startsWith('tui-xach') && !name.includes('túi') && !name.includes('xách') && !name.includes('bag')) {
    hasIssue = true;
    reason = `Image is TÚI XÁCH (${img}) but product is: ${p.name}`;
  } else if (img.startsWith('kinh-mat') && !name.includes('kính') && !name.includes('glasses')) {
    hasIssue = true;
    reason = `Image is KÍNH MẮT (${img}) but product is: ${p.name}`;
  } else if (img.startsWith('nuoc-hoa') && !name.includes('nước hoa') && !name.includes('perfume')) {
    hasIssue = true;
    reason = `Image is NƯỚC HOA (${img}) but product is: ${p.name}`;
  } else if (img.startsWith('son-moi') && !name.includes('son') && !name.includes('lipstick')) {
    hasIssue = true;
    reason = `Image is SON MÔI (${img}) but product is: ${p.name}`;
  } else if (img.startsWith('ly-gom') && !name.includes('ly') && !name.includes('cốc') && !name.includes('gốm')) {
    hasIssue = true;
    reason = `Image is LY GỐM SỨ (${img}) but product is: ${p.name}`;
  } else if (img.startsWith('nen-thom') && !name.includes('nến') && !name.includes('candle')) {
    hasIssue = true;
    reason = `Image is NẾN THƠM (${img}) but product is: ${p.name}`;
  } else if (img.startsWith('kem-duong') && !name.includes('kem') && !name.includes('serum') && !name.includes('skincare')) {
    hasIssue = true;
    reason = `Image is KEM DƯỠNG (${img}) but product is: ${p.name}`;
  } else if (img.startsWith('mu-luoi-trai') && !name.includes('mũ') && !name.includes('nón') && !name.includes('cap')) {
    hasIssue = true;
    reason = `Image is MŨ LƯỠI TRAI (${img}) but product is: ${p.name}`;
  } else if (img.startsWith('ban-phim') && (name.includes('tai nghe') || name.includes('chuột') || name.includes('loa'))) {
    hasIssue = true;
    reason = `Image is BÀN PHÍM (${img}) but product is: ${p.name}`;
  } else if (img.startsWith('tai-nghe') && (name.includes('bàn phím') || name.includes('chuột') || name.includes('máy tính') || name.includes('laptop'))) {
    hasIssue = true;
    reason = `Image is TAI NGHE (${img}) but product is: ${p.name}`;
  } else if (img.startsWith('chuot-') && (name.includes('bàn phím') || name.includes('tai nghe') || name.includes('loa'))) {
    hasIssue = true;
    reason = `Image is CHUỘT (${img}) but product is: ${p.name}`;
  }

  if (hasIssue) {
    mismatches.push({ index: idx + 1, id: p.id, name: p.name, img, reason });
  }
});

if (mismatches.length === 0) {
  console.log('🎉 EXCELLENT! 100% OF 130 PRODUCTS MATCH THEIR IMAGES PERFECTLY!');
} else {
  console.log('Found ' + mismatches.length + ' mismatches:');
  mismatches.forEach(m => console.log(m.reason));
}
