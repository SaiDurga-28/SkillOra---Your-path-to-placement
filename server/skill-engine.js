const SKILL_CATALOG = [
  "Python",
  "Java",
  "C++",
  "C#",
  "React",
  "Angular",
  "Vue",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "Express",
  "Django",
  "Flask",
  "Spring Boot",
  "REST APIs",
  "GraphQL",
  "SQL",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Git",
  "Linux",
  "Testing",
  "Jest",
  "Cypress",
  "Data Structures",
  "Algorithms",
  "System Design",
  "Machine Learning",
  "Data Analysis",
  "Excel",
  "Power BI",
  "Communication",
  "Problem Solving",
];

const SKILL_ALIASES = {
  "REST APIs": ["rest api", "restful api", "api development", "apis"],
  "Node.js": ["nodejs", "node js"],
  "Tailwind CSS": ["tailwind"],
  "Data Structures": ["data structure", "dsa"],
  "System Design": ["distributed systems", "architecture"],
  "Machine Learning": ["ml", "model training"],
  "Data Analysis": ["data analytics", "analytics"],
  "Power BI": ["powerbi"],
  "CI/CD": ["ci cd", "continuous integration", "continuous delivery", "devops pipeline"],
  Testing: ["unit testing", "integration testing", "test automation"],
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function daysUntil(deadline) {
  const today = new Date();
  const target = new Date(deadline);
  const diff = Math.ceil((target - today) / 86400000);
  return Number.isFinite(diff) ? Math.max(diff, 1) : 14;
}

export function extractSkills(description) {
  const text = description.toLowerCase();
  const catalogMatches = SKILL_CATALOG.filter((skill) => {
    const terms = [skill, ...(SKILL_ALIASES[skill] ?? [])];
    return terms.some((term) => new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(term)}([^a-z0-9+#.]|$)`, "i").test(text));
  });
  const requiredSection = description
    .split(/\b(requirements|skills|qualifications|must have|preferred|responsibilities)\b/i)
    .slice(1)
    .join(" ");
  const explicitTerms = Array.from((requiredSection || description).matchAll(/\b[A-Z][A-Za-z+#.]{1,}(?:\s[A-Z][A-Za-z+#.]{1,}){0,2}\b/g))
    .map((match) => match[0].trim())
    .filter((term) => term.length > 2 && !/^(The|This|We|You|Our|Job|Role|Candidate|Responsibilities|Requirements|Skills)$/i.test(term));

  return [...new Set([...catalogMatches, ...explicitTerms])].slice(0, 12);
}

export function difficultyFor(skills, description) {
  const text = description.toLowerCase();
  if (skills.length >= 10 || /senior|lead|architecture|system design/.test(text)) return "advanced";
  if (skills.length >= 7 || /intermediate|production|scalable/.test(text)) return "intermediate";
  return "beginner";
}

function makeSkill(skill, index, category) {
  return {
    id: `${category}-${index}-${skill.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: skill,
    description: `Practice ${skill} from the uploaded JD with examples, questions, and interview notes.`,
    priority: index < 3 ? "high" : index < 6 ? "medium" : "low",
    resources: [
      { title: `${skill} learning roadmap`, url: `https://www.google.com/search?q=${encodeURIComponent(`${skill} interview preparation`)}` },
      { title: `${skill} practice`, url: `https://www.google.com/search?q=${encodeURIComponent(`${skill} practice problems`)}` },
    ],
    completed: false,
  };
}

export function buildRoadmap(skills, estimatedDays) {
  const phaseSize = Math.max(1, Math.ceil(skills.length / 3));
  const groups = [
    { id: "foundation", title: "JD Skills Foundation", category: "technical", color: "#6366f1" },
    { id: "practice", title: "Applied Practice", category: "practice", color: "#10b981" },
    { id: "interview", title: "Interview Revision", category: "interview", color: "#f59e0b" },
  ];

  return groups
    .map((group, groupIndex) => {
      const start = groupIndex * phaseSize;
      const phaseSkills = skills.slice(start, start + phaseSize);
      if (phaseSkills.length === 0) return null;
      const startDay = Math.max(1, Math.floor((estimatedDays / groups.length) * groupIndex) + 1);
      const endDay = groupIndex === groups.length - 1
        ? estimatedDays
        : Math.max(startDay, Math.floor((estimatedDays / groups.length) * (groupIndex + 1)));

      return {
        ...group,
        startDay,
        endDay,
        skills: phaseSkills.map((skill, index) => makeSkill(skill, start + index, group.category)),
      };
    })
    .filter(Boolean);
}

export function analyzeJobLocally({ description, deadline }) {
  const extractedSkills = extractSkills(description);
  if (extractedSkills.length === 0) {
    throw new Error("No clear skills were found in this JD. Add required skills or technologies and try again.");
  }
  const estimatedDays = daysUntil(deadline);
  const difficulty = difficultyFor(extractedSkills, description);
  return {
    extractedSkills,
    estimatedDays,
    difficulty,
    roadmapPhases: buildRoadmap(extractedSkills, estimatedDays),
    analysisSource: "local-engine",
  };
}
