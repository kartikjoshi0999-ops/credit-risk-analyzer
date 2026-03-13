# Credit Risk Analyzer — Institutional Loan Scoring Engine

A professional-grade credit risk assessment platform built with React, featuring institutional-level risk models, stress testing, and automated loan decisioning.

**Live Demo:** [credit-risk-analyzer.vercel.app](https://credit-risk-analyzer.vercel.app)

## Features

### Risk Modeling Engine
- **Probability of Default (PD)** — Merton-style model using credit score, DTI, LTV, industry risk factors, and business tenure
- **Loss Given Default (LGD)** — Collateral-based recovery estimation
- **Expected Loss (EL)** — PD × LGD × EAD calculation following Basel III methodology

### Loan Analysis
- Automated credit grading (AAA through CCC)
- Debt Service Coverage Ratio (DSCR) analysis
- Amortization schedule visualization
- Monthly payment calculations

### Stress Testing
- Four scenarios: Base Case, Rate +200bps, Revenue -20%, Severe Stress
- DSCR and PD sensitivity under each scenario
- Pass/Warning/Fail status for each test

### Portfolio Analytics
- DTI vs LTV risk heatmap
- Industry concentration analysis
- Weighted average PD across portfolio
- Credit grade distribution

### Decision Engine
- Automated recommendations: Approve / Approve with Conditions / Refer to Committee / Decline
- Rule-based decisioning with narrative rationale
- Case-by-case investigation with full drill-down

## Use Case

Built for financial analysts, credit officers, and risk teams evaluating commercial loan applications. Input borrower details — credit score, financials, collateral — and receive instant institutional-grade risk assessment with actionable recommendations.

## Tech Stack

React 18 · Vite · Pure JavaScript risk models · Zero API dependencies · Zero cost

## Run Locally

```bash
npm install
npm run dev
```

## Author

**Kartik Joshi** — Financial Analyst & AI Tools Enthusiast  
MBA (Finance & Marketing) · Deutsche Bank · BMO  
[LinkedIn](https://www.linkedin.com/in/kartikjoshi09) · [GitHub](https://github.com/kartikjoshi0999-ops)
