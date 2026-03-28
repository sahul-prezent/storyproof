import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

const colors = {
  primary: '#111827',
  muted: '#6b7280',
  green: '#059669',
  blue: '#2563eb',
  amber: '#d97706',
  red: '#dc2626',
  lightGray: '#f3f4f6',
  border: '#e5e7eb',
  white: '#ffffff',
};

function gradeColor(grade: string) {
  if (grade === 'Excellent') return colors.green;
  if (grade === 'Good') return colors.blue;
  if (grade === 'Needs Work') return colors.amber;
  return colors.red;
}

function statusColor(status: string) {
  if (status === 'pass') return colors.green;
  if (status === 'flag') return colors.amber;
  return colors.red;
}

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 9, color: colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: `1px solid ${colors.border}`, paddingBottom: 12 },
  logo: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 7, color: colors.muted },
  scoreSection: { alignItems: 'center', marginBottom: 24 },
  scoreCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  scoreNumber: { fontSize: 28, fontFamily: 'Helvetica-Bold' },
  gradeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  gradeText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.white },
  fileName: { fontSize: 10, color: colors.muted, marginBottom: 4 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8, marginTop: 16 },
  card: { backgroundColor: colors.lightGray, borderRadius: 4, padding: 10, marginBottom: 6 },
  cardTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  cardBody: { fontSize: 8, color: colors.muted, lineHeight: 1.4 },
  evidence: { fontSize: 7.5, color: colors.muted, fontStyle: 'italic', marginTop: 3, paddingLeft: 8, borderLeft: `2px solid ${colors.border}` },
  consequence: { fontSize: 8, marginTop: 3 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottom: `1px solid ${colors.border}` },
  catName: { fontSize: 9, fontFamily: 'Helvetica-Bold', flex: 1 },
  catScore: { fontSize: 9, fontFamily: 'Helvetica-Bold', width: 30, textAlign: 'right' },
  barBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, flex: 2, marginHorizontal: 8 },
  barFill: { height: 6, borderRadius: 3 },
  slideRow: { flexDirection: 'row', paddingVertical: 4, borderBottom: `1px solid ${colors.border}`, fontSize: 8 },
  slideNum: { width: 25, color: colors.muted },
  slideTitle: { flex: 1 },
  slideWords: { width: 40, textAlign: 'center', color: colors.muted },
  slideDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 8, marginTop: 1 },
  slideIssue: { flex: 1, fontSize: 7, color: colors.muted },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 7, color: colors.muted, borderTop: `1px solid ${colors.border}`, paddingTop: 8 },
  upsellCard: { backgroundColor: '#f0f4ff', borderRadius: 4, padding: 10, marginBottom: 6, borderLeft: `3px solid ${colors.blue}` },
});

interface ReportData {
  file_name: string;
  overall_score: number;
  overall_grade: string;
  critical_issues: { signalName: string; categoryName: string; evidence: string; businessConsequence: string }[];
  quick_wins: { signalName: string; suggestion: string; effort: string }[];
  category_findings: { key: string; name: string; score: number; summary: string; signals: { name: string; score: number; status: string; finding: string }[] }[];
  slide_assessments: { slideNumber: number; title: string | null; wordCount: number; textDensity: string; titleQuality: string; keyIssue: string | null; overallStatus: string }[];
  upsell_recommendations: { productName: string; description: string; specificIssues: string[] }[];
}

