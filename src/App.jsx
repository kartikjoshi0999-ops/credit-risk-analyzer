import { useState, useEffect, useRef, useMemo } from "react";

// ══════════════════════════════════════════════════════════════
// CREDIT RISK ANALYZER — Institutional-Grade Loan Scoring Engine
// Zero APIs · 100% Free · Built-in Risk Models
// ══════════════════════════════════════════════════════════════

const COLORS = {
  bg: "#0a0e17",
  panel: "#111827",
  panelBorder: "#1e293b",
  panelHover: "#162033",
  accent: "#00d4aa",
  accentDim: "rgba(0,212,170,0.15)",
  accentGlow: "rgba(0,212,170,0.3)",
  danger: "#ef4444",
  dangerDim: "rgba(239,68,68,0.15)",
  warning: "#f59e0b",
  warningDim: "rgba(245,158,11,0.15)",
  info: "#3b82f6",
  infoDim: "rgba(59,130,246,0.15)",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  gold: "#fbbf24",
  gridLine: "#1e293b",
};

const RISK_GRADES = [
  { grade: "AAA", min: 800, max: 900, color: "#00d4aa", label: "Prime" },
  { grade: "AA", min: 740, max: 799, color: "#22c55e", label: "Excellent" },
  { grade: "A", min: 680, max: 739, color: "#84cc16", label: "Good" },
  { grade: "BBB", min: 620, max: 679, color: "#f59e0b", label: "Fair" },
  { grade: "BB", min: 560, max: 619, color: "#f97316", label: "Below Average" },
  { grade: "B", min: 500, max: 559, color: "#ef4444", label: "Poor" },
  { grade: "CCC", min: 300, max: 499, color: "#dc2626", label: "Very Poor" },
];

const INDUSTRY_RISK = {
  Technology: 0.92,
  Healthcare: 0.88,
  Finance: 0.85,
  Manufacturing: 0.80,
  Retail: 0.75,
  Construction: 0.70,
  Hospitality: 0.65,
  "Oil & Gas": 0.72,
  Agriculture: 0.68,
  "Real Estate": 0.78,
};

const SAMPLE_LOANS = [
  { id: "LN-2026-001", name: "Maple Ridge Developments", amount: 2500000, term: 60, rate: 5.25, creditScore: 742, dti: 0.32, ltv: 0.75, industry: "Real Estate", collateral: 3200000, yearsInBusiness: 12, annualRevenue: 8500000, status: "Under Review" },
  { id: "LN-2026-002", name: "Northern Tech Solutions", amount: 500000, term: 36, rate: 4.75, creditScore: 788, dti: 0.21, ltv: 0.60, industry: "Technology", collateral: 850000, yearsInBusiness: 8, annualRevenue: 3200000, status: "Under Review" },
  { id: "LN-2026-003", name: "Cornwall Auto Parts Ltd", amount: 350000, term: 48, rate: 6.50, creditScore: 651, dti: 0.45, ltv: 0.85, industry: "Retail", collateral: 410000, yearsInBusiness: 5, annualRevenue: 1800000, status: "Under Review" },
  { id: "LN-2026-004", name: "Prairie Harvest Co-op", amount: 1200000, term: 72, rate: 5.80, creditScore: 695, dti: 0.38, ltv: 0.70, industry: "Agriculture", collateral: 1700000, yearsInBusiness: 20, annualRevenue: 4200000, status: "Under Review" },
  { id: "LN-2026-005", name: "St. Lawrence Hospitality", amount: 800000, term: 60, rate: 7.10, creditScore: 612, dti: 0.52, ltv: 0.90, industry: "Hospitality", collateral: 890000, yearsInBusiness: 3, annualRevenue: 2100000, status: "Under Review" },
  { id: "LN-2026-006", name: "Gatineau Builders Inc", amount: 1800000, term: 48, rate: 6.00, creditScore: 718, dti: 0.35, ltv: 0.78, industry: "Construction", collateral: 2300000, yearsInBusiness: 15, annualRevenue: 6800000, status: "Under Review" },
  { id: "LN-2026-007", name: "MedVault Diagnostics", amount: 950000, term: 60, rate: 4.50, creditScore: 810, dti: 0.18, ltv: 0.55, industry: "Healthcare", collateral: 1750000, yearsInBusiness: 10, annualRevenue: 5500000, status: "Under Review" },
  { id: "LN-2026-008", name: "Ontario Petroleum Corp", amount: 3000000, term: 84, rate: 5.90, creditScore: 678, dti: 0.41, ltv: 0.82, industry: "Oil & Gas", collateral: 3650000, yearsInBusiness: 7, annualRevenue: 12000000, status: "Under Review" },
];

