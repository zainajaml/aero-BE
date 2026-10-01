// Common IT job titles for team members. Client-safe (no server imports).
const IT_JOB_TITLES = [
  "Backend Developer",
  "Business Analyst",
  "Cloud Architect",
  "Data Engineer",
  "Data Scientist",
  "Database Administrator",
  "DevOps Engineer",
  "Engineering Manager",
  "Frontend Developer",
  "Full Stack Developer",
  "Machine Learning Engineer",
  "Mobile Developer",
  "Network Engineer",
  "Product Manager",
  "Project Manager",
  "QA Engineer",
  "Scrum Master",
  "Security Engineer",
  "Site Reliability Engineer",
  "Software Engineer",
  "Solutions Architect",
  "Support Engineer",
  "Systems Administrator",
  "Technical Lead",
  "UI/UX Designer",
] as const;

// Classic business / operational roles for non-developer team members.
const BUSINESS_JOB_TITLES = [
  "Account Executive",
  "Accountant",
  "Administrative Assistant",
  "Chief Executive Officer",
  "Chief Financial Officer",
  "Chief Operating Officer",
  "Content Strategist",
  "Controller",
  "Customer Success Manager",
  "Customer Support Representative",
  "Department Manager",
  "Director",
  "Finance Analyst",
  "Finance Manager",
  "HR Manager",
  "Human Resources Specialist",
  "IT Manager",
  "IT Support Specialist",
  "Logistics Coordinator",
  "Marketing Manager",
  "Marketing Specialist",
  "Office Manager",
  "Operations Analyst",
  "Operations Manager",
  "Sales Manager",
  "Sales Representative",
  "Supply Chain Manager",
  "Team Lead",
  "Vice President",
] as const;

export function jobTitlesForRole(role: string): readonly string[] {
  if (role === "developer") return IT_JOB_TITLES;
  if (role === "team" || role === "viewer") return BUSINESS_JOB_TITLES;
  // admin / super_admin: show both, merged and sorted A-Z
  return [...IT_JOB_TITLES, ...BUSINESS_JOB_TITLES].sort((a, b) => a.localeCompare(b));
}
