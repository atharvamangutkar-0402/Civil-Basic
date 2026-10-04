# CivilBasic — Research Readiness Audit & System Assessment

**Research Title:**  
*“AI-Based Conversational Construction Site Management and Reporting Using Natural Language to Structured Data Extraction”*

**Target Venue:** IEEE Conference / Academic Journal  
**Audit Date:** September 30, 2026  
**Auditor:** Senior Software Architect & AI Research Engineer

---

## 1. Existing Architecture Summary

The existing application (`CivilBasic`) is a desktop-first construction management and site intelligence application built with the following stack:

* **Frontend Framework:** React 19 + TypeScript + Vite.
* **Desktop Wrapper:** Electron (v34) with custom native IPC handlers (`show-save-dialog`, `show-message-box`, `show-notification`) and menu integration (`trigger-export-boq`, `trigger-sync-whatsapp`).
* **Routing:** React Router v7 (`HashRouter` in `src/App.tsx`).
* **State Management & Database Layer:** Centralized React Context (`AppContext.tsx`) backed by `useReducer`. Data persistence is implemented via web `localStorage` under the key `civil_basic_app_state`. There is currently **no external SQL/NoSQL database server**; data resides as an in-memory JSON object graph.
* **UI & Styling:** Custom Vanilla CSS design system (`src/index.css`), Lucide React icon suite, and Recharts visualization library.
* **AI Engine & NLP Architecture:** Deterministic rule-based, regex, dictionary-normalized, and multi-intent keyword extraction pipeline in `src/utils/aiResearchPipeline.ts` and `src/utils/whatsappDataSync.ts`.

---

## 2. Existing Construction Modules Audit

The application contains 19 sub-modules in `src/pages/`:

1. **Projects (`src/pages/Projects`):** Multi-project management, status tracking (`Planning`, `Active`, `On Hold`, `Completed`, `At Risk`), site location, client data, and floor area metrics.
2. **BOQ & Estimation (`src/pages/BOQ`):** Bill of Quantities items with category breakdown, rate estimation, total amount calculation, and variance tracking.
3. **Materials & Stock (`src/pages/Materials`):** Inventory equations enforcing `Remaining = Opening + Purchased - Used - Damaged/Misplaced`. Reorder level warnings.
4. **Purchases (`src/pages/Purchases`):** Material purchase logs, supplier tags, GST percentage calculation, invoice numbers, and payment status (`Pending`, `Partial`, `Paid`).
5. **Labour Management (`src/pages/Labour`):** Worker registration, worker roles (Mason, Helper, Carpenter, Electrician, etc.), daily wage calculations, agency logs, and daily attendance tracking.
6. **RMC (Ready Mix Concrete) (`src/pages/BillsAndDailyReports` & `src/data/seedData.ts`):** RMC purchase tracking (Supplier, grade M20-M40, quantity in m³, rate, GST, pump charges).
7. **Expenses & Quotations (`src/pages/ExpensesAndQuotations` & `src/pages/Expenses`):** Categorized site expenses (Cash, Online, Cheque), vendor quotation comparisons, and decision tags.
8. **Bills & Payments (`src/pages/BillsAndDailyReports`):** Vendor billing, payment status tracking, due dates, subtotal + GST calculations.
9. **Suppliers & Vendors (`src/pages/Suppliers`):** Supplier directory, material categories, rating, historical vs current rate tracking.
10. **Quotations (`src/pages/ExpensesAndQuotations`):** Side-by-side vendor quotation comparison with selection rationale.
11. **Notifications & Reminders (`src/pages/NotificationsAndReminders`):** System alerts for reorder levels, payment due dates, and custom site reminders.
12. **Site Diary (`src/pages/Diary`):** Daily progress logs, weather conditions, site notes, supervisor sign-offs.
13. **Progress (`src/pages/Progress`):** Work package completion percentages, milestone tracking.
14. **Analytics (`src/pages/Analytics`):** Spend breakdowns, material cost distribution, labour cost trends.
15. **Reports (`src/pages/Reports`):** PDF/CSV export engine for BOQ, expenses, stock balances, and daily summaries.
16. **CAD Studio (`src/pages/CAD`):** 2D blueprint / site plan previewer and measurement tools.
17. **Conversational Assistant (`src/pages/WhatsAppAssistant`):** Natural language message input interface simulating WhatsApp site communication.
18. **Research Dashboard (`src/pages/ResearchDashboard`):** IEEE benchmark dashboard, dataset runner, baseline comparison, ablation analysis, and usability metrics.
19. **Settings (`src/pages/Settings`):** Backup/restore application state, theme settings, API configurations.

