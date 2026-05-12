const SKILL_CATALOG = [
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Kotlin",
  "Swift",
  "React",
  "Next.js",
  "Angular",
  "Vue",
  "Redux",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "Express",
  "FastAPI",
  "Django",
  "Flask",
  "Spring Boot",
  "Hibernate",
  "Microservices",
  "REST APIs",
  "GraphQL",
  "JSON",
  "OAuth",
  "JWT",
  "SQL",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "NoSQL",
  "Oracle",
  "SQLite",
  "Redis",
  "AWS",
  "Azure",
  "GCP",
  "Firebase",
  "Docker",
  "Kubernetes",
  "Terraform",
  "CI/CD",
  "Jenkins",
  "GitHub Actions",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Bootstrap",
  "Material UI",
  "Sass",
  "Git",
  "Linux",
  "Postman",
  "Testing",
  "Jest",
  "Cypress",
  "Playwright",
  "Selenium",
  "PyTest",
  "Data Structures",
  "Algorithms",
  "OOP",
  "DBMS",
  "System Design",
  "Machine Learning",
  "Deep Learning",
  "NLP",
  "LLMs",
  "LangChain",
  "TensorFlow",
  "PyTorch",
  "Pandas",
  "NumPy",
  "Data Analysis",
  "Excel",
  "Power BI",
  "Tableau",
  "Agile",
  "Scrum",
  "Jira",
  "Figma",
  "UI/UX",
  "Android",
  "React Native",
  "Flutter",
  "Communication",
  "Problem Solving",
];

const SKILL_ALIASES = {
  "REST APIs": ["rest api", "restful api", "restful services", "api development", "apis"],
  "Node.js": ["nodejs", "node js"],
  "Next.js": ["nextjs", "next js"],
  "FastAPI": ["fast api"],
  "Tailwind CSS": ["tailwind"],
  "Material UI": ["mui", "material-ui"],
  "GitHub Actions": ["github actions", "gh actions"],
  "GCP": ["google cloud", "google cloud platform"],
  "OAuth": ["oauth2", "oauth 2.0"],
  "JWT": ["json web token", "json web tokens"],
  "Data Structures": ["data structure", "dsa"],
  OOP: ["object oriented programming", "object-oriented programming"],
  "System Design": ["distributed systems", "architecture"],
  "Machine Learning": ["ml", "model training", "predictive modeling"],
  "Deep Learning": ["neural networks"],
  LLMs: ["llm", "large language models", "generative ai", "genai"],
  "Data Analysis": ["data analytics", "analytics"],
  "Power BI": ["powerbi"],
  "CI/CD": ["ci cd", "continuous integration", "continuous delivery", "devops pipeline"],
  Testing: ["unit testing", "integration testing", "test automation"],
  Communication: ["verbal communication", "written communication", "presentation skills"],
  "Problem Solving": ["analytical skills", "troubleshooting"],
};

