// Language-independent data. Text lives in src/locales/*.json.
import idp from './assets/work/idp.webp'
import lymit from './assets/work/lymit_labs.webp'
import browsemate from './assets/work/browsemate.webp'
import nav from './assets/work/smart_navigation.webp'
import resto from './assets/work/saas_restaurants.webp'
import home from './assets/work/services_domicile.webp'

export const LINKS = {
  email: 'mailto:bourichaamine0@gmail.com',
  emailLabel: 'bourichaamine0@gmail.com',
  whatsapp: 'https://wa.me/212677992837',
  linkedin: 'https://www.linkedin.com/in/ahmed-amine-bouricha-0227a0209/',
  github: 'https://github.com/ahmedamine12',
  article: 'https://xelops.technology/blog/l-avenir-du-sre-l-intelligence-artificielle-au-service-de-la-fiabilite/',
}

// Tech per experience entry, same order as exp.items in the locales
export const EXP_TECH = [
  ['Java', 'Spring Boot', 'Python', 'React', 'Angular', 'Qdrant', 'PostgreSQL', 'Flyway', 'Docker', 'Jenkins', 'Azure DevOps', 'AS400'],
  ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Tailwind CSS', 'Playwright', 'Vercel'],
  ['Java', 'Cucumber', 'Selenium', 'TestNG', 'QAF', 'GitLab'],
  ['Java', 'Spring Boot', 'Angular', 'MySQL'],
  ['Java', 'Spring Boot', 'Angular', 'MySQL', 'REST APIs'],
]

// size: 'lg' spans two columns in the bento grid
export const WORK = [
  { id: 'idp', img: idp, size: 'lg', tone: '#0a1120', tech: ['OCR + LLM', 'RAG', 'Qdrant', 'Spring Boot', 'React', 'Docker'], badge: 'confidential' },
  { id: 'lymit', img: lymit, size: 'lg', tone: '#e0f2fe', tech: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Playwright'], badge: 'on_request' },
  { id: 'browsemate', img: browsemate, tone: '#4c1d95', tech: ['JavaScript', 'Manifest V3', 'OpenAI', 'Gemini', 'Groq'],
    live: 'https://chromewebstore.google.com/detail/easyai-chat/ghajibpgpnacjbeglihopdfdapalpgne',
    github: 'https://github.com/ahmedamine12/Extention_EasyAI_Chat' },
  { id: 'nav', img: nav, tone: '#070b14', tech: ['React Native', 'Spring Boot', 'PostGIS', 'Redis', 'Docker', 'Kubernetes'],
    github: 'https://github.com/Smart-Navigation' },
  { id: 'resto', img: resto, tone: '#fbf3e8', tech: ['Spring Boot', 'Angular', 'MySQL', 'Square API', 'Uber Eats API'] },
  { id: 'home', img: home, tone: '#d1fae5', tech: ['Spring Boot', 'Angular', 'MySQL'] },
]

export const SKILLS = {
  ai: ['RAG', 'Intelligent Document Processing', 'LLM integration', 'Embeddings & vector search', 'Qdrant', 'Prompt engineering', 'AI agents'],
  backend: ['Java', 'Spring Boot', 'Spring Security', 'Spring Data JPA', 'Python', 'FastAPI', 'Flask', 'REST APIs', 'Microservices'],
  frontend: ['React', 'Redux / Saga', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5 / CSS3'],
  data: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'PostGIS', 'Flyway', 'AS400'],
  devops: ['Docker', 'Kubernetes', 'Jenkins', 'Azure DevOps', 'GitLab', 'CI/CD pipelines', 'SRE practices'],
  qa: ['Cucumber', 'Selenium', 'TestNG', 'QAF', 'Playwright'],
}