---

## 3. Existing Data Structures & Schema Audit

All entities are typed in `src/types/index.ts` and managed in `AppContext.tsx`:

* **`Project`**: `id`, `name`, `clientName`, `location`, `projectType`, `builtUpArea`, `numberOfFloors`, `startDate`, `expectedCompletionDate`, `estimatedBudget`, `status`.
* **`Material`**: `id`, `projectId`, `name`, `category`, `unit`, `openingStock`, `purchasedQuantity`, `usedQuantity`, `minimumStockLevel`, `purchaseRate`, `supplier`, `lastUpdated`.
* **`MaterialTransaction`**: `id`, `materialId`, `projectId`, `type` (`purchase` | `consumption` | `transfer` | `adjustment`), `quantity`, `date`, `notes`, `supplierId`.
* **`Worker` & `Attendance`**: Worker master records, daily wage rates, agency names, project assignments, attendance logs (`Present`, `Half Day`, `Absent`, `Overtime`).
* **`Purchase`**: Invoice records, unit rate, GST amount, net total, supplier link, payment status.
* **`SiteExpense`**: Category (`Material`, `Labour`, `Equipment`, `Utilities`, `Subcontractor`, `Misc`), payment mode (`Cash`, `Online`, `Cheque`), vendor, amount, date.
* **`Bill`**: Vendor bill details, subtotal, GST, payment status, payment mode, due date.
* **`Quotation`**: Multi-vendor price quote comparison, unit rate, total amount, selection status, selection reason.
* **`Reminder`**: Alert title, category, target date, completion status, priority.
* **`ResearchDatasetItem` & `ResearchLogEntry`**: Ground-truth dataset structure (300 items), language types, intent labels, extracted entities, processing time, baseline/ablation outputs, metrics.

---

## 4. Existing APIs & Electron Integration

* **Electron Native IPC Handlers (`electron/main.ts`):**
  * `show-save-dialog`: Native OS file save dialogs for exporting BOQ/Reports.
  * `show-message-box`: Native alert and confirmation dialogs.
  * `show-notification`: OS level desktop notification dispatcher.
* **Internal Event Bus (`window.electronAPI` / React State):**
  * `trigger-export-boq`, `trigger-sync-whatsapp`.
* **Local Data Layer:** In-browser and Electron `localStorage` with JSON serialization.

---

## 5. Existing AI / NLP Functionality Audit

The current AI capability is situated in `src/utils/aiResearchPipeline.ts` and `src/utils/whatsappDataSync.ts`:

* **Language Preprocessing:** Marathi & Hinglish dictionary normalization (`MARATHI_ENGLISH_DICTIONARY`) converting terms like `सिमेंट` -> `cement`, `पोलाद` -> `steel`, `आले` -> `received`, `वापरले` -> `used`, `खराब` -> `damaged`.
* **Extraction Engine:** Multi-action intent extractor identifying `material_received`, `material_consumed`, `material_damaged`, `labour_attendance`, `rmc_received`, `site_expense`, `bill_created`, etc.
* **Fuzzy Matching:** String normalization against active materials, projects, suppliers, and agencies registered in `AppContext`.
* **Validation Layer:** Schema validator checking positive quantities, valid materials, non-negative remaining stock, and duplicate transaction prevention.
* **Confidence Scoring & Confirmation:** Calculates composite confidence (0.0 to 1.0). Low confidence triggers an interactive confirmation modal `[Confirm] [Edit] [Cancel]`.
* **Benchmark Suite:** Evaluates 4 baseline/ablation models (`baseline_1_rule_based`, `baseline_2_raw_llm`, `ablation_model_a`, `proposed_system`) across 300 annotated messages.

---

## 6. Existing Mathematical Calculations & Business Rules Audit