const EXPLICIT_TERM_STOPWORDS = /^(The|This|We|You|Our|Job|Role|Candidate|Responsibilities|Requirements|Skills|Review|Work|Experience|Qualifications|Preferred|Must Have|Good To Have|About|Team|Company|Bachelor|Degree|Years|Location|Salary|Benefits)$/i;
const SKILL_MARKER = /(?:\+\+|#|\.js\b|api\b|sql\b|db\b|ui\/ux|ci\/cd|llm|nlp|aws|gcp|azure|react|node|java|python|docker|kubernetes|spring|mongo|redis|git|figma|jira)/i;
const ACRONYM = /^[A-Z][A-Z0-9+#./-]{1,}$/;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[•·●▪]/g, "\n")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueSkills(skills) {
  const seen = new Set();
  return skills.filter((skill) => {
    const key = skill.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function daysUntil(deadline) {
  const today = new Date();
  const target = new Date(deadline);
  const diff = Math.ceil((target - today) / 86400000);
  return Number.isFinite(diff) ? Math.max(diff, 1) : 14;
}

export function extractSkills(description) {
  const normalized = normalizeText(description);
  const text = normalized.toLowerCase();
  const catalogMatches = SKILL_CATALOG.filter((skill) => {
    const terms = [skill, ...(SKILL_ALIASES[skill] ?? [])];
    return terms.some((term) => new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(term)}([^a-z0-9+#.]|$)`, "i").test(text));
  });
  const requiredSection = normalized
    .split(/\b(requirements|required skills|technical skills|skills|qualifications|must have|good to have|preferred|responsibilities|requirements and skills)\b/i)
    .slice(1)
    .join(" ");
  const explicitTerms = Array.from((requiredSection || normalized).matchAll(/\b[A-Z][A-Za-z0-9+#./-]{1,}(?:\s[A-Z][A-Za-z0-9+#./-]{1,}){0,2}\b/g))
    .map((match) => match[0].trim())
    .filter((term) =>
      term.length > 2 &&
      !EXPLICIT_TERM_STOPWORDS.test(term) &&
      (SKILL_MARKER.test(term) || ACRONYM.test(term)),
    );

  return uniqueSkills([...catalogMatches, ...explicitTerms]).slice(0, 14);
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
    description: `Learn ${skill} through docs, guided lessons, and focused interview-ready practice.`,
    priority: index < 3 ? "high" : index < 6 ? "medium" : "low",
    resources: resourcesForSkill(skill),
    completed: false,
  };
}

function resourcesForSkill(skill) {
  const known = {
    React: [
      ["React docs", "https://react.dev/learn"],
      ["React practice", "https://www.freecodecamp.org/news/tag/react/"],
      ["Interview questions", "https://www.greatfrontend.com/questions/react"],
    ],
    JavaScript: [
      ["MDN JavaScript", "https://developer.mozilla.org/en-US/docs/Web/JavaScript"],
      ["JavaScript.info", "https://javascript.info/"],
      ["Practice problems", "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/"],
    ],
    "Node.js": [
      ["Node.js docs", "https://nodejs.org/en/learn"],
      ["Express guide", "https://expressjs.com/en/guide/routing.html"],
      ["Backend practice", "https://roadmap.sh/nodejs"],
    ],
    Express: [
      ["Express routing", "https://expressjs.com/en/guide/routing.html"],
      ["Express middleware", "https://expressjs.com/en/guide/using-middleware.html"],
      ["Node backend path", "https://roadmap.sh/nodejs"],
    ],
    MongoDB: [
      ["MongoDB University", "https://learn.mongodb.com/"],
      ["MongoDB Node.js driver", "https://www.mongodb.com/docs/drivers/node/current/"],
      ["MongoDB CRUD", "https://www.mongodb.com/docs/manual/crud/"],
    ],
    Python: [
      ["Python tutorial", "https://docs.python.org/3/tutorial/"],
      ["freeCodeCamp Python", "https://www.freecodecamp.org/learn/scientific-computing-with-python/"],
      ["Python practice", "https://exercism.org/tracks/python"],
    ],
    Java: [
      ["Java tutorials", "https://dev.java/learn/"],
      ["Java practice", "https://exercism.org/tracks/java"],
      ["Java interview prep", "https://www.baeldung.com/java-interview-questions"],
    ],
    SQL: [
      ["SQL tutorial", "https://www.w3schools.com/sql/"],
      ["PostgreSQL docs", "https://www.postgresql.org/docs/current/tutorial.html"],
      ["SQL practice", "https://sqlbolt.com/"],
    ],
    "Data Structures": [
      ["DSA guide", "https://www.geeksforgeeks.org/data-structures/"],
      ["Visual learning", "https://visualgo.net/en"],
      ["LeetCode practice", "https://leetcode.com/problemset/"],
    ],
    Algorithms: [
      ["Algorithms guide", "https://www.geeksforgeeks.org/fundamentals-of-algorithms/"],
      ["Visualgo", "https://visualgo.net/en"],
      ["Practice", "https://leetcode.com/problemset/"],
    ],
    "System Design": [
      ["System design primer", "https://github.com/donnemartin/system-design-primer"],
      ["Design basics", "https://roadmap.sh/system-design"],
      ["Interview guide", "https://www.educative.io/blog/system-design-interview"],
    ],
    HTML: [
      ["MDN HTML", "https://developer.mozilla.org/en-US/docs/Web/HTML"],
      ["HTML forms", "https://developer.mozilla.org/en-US/docs/Learn/Forms"],
      ["Practice", "https://www.freecodecamp.org/learn/2022/responsive-web-design/"],
    ],
    CSS: [
      ["MDN CSS", "https://developer.mozilla.org/en-US/docs/Web/CSS"],
      ["CSS layout", "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout"],
      ["Flexbox practice", "https://flexboxfroggy.com/"],
    ],
    "Tailwind CSS": [
      ["Tailwind docs", "https://tailwindcss.com/docs/installation/using-vite"],
      ["Utility-first basics", "https://tailwindcss.com/docs/styling-with-utility-classes"],
      ["Components", "https://ui.shadcn.com/docs/components"],
    ],
    Git: [
      ["Git book", "https://git-scm.com/book/en/v2"],
      ["GitHub skills", "https://skills.github.com/"],
      ["Branching practice", "https://learngitbranching.js.org/"],
    ],
    Testing: [
      ["Testing Library", "https://testing-library.com/docs/react-testing-library/intro/"],
      ["Vitest guide", "https://vitest.dev/guide/"],
      ["Testing patterns", "https://kentcdodds.com/blog/common-mistakes-with-react-testing-library"],
    ],
    Communication: [
      ["STAR method", "https://www.themuse.com/advice/star-interview-method"],
      ["Behavioral prep", "https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique"],
      ["Presentation skills", "https://www.coursera.org/articles/presentation-skills"],
    ],
    "Problem Solving": [
      ["Problem solving guide", "https://www.freecodecamp.org/news/how-to-solve-coding-problems/"],
      ["LeetCode practice", "https://leetcode.com/problemset/"],
      ["HackerRank practice", "https://www.hackerrank.com/domains/tutorials/10-days-of-javascript"],
    ],
  };

  return (known[skill] ?? [
    ["Developer roadmaps", "https://roadmap.sh/"],
    ["freeCodeCamp practice", "https://www.freecodecamp.org/learn/"],
    ["MDN web docs", "https://developer.mozilla.org/en-US/docs/Learn"],
  ]).map(([title, url]) => ({ title, url }));
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
