import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumeContent } from "@/types/resume";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  name: { fontSize: 18, marginBottom: 4, fontWeight: "bold" },
  contact: { fontSize: 9, color: "#444", marginBottom: 12 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 2,
  },
  body: { fontSize: 10, lineHeight: 1.4 },
  jobTitle: { fontSize: 11, fontWeight: "bold", marginTop: 6 },
  company: { fontSize: 10, color: "#333" },
  bullet: { marginLeft: 8, marginTop: 2 },
});

export function ResumePdfDocument({ content }: { content: ResumeContent }) {
  const c = content.contact;
  const contactLine = [
    c.email,
    c.phone,
    c.location,
    c.linkedin,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{c.name || "Resume"}</Text>
        {contactLine ? <Text style={styles.contact}>{contactLine}</Text> : null}

        {content.summary ? (
          <>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.body}>{content.summary}</Text>
          </>
        ) : null}

        {content.experience.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Experience</Text>
            {content.experience.map((exp, i) => (
              <View key={i}>
                <Text style={styles.jobTitle}>{exp.title}</Text>
                <Text style={styles.company}>
                  {exp.company}
                  {exp.startDate || exp.endDate
                    ? ` — ${exp.startDate || ""} – ${exp.endDate || "Present"}`
                    : ""}
                </Text>
                {exp.bullets.map((b, j) => (
                  <Text key={j} style={styles.bullet}>
                    • {b}
                  </Text>
                ))}
              </View>
            ))}
          </>
        ) : null}

        {content.education.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {content.education.map((ed, i) => (
              <View key={i}>
                <Text style={styles.jobTitle}>{ed.institution}</Text>
                <Text style={styles.company}>
                  {[ed.degree, ed.field].filter(Boolean).join(", ")}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        {content.skills.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.body}>{content.skills.join(" • ")}</Text>
          </>
        ) : null}
      </Page>
    </Document>
  );
}