function StoryProofReport({ data }: { data: ReportData }) {
  const gc = gradeColor(data.overall_grade);

  return (
    <Document>
      {/* Page 1: Score + Issues + Wins */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.logo}>StoryProof</Text>
            <Text style={s.subtitle}>Presentation Storytelling Scorer by Prezent.ai</Text>
          </View>
          <Text style={s.subtitle}>Diagnostic Report</Text>
        </View>

        <View style={s.scoreSection}>
          <Text style={s.fileName}>{data.file_name}</Text>
          <View style={[s.scoreCircle, { borderColor: gc }]}>
            <Text style={s.scoreNumber}>{data.overall_score}</Text>
          </View>
          <View style={[s.gradeBadge, { backgroundColor: gc }]}>
            <Text style={s.gradeText}>{data.overall_grade}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Top Critical Issues</Text>
        {(data.critical_issues || []).slice(0, 3).map((issue, i) => (
          <View key={i} style={s.card}>
            <Text style={[s.cardTitle, { color: colors.red }]}>{issue.signalName} <Text style={{ fontFamily: 'Helvetica', color: colors.muted, fontSize: 7 }}>({issue.categoryName})</Text></Text>
            <Text style={s.evidence}>{issue.evidence}</Text>
            <Text style={[s.consequence, { color: colors.red }]}>{issue.businessConsequence}</Text>
          </View>
        ))}

        <Text style={s.sectionTitle}>Quick Wins</Text>
        {(data.quick_wins || []).slice(0, 3).map((win, i) => (
          <View key={i} style={s.card}>
            <Text style={[s.cardTitle, { color: colors.green }]}>{win.signalName} <Text style={{ fontFamily: 'Helvetica', color: colors.muted, fontSize: 7 }}>({win.effort === 'low' ? 'Easy Fix' : 'Medium Effort'})</Text></Text>
            <Text style={s.cardBody}>{win.suggestion}</Text>
          </View>
        ))}

        <View style={s.footer}>
          <Text>StoryProof by Prezent.ai — prezent.ai</Text>
        </View>
      </Page>

      {/* Page 2: Category Breakdown */}
      <Page size="A4" style={s.page}>
        <Text style={[s.sectionTitle, { marginTop: 0 }]}>Category Breakdown</Text>
        {(data.category_findings || []).map((cat) => (
          <View key={cat.key} style={{ marginBottom: 12 }}>
            <View style={s.catRow}>
              <Text style={s.catName}>{cat.name}</Text>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${cat.score}%`, backgroundColor: cat.score >= 70 ? colors.green : cat.score >= 55 ? colors.amber : colors.red }]} />
              </View>
              <Text style={s.catScore}>{cat.score}</Text>
            </View>
            <Text style={{ fontSize: 8, color: colors.muted, marginTop: 3, lineHeight: 1.4 }}>{cat.summary}</Text>
            {(cat.signals || []).map((sig) => (
              <View key={sig.name} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, paddingLeft: 8 }}>
                <View style={[s.slideDot, { backgroundColor: statusColor(sig.status) }]} />
                <Text style={{ fontSize: 7.5, flex: 1 }}>{sig.name}: {sig.score}/10</Text>
                <Text style={{ fontSize: 7, color: colors.muted, flex: 2 }}>{sig.finding.split('.')[0]}.</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={s.footer}>
          <Text>StoryProof by Prezent.ai — prezent.ai</Text>
        </View>
      </Page>

      {/* Page 3: Slide Table + Upsell */}
      <Page size="A4" style={s.page}>
        <Text style={[s.sectionTitle, { marginTop: 0 }]}>Slide-by-Slide Summary</Text>

        <View style={[s.slideRow, { backgroundColor: colors.lightGray, fontFamily: 'Helvetica-Bold' }]}>
          <Text style={s.slideNum}>#</Text>
          <Text style={s.slideTitle}>Title</Text>
          <Text style={s.slideWords}>Words</Text>
          <Text style={{ width: 45, textAlign: 'center', fontSize: 7 }}>Density</Text>
          <Text style={{ width: 45, textAlign: 'center', fontSize: 7 }}>Title</Text>
          <Text style={s.slideIssue}>Key Issue</Text>
        </View>

        {(data.slide_assessments || []).slice(0, 40).map((slide) => (
          <View key={slide.slideNumber} style={s.slideRow}>
            <Text style={s.slideNum}>{slide.slideNumber}</Text>
            <Text style={[s.slideTitle, { fontSize: 7.5 }]}>{(slide.title || 'No title').substring(0, 40)}</Text>
            <Text style={s.slideWords}>{slide.wordCount}</Text>
            <View style={{ width: 45, alignItems: 'center' }}>
              <View style={[s.slideDot, { backgroundColor: statusColor(slide.textDensity) }]} />
            </View>
            <View style={{ width: 45, alignItems: 'center' }}>
              <View style={[s.slideDot, { backgroundColor: statusColor(slide.titleQuality) }]} />
            </View>
            <Text style={s.slideIssue}>{(slide.keyIssue || '—').substring(0, 60)}</Text>
          </View>
        ))}

        {(data.upsell_recommendations || []).length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 20 }]}>How Prezent Fixes This</Text>
            {data.upsell_recommendations.map((rec, i) => (
              <View key={i} style={s.upsellCard}>
                <Text style={[s.cardTitle, { color: colors.blue }]}>{rec.productName}</Text>
                <Text style={s.cardBody}>{rec.description}</Text>
                {(rec.specificIssues || []).map((issue, j) => (
                  <Text key={j} style={{ fontSize: 7, color: colors.muted, marginTop: 2 }}>• {issue}</Text>
                ))}
              </View>
            ))}
          </>
        )}

        <View style={s.footer}>
          <Text>StoryProof by Prezent.ai — prezent.ai</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateReportPdf(data: ReportData): Promise<Buffer> {
  const buffer = await renderToBuffer(<StoryProofReport data={data} />);
  return Buffer.from(buffer);
}
