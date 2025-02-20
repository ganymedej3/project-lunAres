# Project lunAres

**AI-Enhanced Accessibility Testing Framework**

Project lunAres is an AI-enhanced accessibility testing framework that uses Playwright and axe-core to perform multi-page, multi-flow accessibility audits on a target website. The framework simulates real user interactions (including dynamic menu navigation and keyboard flows) and leverages a local LLM (e.g., mistral:7b-instruct via Ollama) to provide detailed, actionable remediation insights based on the audit results. This project builds on the concepts and lessons learned from [Project Bennu](https://github.com/ganymedej3/project-bennu).

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Generating Reports](#generating-reports)
- [Extending the Framework](#extending-the-framework)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

Project lunAres is designed to automate accessibility audits for websites by:
- Running axe-core scans across multiple pages and flows.
- Simulating complex user interactions (e.g., dynamic menus, keyboard navigation).
- Aggregating the raw audit data into a basic report.
- Using an integrated local LLM to generate detailed, user-centric analysis and remediation guidance for serious and critical accessibility issues.
- Producing two reports:
  - A **basic report** (`report-basic.json`) containing raw axe-core data.
  - A **detailed AI-enhanced report** (`report-api.txt`) with per-page insights and cross-page aggregated patterns.

## Features

- **Multi-Page, Multi-Flow Accessibility Audits:**  
  Simulate complex user interactions using Playwright and axe-core.

- **Basic Report Generation:**  
  Capture and store raw axe-core audit results in a structured JSON report.

- **AI-Enhanced Detailed Reporting:**  
  Filter for serious and critical violations per page and call a local LLM to produce detailed, issue-by-issue analysis including:
  - Impacted elements.
  - User-centric explanations.
  - Issue descriptions.
  - Priority and WCAG guideline references.
  - Remediation recommendations.

- **Aggregated Insights:**  
  After per-page analysis, an additional LLM call generates aggregated cross-page patterns and statistics.

- **Extensible and Modular Architecture:**  
  Easily adapt or extend the system (e.g., to support additional browsers or further AI enhancements).

## Architecture

The framework consists of several key components:

1. **Core Test Runner:**  
   Orchestrates browser interactions, navigates the target website, and runs axe-core scans.

2. **Playwright Driver:**  
   Launches and controls browser sessions (currently focused on Chrome for the POC).

3. **Keyboard Navigator:**  
   Simulates keyboard navigation flows and captures screenshots for focus indicator verification.

4. **Basic Report Generator:**  
   Aggregates raw results from axe-core scans into a structured JSON report (`report-basic.json`).

5. **AI Modules:**  
   - **AI Manager:** Interfaces with the local LLM service (Ollama with mistral:7b-instruct).
   - **AI Client:** Builds prompts and processes LLM responses.
   
6. **Detailed Report Generator:**  
   Groups serious and critical violations per page, calls the LLM for detailed per-page analysis, and aggregates both per-page and cross-page insights into a final text report (`report-api.txt`).

7. **Utilities & Configuration:**  
   Centralized logging and configuration files ensure maintainability and ease of use.

The architecture is visually represented using a [Mermaid diagram](https://mermaid.js.org/) in the `docs/architecture.md` file.

## Project Structure

```
project-lunAres/
├── config/
│   ├── config.json                  // Target AUT URL, global timeout, screenshot directory, etc.
│   └── ai.config.ts                 // AI service configuration (local LLM settings)
├── docs/
│   └── architecture.md              // Architecture diagram and design notes
├── src/
│   ├── ai/
│   │   ├── manager.ts               // Handles low-level LLM integration (calls to Ollama)
│   │   ├── aiClient.ts              // Builds prompts and processes LLM responses
│   │   └── llm_response_parser.ts   // Parses raw LLM responses (from Project Bennu)
│   ├── core/
│   │   ├── testRunner.ts            // Orchestrates the overall test flow
│   │   └── keyboardNavigator.ts     // Simulates keyboard navigation and captures screenshots
│   ├── drivers/
│   │   └── playwrightDriver.ts      // Launches and controls browser sessions using Playwright
│   ├── reports/
│   │   ├── reportGenerator.ts       // Aggregates and writes basic reports to disk
│   │   └── detailedReportGenerator.ts // Groups violations, calls LLM for detailed per-page analysis, and aggregates final report
│   ├── utils/
│   │   └── logger.ts                // Centralized logging utility
│   └── index.ts                     // Entry point: loads config and starts the TestRunner
├── tests/
│   └── sampleTest.spec.ts           // Sample integration test using Playwright’s test runner
├── package.json
├── tsconfig.json
└── README.md                        // Project documentation
```

## Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14+ recommended)
- npm (comes with Node.js)
- A running instance of your local LLM service (e.g., Ollama configured with mistral:7b-instruct) at the endpoint specified in `config/ai.config.ts`

### Installation Steps

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/ganymedej3/project-lunAres.git
   cd project-lunAres
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Configure the Project:**

   - Edit `config/config.json` as needed (set the AUT URL, global timeout, and screenshot directory).
   - Verify `config/ai.config.ts` matches your local LLM settings.

4. **Ensure TypeScript Configuration:**

   Your `tsconfig.json` should be set up correctly for module resolution, JSON imports, etc.

## Usage

### Running the Test Runner

To execute the complete test flow (browsing, scanning, report generation):

```bash
npm start
```

This command runs `src/index.ts`, which instantiates the TestRunner to:
- Navigate the target website.
- Execute axe-core scans.
- Generate a basic report (`report-basic.json`).
- Generate a detailed AI-enhanced report (`report-api.txt`).

### Running Integration Tests

If you want to run integration tests using Playwright’s test runner:

```bash
npm test
```

## Generating Reports

### Basic Report

- **Location:** `report-basic.json`
- **Content:** Raw aggregated axe-core scan results organized by browser and page.

### AI-Enhanced Detailed Report

- **Location:** `report-api.txt`
- **Content:** For each page, detailed AI-generated analysis is provided for serious and critical violations. The report includes:
  - Impacted elements.
  - User-centric explanations.
  - Issue descriptions.
  - Priority and WCAG guideline references.
  - Remediation recommendations.
  
  In addition, an aggregated cross-page summary (overall statistics, common patterns, and recommendations) is appended at the end.

## Extending the Framework

- **Additional Browsers:**  
  Update `config/config.json` and modify `PlaywrightDriver` to support browsers other than Chrome.
  
- **AI Enhancements:**  
  Modify prompt templates in `src/ai/aiClient.ts` or the per-page prompt in `DetailedReportGenerator` to tailor the LLM responses.

- **Report Customization:**  
  Adjust the aggregation logic in `DetailedReportGenerator` if you wish to change the final report’s format or content.

- **CI/CD Integration:**  
  You can containerize this solution (using Docker) or integrate it with a CI pipeline to run automated accessibility tests on a schedule.

## Troubleshooting

- **LLM Response Issues:**  
  If the AI-enhanced report does not meet your expectations:
  - Verify your prompt templates.
  - Check the raw LLM responses (logged to the console) for additional commentary.
  - Adjust prompt language to better guide the LLM.

- **Axe-core Scans:**  
  If axe-core scans fail or the `axe` global is not available:
  - Confirm that the `injectAxe()` function in TestRunner is successfully injecting the `axe.min.js` script.
  - Check network conditions and timeouts.

- **Report File Not Found:**  
  Ensure that the working directory is correct when running the tests (reports are written to the project root).
