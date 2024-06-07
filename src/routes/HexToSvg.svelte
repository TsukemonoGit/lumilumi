<script>
  export let hexString = "";

  if (hexString.length !== 64) {
    throw new Error("64桁の16進数文字列を入力してください");
  }

  // 最初の図形（大きな円）
  const color1 = `#${hexString.slice(0, 6)}`;
  const cx1 = 32;
  const cy1 = 32;
  const r1 = (parseInt(hexString.slice(6, 8), 16) % 28) + 16; // 半径は16〜43に設定

  // 次の図形（内部の小さな円）
  const color2 = `#${hexString.slice(8, 14)}`;
  const cx2 = parseInt(hexString.slice(14, 18), 16) % 64;
  const cy2 = parseInt(hexString.slice(18, 22), 16) % 64;
  const r2 = (parseInt(hexString.slice(22, 24), 16) % 12) + 6; // 半径は6〜17に設定

  // 最後の図形（三角形）
  const color3 = `#${hexString.slice(24, 30)}`;
  const x3_1 = parseInt(hexString.slice(30, 34), 16) % 64;
  const y3_1 = parseInt(hexString.slice(34, 38), 16) % 64;
  const x3_2 = parseInt(hexString.slice(38, 42), 16) % 64;
  const y3_2 = parseInt(hexString.slice(42, 46), 16) % 64;
  const x3_3 = parseInt(hexString.slice(46, 50), 16) % 64;
  const y3_3 = parseInt(hexString.slice(50, 54), 16) % 64;

  // 四角形（背景）
  const color4 = `#${hexString.slice(54, 60)}`;
  const rotation = (parseInt(hexString.slice(60, 64), 16) % 360); // 回転角度
</script>

<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景の四角形 -->
  <rect x="0" y="0" width="64" height="64" fill={color4} transform={`rotate(${rotation}, 32, 32)`} />
  
  <!-- 大きな円 -->
  <circle cx={cx1} cy={cy1} r={r1} fill={color1} />

  <!-- 内部の小さな円 -->
  <circle cx={cx2} cy={cy2} r={r2} fill={color2} />

  <!-- 三角形 -->
  <polygon points="{x3_1},{y3_1} {x3_2},{y3_2} {x3_3},{y3_3}" fill={color3} />
</svg>

<style>
  svg {
    border: 1px solid #ccc;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
  }
</style>