// ─── Risk Calculation Engine ────────────────────────────────
function calculatePD(creditScore, dti, ltv, yearsInBusiness, industry) {
  // Merton-style simplified PD model
  const scoreNorm = Math.max(0, Math.min(1, (creditScore - 300) / 600));
  const dtiPenalty = dti > 0.43 ? (dti - 0.43) * 2.5 : 0;
  const ltvPenalty = ltv > 0.80 ? (ltv - 0.80) * 3.0 : 0;
  const tenureBenefit = Math.min(0.15, yearsInBusiness * 0.01);
  const industryFactor = INDUSTRY_RISK[industry] || 0.75;
  
  let pd = (1 - scoreNorm) * 0.35 + dtiPenalty * 0.25 + ltvPenalty * 0.20;
  pd = pd * (2 - industryFactor) - tenureBenefit;
  pd = Math.max(0.001, Math.min(0.65, pd));
  return pd;
}

function calculateLGD(ltv, collateral, loanAmount) {
  const collateralCoverage = collateral / loanAmount;
  if (collateralCoverage >= 1.5) return 0.15;
  if (collateralCoverage >= 1.2) return 0.25;
  if (collateralCoverage >= 1.0) return 0.35;
  return 0.25 + ltv * 0.40;
}

function calculateEL(pd, lgd, ead) {
  return pd * lgd * ead;
}

function getRiskGrade(creditScore) {
  return RISK_GRADES.find(g => creditScore >= g.min && creditScore <= g.max) || RISK_GRADES[RISK_GRADES.length - 1];
}

function getMonthlyPayment(principal, annualRate, termMonths) {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

function getDSCR(annualRevenue, annualDebtPayments) {
  return annualRevenue / Math.max(1, annualDebtPayments);
}

// ─── Reusable Components ────────────────────────────────────
const Panel = ({ children, style, glow, onClick }) => (
  <div onClick={onClick} style={{
    background: COLORS.panel,
    border: `1px solid ${glow ? COLORS.accent : COLORS.panelBorder}`,
    borderRadius: 12,
    padding: "20px",
    boxShadow: glow ? `0 0 20px ${COLORS.accentGlow}` : "0 4px 20px rgba(0,0,0,0.3)",
    transition: "all 0.3s ease",
    cursor: onClick ? "pointer" : "default",
    ...style,
  }}>
    {children}
  </div>
);

const Badge = ({ text, color, bg }) => (
  <span style={{
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.5px",
    color: color,
    background: bg,
    border: `1px solid ${color}30`,
  }}>
    {text}
  </span>
);

const MetricBox = ({ label, value, sub, color = COLORS.accent }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const ProgressBar = ({ value, max = 1, color = COLORS.accent, height = 6 }) => (
  <div style={{ background: "#1e293b", borderRadius: height, height, overflow: "hidden", width: "100%" }}>
    <div style={{
      width: `${Math.min(100, (value / max) * 100)}%`,
      height: "100%",
      background: `linear-gradient(90deg, ${color}, ${color}88)`,
      borderRadius: height,
      transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
      boxShadow: `0 0 8px ${color}40`,
    }} />
  </div>
);

const MiniGauge = ({ value, max, label, color }) => {
  const pct = (value / max) * 100;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="#1e293b" strokeWidth="7" />
        <circle cx="45" cy="45" r={radius} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }} />
        <text x="45" y="42" textAnchor="middle" fill={color} fontSize="16" fontWeight="800" fontFamily="'JetBrains Mono', monospace">
          {typeof value === "number" ? (value * 100 < 100 ? (value * 100).toFixed(1) : value.toFixed(0)) : value}
        </text>
        <text x="45" y="56" textAnchor="middle" fill={COLORS.textDim} fontSize="9">{max === 1 ? "%" : ""}</text>
      </svg>
      <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: -4, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
};

