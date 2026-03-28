# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryProof is a BioPharma-specific presentation storytelling scorer — a cold email lead magnet and diagnostic tool for Prezent.ai. A prospect uploads a PowerPoint or PDF, answers 3-5 audience context questions, and receives a scored diagnostic report within 60 seconds.

**Source of truth:** `StoryProof_Product_Specification.docx` contains the full product spec, scoring taxonomy, persona context, and conversion strategy.

## Product Flow

1. **Upload** — User uploads a PowerPoint or PDF. No login or account required.
2. **Audience Context** — User answers: primary audience type, presentation purpose, audience familiarity, regulatory context (approved/investigational/pipeline), desired outcome.
3. **Scored Report** — System returns an overall StoryProof Score out of 100 with category breakdowns, slide-level analysis, top 3 critical issues, top 3 quick wins, and Prezent upsell recommendations.

## Scoring Architecture

36 signals across 7 categories, weighted into an overall score out of 100:

| Category | Signals | Weight |
|---|---|---|
| Narrative Structure | 6 | 20% |
| Business Communication | 6 | 18% |
| Slide-Level Quality | 5 | 15% |
| Slide Design Quality | 5 | 12% |
| Persuasion and Conviction | 4 | 15% |
| Structural Completeness | 2 | 8% |
| BioPharma-Specific Signals | 8 | 12% |

**Score ranges:** 85-100 Excellent, 70-84 Good, 55-69 Needs Work, below 55 Critical Issues.

## BioPharma-Specific Signals (Category 7)

These 8 signals are the primary differentiator — no generic tool covers them:
- Evidence citation quality (sourced claims)
- MLR readiness flag (superlatives, off-label risk, fair balance)
- Scientific-to-lay translation
- Clinical data visualization clarity
- Patient-centricity signal
- Cross-functional audience calibration
- Regulatory context awareness
- Launch readiness narrative

## Critical Signals for Conversion

Three signals must always appear prominently regardless of individual score:
- **Signal 30 (MLR Readiness Flag)** — creates immediate urgency for Medical Affairs/Sales personas
- **Signal 12 (Audience Empathy)** — diagnoses why deals stall or payer meetings fail
- **Signal 26 (Stakes Clarity)** — absence of cost-of-inaction is the most common commercial deck failure

## Upsell Trigger Map

| Condition | Recommendation |
|---|---|
| Design score < 60 | Prezent OP Service (overnight deck rebuild) |
| MLR readiness flag triggered | Prezent OP Service (Medical Affairs template rebuild) |
| Narrative score < 65 | Prezent.ai platform (Story Builder) |
| Scientific translation < 60 | Prezent.ai platform (Audience Calibrator) |
| Evidence citation gaps | Prezent OP Service (medical review pass) |
| Text density flag on 3+ slides | Prezent.ai platform (slide simplification) |
| Overall score < 55 | Prezent OP Service (full deck rebuild) |

## Report Output Structure

1. Overall StoryProof Score (score, grade, one-sentence interpretation, radar/bar chart)
2. Top 3 Critical Issues (signal name, specific evidence with slide numbers, business consequence)
3. Top 3 Quickest Wins (low effort, high impact)
4. Full Category Breakdown (7 categories with scores and 2-3 sentence findings)
5. Slide-by-Slide Summary (pass/flag/fail table per slide)
6. How Prezent Fixes This (tailored recommendation tied to specific issues found)

## Design Principles

- Every finding must cite specific evidence: slide numbers, quoted headlines, word counts. Vague feedback has zero conversion value.
- The report must feel like a senior strategist read the deck — not like a grammar checker.
- With 36 signals, do not display every signal as a line item. Use collapsed sections with expand-on-demand.
- Target audience personas: Chief of Staff, Medical Affairs, Sales/Commercial, Training, R&D, Data Analytics, Commercial Operations, Marketing.

## What the AI Reads from Uploaded Decks

- Slide titles and headlines (insight quality, narrative thread)
- Body text (word count, bullet density, jargon level, claim substantiation)
- Slide sequence (logical flow, arc completeness)
- Chart/data slide presence (data clarity, insight labeling)
- Slide count (efficiency, appendix hygiene)
- Visual element presence (visual-to-text ratio, clutter)
- Font, color, template consistency (design quality, brand compliance)