* **Inventory Rule:** `Remaining Stock = Opening Stock + Purchased Quantity - Used Quantity - Damaged/Misplaced Quantity`.
* **Labour Expense Rule:** `Daily Labour Cost = Worker Count * Daily Rate`.
* **RMC Expense Rule:** `Total RMC Cost = (Quantity * Unit Rate * (1 + GST%)) + Pump Charges`.
* **Purchase Net Amount:** `Total = Subtotal * (1 + GST% / 100)`.
* **Budget Spent Ratio:** `Spent Percentage = (Total Expenses + Labour Costs + Material Purchases) / Estimated Budget * 100`.

---

## 7. Existing Authentication & Access Control

* Currently implemented as local single-user mode suitable for desktop offline execution.
* Settings tab provides user profile identifiers and project role simulation (`Site Engineer`, `Project Manager`, `Auditor`).

---

## 8. Existing Reporting & Analytics Audit

* **Reports Page (`src/pages/Reports`):** Structured summary tables, CSV export handlers, PDF generation layout for BOQ, daily progress, material consumption, and payment dues.
* **Analytics Page (`src/pages/Analytics`):** Recharts pie/bar visualizations for expense categories, cost overruns, and daily labour counts.

---

## 9. Research Readiness & Satisfied Requirements

The system **already satisfies** several key research requirements:
1. **Multi-Action Message Support:** Can parse messages containing multiple site actions (e.g. material received + material used + labour count in 1 sentence).
2. **Multi-Lingual Support:** Supports English, Marathi-English code-mixed (*Minglish/Hinglish*), Marathi-dominant, and informal site inputs.
3. **Structured Entity Matching & Validation:** Validates extracted entities against `AppContext` database state before transactions execute.
4. **Interactive Confirmation:** Holds low-confidence transactions in a confirmation drawer before updating state.
5. **Research Dataset (300 items):** Pre-loaded 300 annotated construction site messages with ground-truth JSON targets in `src/data/researchDataset.ts`.
6. **Benchmark & Evaluation Framework:** Measures Accuracy, Precision, Recall, F1 score, exact match rates, and execution speed across 4 comparative baselines.
7. **Research Dashboard:** Full visualization tab in `src/pages/ResearchDashboard` with dataset analytics, confusion matrix, error taxonomy, and CSV export.

---

## 10. Missing Components & Recommended Enhancements

To guarantee 100% compliance with the academic standards requested for the IEEE paper:

1. **Custom Category / Material Extensibility:** Ensure that adding custom categories/materials via conversational input automatically persists them to the global category list (avoiding dead "Other" static options).
2. **Explicit Alias Store:** Add an explicit dictionary store for supplier/material aliases (e.g., `ABC Cement`, `ABC Cement Supplier`, `ABC Concrete` mapping to Vendor `id: v1`).
3. **Usability Participant Data Persistence:** Ensure the Human Usability Study module supports saving and exporting real user test trials (task completion time, error count, satisfaction ratings).
4. **Complete Academic Documentation Suite:** Maintain all 17 research documentation files in root (`RESEARCH_METHODOLOGY.md`, `DATASET_SCHEMA.md`, `EXPERIMENT_PROTOCOL.md`, etc.).

---

## 11. Potential Research Risks & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| **Noisy Site Jargon & Typos** | Dictionary normalization + fuzzy Levenshtein distance matching against registered database entities. |
| **Hallucinated DB Operations** | Strict schema validation intercepting LLM outputs. Non-existent projects or negative stock results are rejected or sent to human confirmation. |
| **Un-evaluated Metric Inflation** | Un-run benchmark metrics are explicitly initialized as `"Awaiting Experiment"` to prevent false claims. |
| **Data Privacy** | All dataset entries use synthetic or anonymized vendor/client/worker names. |

---

## 12. Research Reproducibility Summary

* **Dataset Versioning:** `research_dataset_v1.0` (300 ground-truth annotated items).
* **Deterministic Execution:** The evaluation suite runs with fixed seeds and explicit rules, allowing any researcher to reproduce the exact precision, recall, and F1 scores offline.
* **Exportable Benchmarks:** Evaluation logs and metric comparisons are exportable as standard CSV files (`research_dataset.csv`, `experiment_results.csv`, `error_analysis.csv`, `usability_results.csv`).