// ─── Bar Chart Component ────────────────────────────────────
const BarChart = ({ data, width = 500, height = 200 }) => {
  const maxVal = Math.max(...data.map(d => d.value));
  const barWidth = Math.min(40, (width - 60) / data.length - 8);
  const chartH = height - 40;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <g key={i}>
          <line x1="40" y1={20 + chartH * (1 - f)} x2={width} y2={20 + chartH * (1 - f)} stroke={COLORS.gridLine} strokeDasharray="3,3" />
          <text x="36" y={24 + chartH * (1 - f)} fill={COLORS.textDim} fontSize="9" textAnchor="end" fontFamily="monospace">
            {(maxVal * f / 1000).toFixed(0)}K
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = 50 + i * ((width - 60) / data.length);
        return (
          <g key={i}>
            <defs>
              <linearGradient id={`bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={d.color} />
                <stop offset="100%" stopColor={d.color + "44"} />
              </linearGradient>
            </defs>
            <rect x={x} y={20 + chartH - barH} width={barWidth} height={barH} rx={4}
              fill={`url(#bar-${i})`} style={{ transition: "height 0.8s, y 0.8s" }} />
            <text x={x + barWidth / 2} y={height - 4} fill={COLORS.textDim} fontSize="8" textAnchor="middle" fontFamily="monospace">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Risk Heatmap ───────────────────────────────────────────
const RiskHeatmap = ({ loans }) => {
  const cells = [];
  const dtiRanges = ["<25%", "25-35%", "35-43%", "43-50%", ">50%"];
  const ltvRanges = ["<60%", "60-70%", "70-80%", "80-90%", ">90%"];
  
  const getDtiBucket = (dti) => dti < 0.25 ? 0 : dti < 0.35 ? 1 : dti < 0.43 ? 2 : dti < 0.50 ? 3 : 4;
  const getLtvBucket = (ltv) => ltv < 0.60 ? 0 : ltv < 0.70 ? 1 : ltv < 0.80 ? 2 : ltv < 0.90 ? 3 : 4;
  
  const matrix = Array(5).fill(null).map(() => Array(5).fill(null).map(() => []));
  loans.forEach(l => {
    matrix[getDtiBucket(l.dti)][getLtvBucket(l.ltv)].push(l);
  });
  
  const heatColor = (r, c) => {
    const riskLevel = (r + c) / 8;
    if (riskLevel < 0.3) return "#00d4aa30";
    if (riskLevel < 0.5) return "#22c55e30";
    if (riskLevel < 0.65) return "#f59e0b30";
    if (riskLevel < 0.8) return "#f9731630";
    return "#ef444430";
  };
  
  const cellSize = 56;
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "inline-block", minWidth: 380 }}>
        <div style={{ display: "flex", marginLeft: 60 }}>
          {ltvRanges.map((l, i) => (
            <div key={i} style={{ width: cellSize, textAlign: "center", fontSize: 9, color: COLORS.textDim, padding: "2px 0" }}>{l}</div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: COLORS.textMuted, textAlign: "center", marginLeft: 60, marginBottom: 4, letterSpacing: "1px" }}>LTV RATIO →</div>
        {dtiRanges.map((dLabel, r) => (
          <div key={r} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 56, fontSize: 9, color: COLORS.textDim, textAlign: "right", paddingRight: 6 }}>{dLabel}</div>
            {ltvRanges.map((_, c) => (
              <div key={c} style={{
                width: cellSize, height: cellSize, background: heatColor(r, c),
                border: `1px solid ${COLORS.panelBorder}`, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 4, margin: 1,
              }}>
                {matrix[r][c].length > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>{matrix[r][c].length}</div>
                    <div style={{ fontSize: 8, color: COLORS.textDim }}>loan{matrix[r][c].length > 1 ? "s" : ""}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        <div style={{ fontSize: 9, color: COLORS.textMuted, marginLeft: 0, marginTop: 4, letterSpacing: "1px" }}>
          <span style={{ writingMode: "horizontal-tb" }}>DTI RATIO ↓</span>
        </div>
      </div>
    </div>
  );
};

// ─── Amortization Mini Chart ────────────────────────────────
const AmortChart = ({ principal, rate, term }) => {
  const points = [];
  const monthlyRate = rate / 100 / 12;
  const payment = getMonthlyPayment(principal, rate, term);
  let balance = principal;
  for (let m = 0; m <= term; m += Math.max(1, Math.floor(term / 30))) {
    points.push({ month: m, balance, interest: balance * monthlyRate, principal: payment - balance * monthlyRate });
    balance = Math.max(0, balance - (payment - balance * monthlyRate));
  }
  const w = 320, h = 100, pad = 5;
  const xScale = (i) => pad + (i / (points.length - 1)) * (w - 2 * pad);
  const yScale = (v) => pad + (1 - v / principal) * (h - 2 * pad);
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(p.balance)}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 10}`}>
      <defs>
        <linearGradient id="amort-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={COLORS.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${pathD} L${xScale(points.length - 1)},${h - pad} L${pad},${h - pad} Z`} fill="url(#amort-fill)" />
      <path d={pathD} fill="none" stroke={COLORS.accent} strokeWidth="2" />
      <text x={w / 2} y={h + 8} fill={COLORS.textDim} fontSize="8" textAnchor="middle">Remaining Balance Over Time</text>
    </svg>
  );
};

// ─── Custom Loan Input Form ─────────────────────────────────
const LoanForm = ({ onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    name: "", amount: 500000, term: 60, rate: 5.5, creditScore: 700,
    dti: 0.35, ltv: 0.75, industry: "Technology", collateral: 650000,
    yearsInBusiness: 5, annualRevenue: 2000000,
  });
  
  const Field = ({ label, field, type = "number", step, min, max, options }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: COLORS.textDim, display: "block", marginBottom: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</label>
      {options ? (
        <select value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          style={{ width: "100%", padding: "8px 10px", background: "#0a0e17", border: `1px solid ${COLORS.panelBorder}`, borderRadius: 6, color: COLORS.text, fontSize: 13 }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[field]} step={step} min={min} max={max}
          onChange={e => setForm(p => ({ ...p, [field]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
          style={{ width: "100%", padding: "8px 10px", background: "#0a0e17", border: `1px solid ${COLORS.panelBorder}`, borderRadius: 6, color: COLORS.text, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", boxSizing: "border-box" }} />
      )}
    </div>
  );
  
  return (
    <Panel style={{ marginTop: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent, marginBottom: 16, letterSpacing: "1px" }}>+ NEW LOAN APPLICATION</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Field label="Borrower Name" field="name" type="text" />
        <Field label="Loan Amount ($)" field="amount" step={10000} min={10000} />
        <Field label="Term (Months)" field="term" step={12} min={12} max={360} />
        <Field label="Interest Rate (%)" field="rate" step={0.25} min={0.5} max={25} />
        <Field label="Credit Score" field="creditScore" step={1} min={300} max={900} />
        <Field label="DTI Ratio" field="dti" step={0.01} min={0} max={1} />
        <Field label="LTV Ratio" field="ltv" step={0.01} min={0} max={1.5} />
        <Field label="Collateral ($)" field="collateral" step={10000} min={0} />
        <Field label="Years in Business" field="yearsInBusiness" step={1} min={0} />
        <Field label="Annual Revenue ($)" field="annualRevenue" step={50000} min={0} />
        <Field label="Industry" field="industry" options={Object.keys(INDUSTRY_RISK)} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={() => {
          if (!form.name) return;
          onSubmit({ ...form, id: `LN-2026-${String(Math.floor(Math.random() * 900) + 100)}`, status: "Under Review" });
        }} style={{
          padding: "10px 28px", background: COLORS.accent, color: "#0a0e17", border: "none", borderRadius: 8,
          fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: "0.5px",
        }}>ANALYZE LOAN</button>
        <button onClick={onCancel} style={{
          padding: "10px 28px", background: "transparent", color: COLORS.textMuted, border: `1px solid ${COLORS.panelBorder}`,
          borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>CANCEL</button>
      </div>
    </Panel>
  );
};

// ─── Loan Detail View ───────────────────────────────────────
const LoanDetail = ({ loan, onBack }) => {
  const pd = calculatePD(loan.creditScore, loan.dti, loan.ltv, loan.yearsInBusiness, loan.industry);
  const lgd = calculateLGD(loan.ltv, loan.collateral, loan.amount);
  const el = calculateEL(pd, lgd, loan.amount);
  const grade = getRiskGrade(loan.creditScore);
  const monthlyPmt = getMonthlyPayment(loan.amount, loan.rate, loan.term);
  const annualDebt = monthlyPmt * 12;
  const dscr = getDSCR(loan.annualRevenue, annualDebt);
  const totalInterest = monthlyPmt * loan.term - loan.amount;
  const collateralCoverage = loan.collateral / loan.amount;
  
  const riskScore = Math.round(100 - pd * 150);
  const riskColor = riskScore >= 75 ? COLORS.accent : riskScore >= 50 ? COLORS.warning : COLORS.danger;
  
  // Stress test scenarios
  const stressTests = [
    { label: "Base Case", rateShock: 0, revDrop: 0 },
    { label: "Rate +200bps", rateShock: 2, revDrop: 0 },
    { label: "Revenue -20%", rateShock: 0, revDrop: 0.20 },
    { label: "Severe Stress", rateShock: 3, revDrop: 0.30 },
  ].map(s => {
    const stressedRate = loan.rate + s.rateShock;
    const stressedPmt = getMonthlyPayment(loan.amount, stressedRate, loan.term);
    const stressedDSCR = getDSCR(loan.annualRevenue * (1 - s.revDrop), stressedPmt * 12);
    const stressedPD = calculatePD(loan.creditScore, loan.dti + s.revDrop * 0.3, loan.ltv, loan.yearsInBusiness, loan.industry);
    return { ...s, dscr: stressedDSCR, pd: stressedPD, payment: stressedPmt };
  });

  const recommendation = pd < 0.05 ? "APPROVE" : pd < 0.10 ? "APPROVE WITH CONDITIONS" : pd < 0.20 ? "REFER TO COMMITTEE" : "DECLINE";
  const recColor = pd < 0.05 ? COLORS.accent : pd < 0.10 ? "#22c55e" : pd < 0.20 ? COLORS.warning : COLORS.danger;

  return (
    <div>
      <button onClick={onBack} style={{
        padding: "8px 20px", background: "transparent", color: COLORS.textMuted, border: `1px solid ${COLORS.panelBorder}`,
        borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", marginBottom: 16,
      }}>← BACK TO PORTFOLIO</button>
      
      {/* Header */}
      <Panel glow style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textDim, letterSpacing: "1.5px", textTransform: "uppercase" }}>{loan.id}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, marginTop: 4 }}>{loan.name}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <Badge text={loan.industry} color={COLORS.info} bg={COLORS.infoDim} />
              <Badge text={grade.grade + " — " + grade.label} color={grade.color} bg={grade.color + "20"} />
              <Badge text={recommendation} color={recColor} bg={recColor + "20"} />
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.accent, fontFamily: "'JetBrains Mono', monospace" }}>
              ${(loan.amount / 1000000).toFixed(loan.amount >= 1000000 ? 2 : 0)}{loan.amount >= 1000000 ? "M" : "K"}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textDim }}>{loan.term} months @ {loan.rate}%</div>
          </div>
        </div>
      </Panel>

      {/* Key Risk Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "PD", value: (pd * 100).toFixed(2) + "%", color: pd < 0.05 ? COLORS.accent : pd < 0.15 ? COLORS.warning : COLORS.danger },
          { label: "LGD", value: (lgd * 100).toFixed(1) + "%", color: lgd < 0.3 ? COLORS.accent : lgd < 0.45 ? COLORS.warning : COLORS.danger },
          { label: "Expected Loss", value: "$" + (el / 1000).toFixed(0) + "K", color: COLORS.gold },
          { label: "DSCR", value: dscr.toFixed(2) + "x", color: dscr > 1.5 ? COLORS.accent : dscr > 1.2 ? COLORS.warning : COLORS.danger },
          { label: "Monthly Pmt", value: "$" + (monthlyPmt / 1000).toFixed(1) + "K", color: COLORS.info },
          { label: "Collateral Coverage", value: collateralCoverage.toFixed(2) + "x", color: collateralCoverage > 1.2 ? COLORS.accent : COLORS.warning },
        ].map((m, i) => (
          <Panel key={i}>
            <MetricBox label={m.label} value={m.value} color={m.color} />
          </Panel>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
        {/* Risk Gauges */}
        <Panel>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, marginBottom: 16, letterSpacing: "1px", textTransform: "uppercase" }}>Risk Profile</div>
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 12 }}>
            <MiniGauge value={pd} max={1} label="Default Prob" color={pd < 0.05 ? COLORS.accent : pd < 0.15 ? COLORS.warning : COLORS.danger} />
            <MiniGauge value={loan.dti} max={1} label="DTI Ratio" color={loan.dti < 0.36 ? COLORS.accent : loan.dti < 0.43 ? COLORS.warning : COLORS.danger} />
            <MiniGauge value={loan.ltv} max={1} label="LTV Ratio" color={loan.ltv < 0.75 ? COLORS.accent : loan.ltv < 0.85 ? COLORS.warning : COLORS.danger} />
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: COLORS.textDim }}>Composite Risk Score</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: riskColor, fontFamily: "monospace" }}>{riskScore}/100</span>
            </div>
            <ProgressBar value={riskScore} max={100} color={riskColor} height={8} />
          </div>
        </Panel>

        {/* Amortization */}
        <Panel>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, marginBottom: 12, letterSpacing: "1px", textTransform: "uppercase" }}>Amortization Schedule</div>
          <AmortChart principal={loan.amount} rate={loan.rate} term={loan.term} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "10px 0", borderTop: `1px solid ${COLORS.panelBorder}` }}>
            <div>
              <div style={{ fontSize: 10, color: COLORS.textDim }}>Total Interest</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.warning, fontFamily: "monospace" }}>${(totalInterest / 1000).toFixed(0)}K</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.textDim }}>Total Repayment</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, fontFamily: "monospace" }}>${((monthlyPmt * loan.term) / 1000).toFixed(0)}K</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.textDim }}>Interest/Principal</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.info, fontFamily: "monospace" }}>{((totalInterest / loan.amount) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Stress Tests */}
      <Panel style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, marginBottom: 16, letterSpacing: "1px", textTransform: "uppercase" }}>Stress Test Scenarios</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
            <thead>
              <tr>
                {["Scenario", "Monthly Payment", "DSCR", "PD", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: COLORS.textDim, borderBottom: `1px solid ${COLORS.panelBorder}`, letterSpacing: "1px", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stressTests.map((s, i) => {
                const status = s.dscr > 1.25 && s.pd < 0.15 ? "PASS" : s.dscr > 1.0 ? "WARNING" : "FAIL";
                const statusColor = status === "PASS" ? COLORS.accent : status === "WARNING" ? COLORS.warning : COLORS.danger;
                return (
                  <tr key={i} style={{ background: i === 0 ? COLORS.accentDim : "transparent" }}>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: COLORS.text, fontWeight: i === 0 ? 700 : 400 }}>{s.label}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: COLORS.text, fontFamily: "monospace" }}>${s.payment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: s.dscr > 1.25 ? COLORS.accent : s.dscr > 1.0 ? COLORS.warning : COLORS.danger, fontFamily: "monospace", fontWeight: 700 }}>{s.dscr.toFixed(2)}x</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: s.pd < 0.10 ? COLORS.accent : s.pd < 0.20 ? COLORS.warning : COLORS.danger, fontFamily: "monospace" }}>{(s.pd * 100).toFixed(2)}%</td>
                    <td style={{ padding: "10px 12px" }}><Badge text={status} color={statusColor} bg={statusColor + "20"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Decision */}
      <Panel glow={recommendation === "APPROVE"} style={{ borderColor: recColor + "60" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: recColor + "20", border: `2px solid ${recColor}`,
            fontSize: 22,
          }}>
            {recommendation === "APPROVE" ? "✓" : recommendation === "DECLINE" ? "✗" : "⚠"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: recColor }}>{recommendation}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, lineHeight: 1.5 }}>
              {recommendation === "APPROVE" && `Strong credit profile (${grade.grade}). PD of ${(pd * 100).toFixed(2)}% is well within risk appetite. DSCR of ${dscr.toFixed(2)}x provides adequate debt service coverage. Collateral coverage at ${collateralCoverage.toFixed(2)}x.`}
              {recommendation === "APPROVE WITH CONDITIONS" && `Acceptable credit profile (${grade.grade}) with PD of ${(pd * 100).toFixed(2)}%. Recommend additional covenants: minimum DSCR maintenance of 1.25x, quarterly financial reporting, and collateral revaluation at 24-month mark.`}
              {recommendation === "REFER TO COMMITTEE" && `Elevated risk indicators detected. PD of ${(pd * 100).toFixed(2)}% exceeds standard threshold. ${loan.dti > 0.43 ? "DTI ratio above guideline." : ""} ${dscr < 1.25 ? "DSCR below 1.25x minimum." : ""} Requires senior credit committee approval with enhanced monitoring.`}
              {recommendation === "DECLINE" && `Risk metrics exceed acceptable parameters. PD of ${(pd * 100).toFixed(2)}% indicates high default probability. ${loan.dti > 0.50 ? "DTI ratio critically elevated." : ""} ${dscr < 1.0 ? "Insufficient debt service coverage." : ""} Recommend declining or restructuring with significantly reduced exposure.`}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};

