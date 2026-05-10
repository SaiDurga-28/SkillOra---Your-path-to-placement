import { useMutation, useQuery } from "@tanstack/react-query";

const JOBS_KEY = "job-prep-jobs";
const INTERVIEWS_KEY = "job-prep-interviews";

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

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") ?? "null");
  } catch {
    return null;
  }
}

function readJobs() {
  try {
    return JSON.parse(localStorage.getItem(JOBS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeJobs(jobs) {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

function readInterviews() {
  try {
    return JSON.parse(localStorage.getItem(INTERVIEWS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeInterviews(interviews) {
  localStorage.setItem(INTERVIEWS_KEY, JSON.stringify(interviews));
}

function userJobs() {
  const user = currentUser();
  return readJobs().filter((job) => job.userEmail === user?.email);
}

function userInterviews() {
  const user = currentUser();
  return readInterviews().filter((interview) => interview.userEmail === user?.email);
}

function saveUserJob(updatedJob) {
  const jobs = readJobs();
  const index = jobs.findIndex((job) => job.id === updatedJob.id);

  if (index >= 0) {
    jobs[index] = updatedJob;
  } else {
    jobs.push(updatedJob);
  }

  writeJobs(jobs);
}

async function analyzeJobOnServer(data) {
  const user = currentUser();
  const response = await fetch("/api/jobs/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Email": user?.email ?? "",
    },
    body: JSON.stringify({ ...data, userEmail: user?.email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? "Backend analysis failed.");
  }

  return response.json();
}

async function postServerJson(path, data) {
  const user = currentUser();
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Email": user?.email ?? "",
    },
    body: JSON.stringify({ ...data, userEmail: user?.email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? "Backend request failed.");
  }

  return response.json();
}

function daysUntil(deadline) {
  const today = new Date();
  const target = new Date(deadline);
  const diff = Math.ceil((target - today) / 86400000);
  return Number.isFinite(diff) ? Math.max(diff, 1) : 14;
}

function lastSevenDays() {
  const days = [];
  const formatter = new Intl.DateTimeFormat("en", { weekday: "short" });

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    days.push({
      key: date.toISOString().slice(0, 10),
      day: formatter.format(date),
      skills: 0,
      practice: 0,
      interviews: 0,
    });
  }

  return days;
}

function looksLikeJobDescription(description) {
  const text = description.toLowerCase();
  const signals = [
    "responsibilities",
    "requirements",
    "skills",
    "experience",
    "qualification",
    "role",
    "candidate",
    "developer",
    "engineer",
    "analyst",
    "work",
  ];

  return description.trim().length >= 120 && signals.filter((signal) => text.includes(signal)).length >= 3;
}

function extractSkills(description) {
  const text = description.toLowerCase();
  const matches = SKILL_CATALOG.filter((skill) => {
    const terms = [skill, ...(SKILL_ALIASES[skill] ?? [])];
    return terms.some((term) => new RegExp(`(^|[^a-z0-9+#.])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9+#.]|$)`, "i").test(text));
  });
  const requiredSection = description
    .split(/\b(requirements|skills|qualifications|must have|preferred|responsibilities)\b/i)
    .slice(1)
    .join(" ");
  const source = requiredSection || description;
  const explicitTerms = Array.from(source.matchAll(/\b[A-Z][A-Za-z+#.]{1,}(?:\s[A-Z][A-Za-z+#.]{1,}){0,2}\b/g))
    .map((match) => match[0].trim())
    .filter((term) => term.length > 2 && !/^(The|This|We|You|Our|Job|Role|Candidate|Responsibilities|Requirements|Skills)$/i.test(term));

  return [...new Set([...matches, ...explicitTerms])].slice(0, 12);
}

function difficultyFor(skills, description) {
  const text = description.toLowerCase();

  if (skills.length >= 10 || /senior|lead|architecture|system design/.test(text)) {
    return "advanced";
  }

  if (skills.length >= 7 || /intermediate|production|scalable/.test(text)) {
    return "intermediate";
  }

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
  const slug = encodeURIComponent(skill);
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
    "REST APIs": [
      ["REST guide", "https://restfulapi.net/"],
      ["MDN HTTP", "https://developer.mozilla.org/en-US/docs/Web/HTTP"],
      ["API practice", "https://www.postman.com/what-is-an-api/"],
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
    "Resume storytelling": [
      ["STAR method", "https://www.themuse.com/advice/star-interview-method"],
      ["Resume bullets", "https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/"],
      ["Interview stories", "https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique"],
    ],
    "Mock interview practice": [
      ["Pramp practice", "https://www.pramp.com/"],
      ["Interviewing.io", "https://interviewing.io/"],
      ["Behavioral prep", "https://www.indeed.com/career-advice/interviewing/most-common-behavioral-interview-questions-and-answers"],
    ],
    "STAR answers": [
      ["STAR method", "https://www.themuse.com/advice/star-interview-method"],
      ["Examples", "https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique"],
      ["Practice guide", "https://www.coursera.org/articles/star-interview-method"],
    ],
  };

  return (known[skill] ?? [
    ["Developer roadmaps", "https://roadmap.sh/"],
    ["freeCodeCamp practice", "https://www.freecodecamp.org/learn/"],
    ["MDN web docs", "https://developer.mozilla.org/en-US/docs/Learn"],
  ]).map(([title, url]) => ({ title, url }));
}

function hasSearchResource(skill) {
  return (skill.resources ?? []).some((resource) => {
    const url = typeof resource === "string" ? resource : resource?.url;
    return /google\.com\/search/i.test(url ?? "");
  });
}

function withLearningResources(skill) {
  if (Array.isArray(skill.resources) && skill.resources.length > 0 && !hasSearchResource(skill)) {
    return skill;
  }

  return {
    ...skill,
    description: skill.description?.replace(/^Practice /, "Learn ") ?? `Learn ${skill.name} with real lessons and practice.`,
    resources: resourcesForSkill(skill.name),
  };
}

function buildRoadmap(skills, estimatedDays) {
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

function roadmapWithProgress(job) {
  const phases = (job.roadmapPhases ?? []).map((phase) => ({
    ...phase,
    skills: (phase.skills ?? []).map(withLearningResources),
  }));
  const skills = phases.flatMap((phase) => phase.skills);
  const completed = skills.filter((skill) => skill.completed).length;
  const completionPercentage = skills.length ? Math.round((completed / skills.length) * 100) : 0;

  return {
    id: job.id,
    jobId: job.id,
    totalDays: job.estimatedDays,
    completionPercentage,
    phases,
  };
}

function getJobById(jobId) {
  return userJobs().find((job) => job.id === jobId) ?? null;
}

export const getListJobsQueryKey = () => ["local", "jobs"];
export const getGetJobQueryKey = (jobId) => ["local", "jobs", jobId];
export const getGetRoadmapQueryKey = (jobId) => ["local", "roadmap", jobId];
export const getListProgressQueryKey = () => ["local", "progress"];
export const getGetDashboardSummaryQueryKey = () => ["local", "dashboard", "summary"];
export const getGetWeeklyProgressQueryKey = () => ["local", "dashboard", "weekly-progress"];
export const getGetSkillBreakdownQueryKey = () => ["local", "dashboard", "skill-breakdown"];
export const getGetUpcomingTasksQueryKey = () => ["local", "dashboard", "upcoming-tasks"];
export const getGetMeQueryKey = () => ["local", "me"];
export const getListInterviewsQueryKey = () => ["local", "interviews"];
export const getListCrtQuestionsQueryKey = (params) => ["local", "crt", params];

export function useCreateJob() {
  return useMutation({
    mutationFn: async ({ data }) => {
      const user = currentUser();
      if (!user) {
        throw new Error("Please sign in before uploading a job description.");
      }
      if (!looksLikeJobDescription(data.description)) {
        throw new Error("Please paste a valid job description with role details, responsibilities, requirements, and skills.");
      }

      try {
        const serverJob = await analyzeJobOnServer(data);
        saveUserJob(serverJob);
        return serverJob;
      } catch (error) {
        if (!/Failed to fetch|NetworkError|Backend analysis failed/i.test(error.message ?? "")) {
          throw error;
        }
      }

      const extractedSkills = extractSkills(data.description);
      if (extractedSkills.length === 0) {
        throw new Error("No clear skills were found in this JD. Add the required skills or technologies from the job post and try again.");
      }
      const estimatedDays = daysUntil(data.deadline);
      const difficulty = difficultyFor(extractedSkills, data.description);
      const job = {
        id: Date.now(),
        userEmail: user.email,
        title: data.title,
        company: data.company,
        description: data.description,
        deadline: data.deadline,
        status: "analyzed",
        difficulty,
        estimatedDays,
        extractedSkills,
        createdAt: new Date().toISOString(),
        roadmapPhases: buildRoadmap(extractedSkills, estimatedDays),
      };

      saveUserJob(job);
      return job;
    },
  });
}

export function useListJobs(options) {
  return useQuery({
    queryKey: getListJobsQueryKey(),
    queryFn: async () => userJobs().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    ...(options?.query ?? {}),
  });
}

export function useGetJob(jobId, options) {
  return useQuery({
    queryKey: getGetJobQueryKey(jobId),
    queryFn: async () => getJobById(jobId),
    ...(options?.query ?? {}),
  });
}

export function useGetRoadmap(jobId, options) {
  return useQuery({
    queryKey: getGetRoadmapQueryKey(jobId),
    queryFn: async () => {
      const job = getJobById(jobId);
      return job ? roadmapWithProgress(job) : null;
    },
    ...(options?.query ?? {}),
  });
}

export function useUpdateProgress() {
  return useMutation({
    mutationFn: async ({ roadmapId, skillId, data }) => {
      const job = getJobById(roadmapId);
      if (!job) {
        throw new Error("Roadmap not found.");
      }

      const roadmapPhases = job.roadmapPhases.map((phase) => ({
        ...phase,
        skills: phase.skills.map((skill) =>
          skill.id === skillId
            ? {
                ...skill,
                completed: data.completed,
                completedAt: data.completed ? skill.completedAt ?? new Date().toISOString() : null,
              }
            : skill,
        ),
      }));

      const updatedJob = { ...job, roadmapPhases, status: "in_progress" };
      saveUserJob(updatedJob);
      return roadmapWithProgress(updatedJob);
    },
  });
}

export function useGetDashboardSummary(options) {
  return useQuery({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: async () => {
      const jobs = userJobs();
      const skills = jobs.flatMap((job) => job.roadmapPhases?.flatMap((phase) => phase.skills) ?? []);
      const completedSkills = skills.filter((skill) => skill.completed).length;
      const completionPercentage = skills.length ? Math.round((completedSkills / skills.length) * 100) : 0;

      return {
        totalJobs: jobs.length,
        totalSkills: skills.length,
        completedSkills,
        completionPercentage,
        upcomingDeadlines: jobs.filter((job) => daysUntil(job.deadline) <= 7).length,
        streak: jobs.length ? 1 : 0,
        interviewsCompleted: userInterviews().filter((interview) => interview.status === "completed").length,
      };
    },
    ...(options?.query ?? {}),
  });
}

export function useGetWeeklyProgress(options) {
  return useQuery({
    queryKey: getGetWeeklyProgressQueryKey(),
    queryFn: async () => {
      const days = lastSevenDays();
      const byDate = new Map(days.map((day) => [day.key, day]));
      const jobs = userJobs();

      jobs.forEach((job) => {
        const createdDate = job.createdAt?.slice(0, 10);
        if (byDate.has(createdDate)) {
          byDate.get(createdDate).practice += 1;
        }

        job.roadmapPhases?.forEach((phase) => {
          phase.skills.forEach((skill) => {
            const completedDate = skill.completedAt?.slice(0, 10);
            if (skill.completed && byDate.has(completedDate)) {
              byDate.get(completedDate).skills += 1;
            }
          });
        });
      });

      userInterviews().forEach((interview) => {
        const createdDate = interview.createdAt?.slice(0, 10);
        if (byDate.has(createdDate)) {
          byDate.get(createdDate).interviews += 1;
        }
      });

      return days;
    },
    ...(options?.query ?? {}),
  });
}

export function useGetSkillBreakdown(options) {
  return useQuery({
    queryKey: getGetSkillBreakdownQueryKey(),
    queryFn: async () => {
      const jobs = userJobs();
      const colors = {
        technical: "#0ea5e9",
        practice: "#10b981",
        interview: "#f59e0b",
        dsa: "#10b981",
      };
      const labels = {
        technical: "Learned JD Skills",
        practice: "Completed Practice",
        interview: "Interview Revision Done",
        dsa: "DSA Learned",
      };
      const counts = jobs
        .flatMap((job) => job.roadmapPhases ?? [])
        .reduce((totals, phase) => {
          const learnedCount = (phase.skills ?? []).filter((skill) => skill.completed).length;
          totals[phase.category] = (totals[phase.category] ?? 0) + learnedCount;
          return totals;
        }, {});

      return Object.entries(counts)
        .map(([category, count]) => ({
          category: labels[category] ?? category,
          count,
          color: colors[category] ?? "#0ea5e9",
        }))
        .filter((item) => item.count > 0);
    },
    ...(options?.query ?? {}),
  });
}

export function useGetUpcomingTasks(options) {
  return useQuery({
    queryKey: getGetUpcomingTasksQueryKey(),
    queryFn: async () =>
      userJobs()
        .flatMap((job) => {
          const remainingDays = daysUntil(job.deadline);
          const reminder = remainingDays <= 7
            ? [{
                id: `${job.id}-deadline`,
                type: "deadline",
                title: `${job.title} deadline is approaching`,
                jobTitle: job.company || job.title,
                dueDate: job.deadline,
                daysRemaining: remainingDays,
                message: remainingDays <= 1 ? "Due today" : `${remainingDays} days remaining`,
                priority: "high",
              }]
            : [];
          const skills = (job.roadmapPhases?.[0]?.skills ?? []).slice(0, 2).map((skill) => ({
            id: `${job.id}-${skill.id}`,
            type: "skill",
            title: skill.name,
            jobTitle: job.title,
            dueDate: job.deadline,
            priority: skill.priority,
          }));
          return [...reminder, ...skills];
        })
        .slice(0, 5),
    ...(options?.query ?? {}),
  });
}

export function useGetMe(options) {
  return useQuery({
    queryKey: getGetMeQueryKey(),
    queryFn: async () => {
      const user = currentUser();
      const jobs = userJobs();
      const skills = jobs.flatMap((job) => job.roadmapPhases?.flatMap((phase) => phase.skills) ?? []);
      const completed = skills.filter((skill) => skill.completed).length;

      return {
        ...user,
        createdAt: user?.createdAt ?? new Date().toISOString(),
        totalJobs: jobs.length,
        streak: jobs.length ? 1 : 0,
        completionRate: skills.length ? completed / skills.length : 0,
      };
    },
    ...(options?.query ?? {}),
  });
}

function questionsForInterview(job, type) {
  const skills = job?.extractedSkills ?? ["JavaScript", "React", "Problem Solving"];
  const technical = skills.slice(0, 4).map((skill, index) => ({
    id: `tech-${index + 1}`,
    category: "technical",
    question: `Explain how you would use ${skill} in a real project and what tradeoffs you would watch for.`,
    answered: false,
  }));
  const hr = [
    {
      id: "hr-1",
      category: "hr",
      question: "Tell me about yourself and why this role is a strong fit for you.",
      answered: false,
    },
    {
      id: "hr-2",
      category: "hr",
      question: "Describe a time you solved a difficult problem under pressure.",
      answered: false,
    },
    {
      id: "hr-3",
      category: "hr",
      question: "What is one weakness you are actively improving?",
      answered: false,
    },
  ];

  if (type === "technical") return technical;
  if (type === "hr") return hr;
  return [hr[0], technical[0], technical[1], hr[1], technical[2] ?? hr[2]];
}

function scoreAnswer(answer, question = {}) {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const lowerAnswer = answer.toLowerCase();
  const questionText = question.question ?? "";
  const keywords = [...new Set(questionText.toLowerCase().match(/[a-z][a-z+#.]{3,}/g) ?? [])]
    .filter((word) => !["explain", "would", "your", "with", "what", "about", "tell", "describe", "time"].includes(word))
    .slice(0, 6);
  const keywordHits = keywords.filter((word) => lowerAnswer.includes(word)).length;
  const hasStructure = /situation|task|action|result|first|second|finally|because|example|impact|tradeoff|challenge|outcome/i.test(answer);
  const hasExample = /example|project|built|implemented|used|worked|created|handled|improved|reduced|increased/i.test(answer);
  const hasResult = /result|impact|outcome|therefore|so that|which helped|measured|percent|%|users|latency|time/i.test(answer);
  const lengthScore = Math.min(30, Math.round((words.length / 90) * 30));
  const relevanceScore = Math.min(25, keywordHits * 5 + (keywords.length === 0 ? 10 : 0));
  const structureScore = hasStructure ? 20 : 8;
  const exampleScore = hasExample ? 15 : 5;
  const resultScore = hasResult ? 10 : 3;
  const score = Math.min(95, Math.max(35, lengthScore + relevanceScore + structureScore + exampleScore + resultScore));
  const missing = [
    !hasStructure && "clear structure",
    !hasExample && "a concrete example",
    !hasResult && "the result or impact",
    keywordHits === 0 && keywords.length > 0 && `relevance to ${keywords.slice(0, 2).join(", ")}`,
  ].filter(Boolean);

  return {
    score,
    feedback: score >= 80
      ? "Strong answer. It is relevant to the question, includes practical detail, and explains impact."
      : score >= 60
        ? `Good answer, but it can be stronger by adding ${missing.slice(0, 2).join(" and ") || "more specific detail"}.`
        : `This answer needs more interview detail. Add ${missing.slice(0, 3).join(", ") || "structure, example, and impact"} before submitting in a real interview.`,
    tips: [
      keywords.length ? `Connect your answer directly to: ${keywords.slice(0, 3).join(", ")}.` : "Answer the exact question before adding extra context.",
      "Use a short situation, action, and result flow.",
      "Mention a real decision, tradeoff, metric, or learning.",
    ],
  };
}

function isBackendUnavailable(error) {
  return /Failed to fetch|NetworkError|Backend request failed|Backend analysis failed|Not found|OpenAI request failed|Server error/i.test(error?.message ?? "");
}

export function useListInterviews(options) {
  return useQuery({
    queryKey: getListInterviewsQueryKey(),
    queryFn: async () => userInterviews().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    ...(options?.query ?? {}),
  });
}

export function useCreateInterview() {
  return useMutation({
    mutationFn: async ({ data }) => {
      const user = currentUser();
      const job = getJobById(data.jobId);

      if (!user || !job) {
        throw new Error("Choose a valid job before starting an interview.");
      }

      const fallbackQuestions = questionsForInterview(job, data.type);
      let questions = fallbackQuestions;
      try {
        questions = await postServerJson("/api/interviews/questions", {
          type: data.type,
          job: {
            title: job.title,
            company: job.company,
            description: job.description,
            extractedSkills: job.extractedSkills,
          },
          fallbackQuestions,
        });
      } catch (error) {
        if (!isBackendUnavailable(error)) console.warn("Falling back to local interview questions:", error);
      }

      const interview = {
        id: Date.now(),
        userEmail: user.email,
        jobId: job.id,
        jobTitle: job.title,
        type: data.type,
        status: "active",
        questions,
        score: null,
        feedback: "",
        createdAt: new Date().toISOString(),
      };

      writeInterviews([...readInterviews(), interview]);
      return interview;
    },
  });
}

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: async ({ interviewId, data }) => {
      const interviews = readInterviews();
      const index = interviews.findIndex((interview) => interview.id === interviewId);

      if (index < 0) {
        throw new Error("Interview not found.");
      }

      const interview = interviews[index];
      const currentQuestion = interview.questions.find((question) => question.id === data.questionId);
      let result = scoreAnswer(data.answer, currentQuestion);
      try {
        result = await postServerJson("/api/interviews/evaluate", {
          question: currentQuestion?.question,
          category: currentQuestion?.category,
          answer: data.answer,
          jobTitle: interview.jobTitle,
          fallbackResult: result,
        });
      } catch (error) {
        if (!isBackendUnavailable(error)) console.warn("Falling back to local interview scoring:", error);
      }
      const questions = interview.questions.map((question) =>
        question.id === data.questionId
          ? { ...question, answered: true, answer: data.answer, score: result.score, feedback: result.feedback }
          : question,
      );
      const completed = questions.every((question) => question.answered);
      const answeredScores = questions.filter((question) => question.answered).map((question) => question.score ?? 0);
      const average = answeredScores.length
        ? Math.round(answeredScores.reduce((total, score) => total + score, 0) / answeredScores.length)
        : null;

      interviews[index] = {
        ...interview,
        questions,
        status: completed ? "completed" : "active",
        score: average,
        feedback: completed
          ? "Nice work. Review the feedback from each answer and repeat the session to tighten your examples."
          : interview.feedback,
      };

      writeInterviews(interviews);
      return result;
    },
  });
}

const CRT_QUESTIONS = [
  {
    id: 1,
    category: "aptitude",
    difficulty: "easy",
    question: "A train travels 120 km in 2 hours. What is its average speed?",
    options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"],
    correctOption: 2,
  },
  {
    id: 2,
    category: "aptitude",
    difficulty: "easy",
    question: "If 25% of a number is 40, what is the number?",
    options: ["100", "120", "140", "160"],
    correctOption: 3,
  },
  {
    id: 3,
    category: "aptitude",
    difficulty: "medium",
    question: "A shopkeeper marks an item 20% above cost and gives a 10% discount. What is the profit percentage?",
    options: ["8%", "10%", "12%", "15%"],
    correctOption: 0,
  },
  {
    id: 4,
    category: "aptitude",
    difficulty: "hard",
    question: "Two pipes fill a tank in 12 and 18 minutes. Together, how long will they take?",
    options: ["6.2 min", "7.2 min", "8.4 min", "9 min"],
    correctOption: 1,
  },
  {
    id: 5,
    category: "logical",
    difficulty: "easy",
    question: "Find the next term: 2, 4, 8, 16, ?",
    options: ["20", "24", "30", "32"],
    correctOption: 3,
  },
  {
    id: 6,
    category: "logical",
    difficulty: "easy",
    question: "If CAT is coded as DBU, how is DOG coded?",
    options: ["EPH", "EPI", "FQH", "CNG"],
    correctOption: 0,
  },
  {
    id: 7,
    category: "logical",
    difficulty: "medium",
    question: "Which word does not belong: Apple, Mango, Carrot, Banana?",
    options: ["Apple", "Mango", "Carrot", "Banana"],
    correctOption: 2,
  },
  {
    id: 8,
    category: "logical",
    difficulty: "hard",
    question: "In a row, A is 7th from left and 12th from right. How many people are there?",
    options: ["17", "18", "19", "20"],
    correctOption: 1,
  },
  {
    id: 9,
    category: "verbal",
    difficulty: "easy",
    question: "Choose the synonym of 'Rapid'.",
    options: ["Slow", "Quick", "Weak", "Late"],
    correctOption: 1,
  },
  {
    id: 10,
    category: "verbal",
    difficulty: "easy",
    question: "Choose the correct sentence.",
    options: ["She go to college.", "She goes to college.", "She going college.", "She gone college."],
    correctOption: 1,
  },
  {
    id: 11,
    category: "verbal",
    difficulty: "medium",
    question: "Choose the antonym of 'Scarce'.",
    options: ["Rare", "Limited", "Plentiful", "Insufficient"],
    correctOption: 2,
  },
  {
    id: 12,
    category: "verbal",
    difficulty: "hard",
    question: "Select the best replacement: 'Neither of the answers are correct.'",
    options: ["Neither of the answers is correct.", "Neither answers are correct.", "Neither answer are correct.", "No change"],
    correctOption: 0,
  },
];

function generateCrtBank(category, difficulty, round = 0) {
  const level = { easy: 1, medium: 2, hard: 3 }[difficulty] ?? 1;
  const seed = round + 1;
  const variant = seed * (level + 3);

  if (category === "learned") {
    const learnedSkills = userJobs()
      .flatMap((job) => job.roadmapPhases?.flatMap((phase) => phase.skills) ?? [])
      .filter((skill) => skill.completed)
      .map((skill) => skill.name);
    const fallbackSkills = userJobs().flatMap((job) => job.extractedSkills ?? []);
    const skills = [...new Set([...(learnedSkills.length ? learnedSkills : fallbackSkills), "Problem Solving", "Communication"])].slice(0, 10);

    const templates = {
      easy: [
        (skill) => ({
          question: `What is the best way to explain ${skill} in a beginner interview?`,
          options: [
            `${skill} is only a keyword to add to a resume.`,
            `${skill} is useful but does not need examples.`,
            `${skill} should be explained with its purpose and one simple use case.`,
            `${skill} is always required in every project.`,
          ],
        }),
        (skill) => ({
          question: `Which response shows basic readiness in ${skill}?`,
          options: [
            `I can define ${skill}, mention where it is used, and give a small example.`,
            `I will learn ${skill} after joining.`,
            `${skill} is too broad to explain.`,
            `I know the name ${skill}, but not its usage.`,
          ],
          correctOption: 0,
        }),
      ],
      medium: [
        (skill) => ({
          question: `You used ${skill} in a project. Which answer is most interview-ready?`,
          options: [
            `I used ${skill} because everyone uses it.`,
            `I used ${skill}, explained the requirement, described my implementation, and mentioned one limitation.`,
            `${skill} solved everything automatically.`,
            `I cannot compare ${skill} with any alternative.`,
          ],
          correctOption: 1,
        }),
        (skill) => ({
          question: `What should you include when asked about tradeoffs in ${skill}?`,
          options: [
            `Only advantages.`,
            `Only syntax.`,
            `When it works well, where it struggles, and why you chose it.`,
            `A memorized definition.`,
          ],
          correctOption: 2,
        }),
      ],
      hard: [
        (skill) => ({
          question: `A system using ${skill} is slow in production. What is the strongest interview answer?`,
          options: [
            `Replace ${skill} immediately without debugging.`,
            `Ignore performance until users complain.`,
            `Measure the bottleneck, form a hypothesis, test changes, and explain the final tradeoff.`,
            `Say ${skill} cannot have performance issues.`,
          ],
          correctOption: 2,
        }),
        (skill) => ({
          question: `How would a senior candidate discuss ${skill} architecture decisions?`,
          options: [
            `By naming ${skill} repeatedly.`,
            `By explaining constraints, alternatives, risks, and measurable impact.`,
            `By saying the framework decides everything.`,
            `By avoiding tradeoffs.`,
          ],
          correctOption: 1,
        }),
      ],
    };

    return skills.map((skill, index) => {
      const pool = templates[difficulty] ?? templates.easy;
      const item = pool[(index + round) % pool.length](skill);
      const correctOption = item.correctOption ?? 2;
      return {
        id: `learned-${difficulty}-${round}-${index}-${skill.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        category,
        difficulty,
        question: item.question,
        options: item.options,
        correctOption,
      };
    });
  }

  if (category === "aptitude") {
    return Array.from({ length: 10 }, (_, index) => {
      const kind = (index + seed) % 5;
      const a = (index + 3 + variant) * level;
      const b = (index + 5 + seed) * (level + 1);
      const c = (index + 2 + seed) * 5;
      const answer = kind === 0 ? a + b : kind === 1 ? a * b : kind === 2 ? Math.max(a, b) - Math.min(a, b) : Math.round((a / (a + b)) * 100);
      const question = kind === 0
        ? `A candidate completes ${a} aptitude questions on day one and ${b} on day two. How many are completed in total?`
        : kind === 1
          ? `There are ${a} rows with ${b} seats in each row. How many seats are there?`
          : kind === 2
            ? `A mock test score improved from ${Math.min(a, b)} to ${Math.max(a, b)}. What is the increase?`
            : kind === 3
              ? `${a} out of ${a + b} applicants cleared round one. What percentage cleared it?`
              : `A value increases by ${c}% from ${a}. What is the new value?`;
      const finalAnswer = kind === 4 ? Math.round(a + (a * c) / 100) : answer;
      return {
        id: `aptitude-${difficulty}-${round}-${index}`,
        category,
        difficulty,
        question,
        options: [finalAnswer - level - 2, finalAnswer + level + 3, finalAnswer, finalAnswer + level + 7].map(String),
        correctOption: 2,
      };
    });
  }

  if (category === "logical") {
    return Array.from({ length: 10 }, (_, index) => {
      const start = index + level + seed + variant;
      const step = level + 2 + ((seed + index) % 4);
      const multiplier = level + 1;
      const mode = (index + seed) % 3;
      const isSeries = mode === 0;
      const isLetter = mode === 1;
      const answer = isSeries ? start + step * 4 : String.fromCharCode(65 + ((index + multiplier + seed) % 26));
      return {
        id: `logical-${difficulty}-${round}-${index}`,
        category,
        difficulty,
        question: isSeries
          ? `Find the next number: ${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, ?`
          : isLetter
            ? `If letters move forward by ${multiplier} positions, what does ${String.fromCharCode(65 + ((index + seed) % 26))} become?`
            : `In a row of ${start + step} people, Riya is ${step}th from the left. How many people are to her right?`,
        options: isSeries
          ? [answer - step, answer, answer + step, answer + step * 2].map(String)
          : isLetter
            ? ["A", answer, "M", "Z"]
            : [String(start + step), String(start), String(step), String(Math.max(0, start - step))],
        correctOption: 1,
      };
    });
  }

  const words = [
    ["rapid", "quick"],
    ["scarce", "rare"],
    ["expand", "grow"],
    ["assist", "help"],
    ["accurate", "correct"],
    ["brief", "short"],
    ["calm", "peaceful"],
    ["complex", "complicated"],
    ["reliable", "dependable"],
    ["observe", "notice"],
    ["select", "choose"],
    ["improve", "enhance"],
    ["evaluate", "assess"],
    ["reduce", "decrease"],
    ["essential", "necessary"],
    ["confident", "assured"],
    ["resolve", "settle"],
    ["adapt", "adjust"],
  ];
  const contexts = ["interview answer", "workplace email", "project discussion", "team meeting", "technical report"];

  return Array.from({ length: 10 }, (_, index) => {
    const [word, synonym] = words[(index + seed * 5 + level) % words.length];
    const context = contexts[(index + seed + level) % contexts.length];
    return {
      id: `verbal-${difficulty}-${round}-${index}`,
      category,
      difficulty,
      question: `${difficulty === "hard" ? `In a ${context}, choose` : "Choose"} the closest synonym of "${word}".`,
      options: ["opposite", "unrelated", synonym, "incorrect"],
      correctOption: 2,
    };
  });
}

function findCrtQuestion(questionId) {
  for (const category of ["aptitude", "logical", "verbal", "learned"]) {
    for (const difficulty of ["easy", "medium", "hard"]) {
      for (let round = 0; round < 25; round += 1) {
        const question = generateCrtBank(category, difficulty, round).find((item) => item.id === questionId);
        if (question) return question;
      }
    }
  }
  return CRT_QUESTIONS.find((item) => item.id === questionId);
}

export function useListCrtQuestions(params, options) {
  return useQuery({
    queryKey: getListCrtQuestionsQueryKey(params),
    queryFn: async () => {
      const fallbackQuestions = generateCrtBank(params?.category, params?.difficulty, params?.round ?? 0);
      try {
        const jobs = userJobs();
        return await postServerJson("/api/assessments/questions", {
          ...params,
          skills: jobs.flatMap((job) => job.extractedSkills ?? []).slice(0, 12),
          fallbackQuestions,
        });
      } catch (error) {
        if (!isBackendUnavailable(error)) console.warn("Falling back to local assessment questions:", error);
        return fallbackQuestions;
      }
    },
    ...(options?.query ?? {}),
  });
}

export function useSubmitCrtAnswers() {
  return useMutation({
    mutationFn: async ({ data }) => {
      const correct = [];
      const incorrect = [];

      data.questionIds.forEach((questionId, index) => {
        const question = findCrtQuestion(questionId);
        const selected = data.answers[index];
        const correctOption = data.correctOptions?.[index] ?? question?.correctOption;

        if (selected === correctOption) {
          correct.push(questionId);
        } else {
          incorrect.push(questionId);
        }
      });

      const total = data.questionIds.length;
      const score = correct.length;

      return {
        score,
        total,
        correct,
        incorrect,
        percentage: total ? Math.round((score / total) * 100) : 0,
      };
    },
  });
}