// ─── Main App ───────────────────────────────────────────────
export default function CreditRiskAnalyzer() {
  const [loans, setLoans] = useState(SAMPLE_LOANS);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState("dashboard");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  const portfolioMetrics = useMemo(() => {
    let totalExposure = 0, totalEL = 0, weightedPD = 0;
    const gradeDistribution = {};
    const industryExposure = {};
    
    loans.forEach(l => {
      const pd = calculatePD(l.creditScore, l.dti, l.ltv, l.yearsInBusiness, l.industry);
      const lgd = calculateLGD(l.ltv, l.collateral, l.amount);
      const el = calculateEL(pd, lgd, l.amount);
      const grade = getRiskGrade(l.creditScore);
      
      totalExposure += l.amount;
      totalEL += el;
      weightedPD += pd * l.amount;
      gradeDistribution[grade.grade] = (gradeDistribution[grade.grade] || 0) + 1;
      industryExposure[l.industry] = (industryExposure[l.industry] || 0) + l.amount;
    });
    
    return {
      totalExposure,
      totalEL,
      avgPD: weightedPD / totalExposure,
      count: loans.length,
      gradeDistribution,
      industryExposure,
    };
  }, [loans]);

  const handleAddLoan = (loan) => {
    setLoans(prev => [...prev, loan]);
    setShowForm(false);
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
      background: COLORS.bg,
      color: COLORS.text,
      minHeight: "100vh",
      padding: 0,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.panelBorder}; border-radius: 3px; }
        input:focus, select:focus { outline: none; border-color: ${COLORS.accent} !important; box-shadow: 0 0 0 2px ${COLORS.accentGlow}; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .animate-in { animation: fadeInUp 0.6s ease forwards; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0a0e17 0%, #111827 50%, #0a0e17 100%)",
        borderBottom: `1px solid ${COLORS.panelBorder}`,
        padding: "16px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.info})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: "#0a0e17",
          }}>CR</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, letterSpacing: "0.5px" }}>CREDIT RISK ANALYZER</div>
            <div style={{ fontSize: 10, color: COLORS.textDim, letterSpacing: "1.5px" }}>INSTITUTIONAL LOAN SCORING ENGINE</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.accent, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, color: COLORS.textDim, fontFamily: "monospace" }}>RISK ENGINE ACTIVE</span>
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
        {selectedLoan ? (
          <LoanDetail loan={selectedLoan} onBack={() => setSelectedLoan(null)} />
        ) : (
          <>
            {/* Portfolio Summary */}
            <div className={animate ? "animate-in" : ""} style={{ opacity: 0, animationDelay: "0.1s" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Exposure", value: "$" + (portfolioMetrics.totalExposure / 1000000).toFixed(1) + "M", color: COLORS.accent },
                  { label: "Expected Loss", value: "$" + (portfolioMetrics.totalEL / 1000).toFixed(0) + "K", sub: (portfolioMetrics.totalEL / portfolioMetrics.totalExposure * 100).toFixed(2) + "% of portfolio", color: COLORS.warning },
                  { label: "Wtd Avg PD", value: (portfolioMetrics.avgPD * 100).toFixed(2) + "%", color: portfolioMetrics.avgPD < 0.05 ? COLORS.accent : COLORS.warning },
                  { label: "Active Loans", value: portfolioMetrics.count, color: COLORS.info },
                ].map((m, i) => (
                  <Panel key={i}>
                    <MetricBox {...m} />
                  </Panel>
                ))}
              </div>
            </div>

            {/* Charts Row */}
            <div className={animate ? "animate-in" : ""} style={{ opacity: 0, animationDelay: "0.2s", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 20 }}>
              <Panel>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, marginBottom: 12, letterSpacing: "1px", textTransform: "uppercase" }}>Industry Exposure</div>
                <BarChart data={Object.entries(portfolioMetrics.industryExposure).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({
                  label: k.slice(0, 8), value: v,
                  color: [COLORS.accent, COLORS.info, "#22c55e", COLORS.warning, COLORS.gold, "#a855f7", "#ec4899", "#f97316"][i % 8],
                }))} />
              </Panel>
              <Panel>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, marginBottom: 12, letterSpacing: "1px", textTransform: "uppercase" }}>DTI vs LTV Risk Heatmap</div>
                <RiskHeatmap loans={loans} />
              </Panel>
            </div>

            {/* Loan Table */}
            <div className={animate ? "animate-in" : ""} style={{ opacity: 0, animationDelay: "0.3s" }}>
              <Panel>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "1px", textTransform: "uppercase" }}>Loan Portfolio</div>
                  <button onClick={() => setShowForm(!showForm)} style={{
                    padding: "8px 20px", background: showForm ? "transparent" : COLORS.accent, color: showForm ? COLORS.textMuted : "#0a0e17",
                    border: showForm ? `1px solid ${COLORS.panelBorder}` : "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: "0.5px",
                  }}>
                    {showForm ? "CANCEL" : "+ NEW LOAN"}
                  </button>
                </div>

                {showForm && <LoanForm onSubmit={handleAddLoan} onCancel={() => setShowForm(false)} />}

                <div style={{ overflowX: "auto", marginTop: showForm ? 16 : 0 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                    <thead>
                      <tr>
                        {["Loan ID", "Borrower", "Amount", "Grade", "PD", "DTI", "LTV", "DSCR", "Decision"].map(h => (
                          <th key={h} style={{
                            textAlign: "left", padding: "10px 12px", fontSize: 10, color: COLORS.textDim,
                            borderBottom: `1px solid ${COLORS.panelBorder}`, letterSpacing: "1px", textTransform: "uppercase",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map((l, i) => {
                        const pd = calculatePD(l.creditScore, l.dti, l.ltv, l.yearsInBusiness, l.industry);
                        const grade = getRiskGrade(l.creditScore);
                        const monthlyPmt = getMonthlyPayment(l.amount, l.rate, l.term);
                        const dscr = getDSCR(l.annualRevenue, monthlyPmt * 12);
                        const rec = pd < 0.05 ? "APPROVE" : pd < 0.10 ? "CONDITIONAL" : pd < 0.20 ? "COMMITTEE" : "DECLINE";
                        const recColor = pd < 0.05 ? COLORS.accent : pd < 0.10 ? "#22c55e" : pd < 0.20 ? COLORS.warning : COLORS.danger;
                        return (
                          <tr key={l.id} onClick={() => setSelectedLoan(l)}
                            style={{ cursor: "pointer", borderBottom: `1px solid ${COLORS.panelBorder}08`, transition: "background 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = COLORS.panelHover}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "12px", fontSize: 12, color: COLORS.info, fontFamily: "monospace", fontWeight: 600 }}>{l.id}</td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{l.name}</div>
                              <div style={{ fontSize: 10, color: COLORS.textDim }}>{l.industry}</div>
                            </td>
                            <td style={{ padding: "12px", fontSize: 13, fontFamily: "monospace", color: COLORS.text }}>${(l.amount / 1000).toFixed(0)}K</td>
                            <td style={{ padding: "12px" }}><Badge text={grade.grade} color={grade.color} bg={grade.color + "20"} /></td>
                            <td style={{ padding: "12px", fontSize: 13, fontFamily: "monospace", color: pd < 0.05 ? COLORS.accent : pd < 0.15 ? COLORS.warning : COLORS.danger }}>{(pd * 100).toFixed(2)}%</td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <ProgressBar value={l.dti} max={0.6} color={l.dti < 0.36 ? COLORS.accent : l.dti < 0.43 ? COLORS.warning : COLORS.danger} />
                                <span style={{ fontSize: 11, fontFamily: "monospace", color: COLORS.textMuted, minWidth: 35 }}>{(l.dti * 100).toFixed(0)}%</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <ProgressBar value={l.ltv} max={1} color={l.ltv < 0.75 ? COLORS.accent : l.ltv < 0.85 ? COLORS.warning : COLORS.danger} />
                                <span style={{ fontSize: 11, fontFamily: "monospace", color: COLORS.textMuted, minWidth: 35 }}>{(l.ltv * 100).toFixed(0)}%</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px", fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: dscr > 1.5 ? COLORS.accent : dscr > 1.2 ? COLORS.warning : COLORS.danger }}>{dscr.toFixed(2)}x</td>
                            <td style={{ padding: "12px" }}><Badge text={rec} color={recColor} bg={recColor + "20"} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>

            {/* Grade Distribution */}
            <div className={animate ? "animate-in" : ""} style={{ opacity: 0, animationDelay: "0.4s", marginTop: 16 }}>
              <Panel>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, marginBottom: 16, letterSpacing: "1px", textTransform: "uppercase" }}>Credit Grade Distribution</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {RISK_GRADES.map(g => {
                    const count = portfolioMetrics.gradeDistribution[g.grade] || 0;
                    return (
                      <div key={g.grade} style={{
                        flex: "1 1 80px", minWidth: 80, padding: "12px 8px", borderRadius: 8,
                        background: count > 0 ? g.color + "15" : "#0a0e1780",
                        border: `1px solid ${count > 0 ? g.color + "40" : COLORS.panelBorder}`,
                        textAlign: "center", transition: "all 0.3s",
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: count > 0 ? g.color : COLORS.textDim, fontFamily: "monospace" }}>{count}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: g.color, marginTop: 2 }}>{g.grade}</div>
                        <div style={{ fontSize: 9, color: COLORS.textDim, marginTop: 2 }}>{g.label}</div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", padding: "24px 0 12px", fontSize: 10, color: COLORS.textDim, letterSpacing: "1px" }}>
              CREDIT RISK ANALYZER · BUILT WITH REACT · ZERO API DEPENDENCIES · KARTIK JOSHI
            </div>
          </>
        )}
      </div>
    </div>
  );
}
