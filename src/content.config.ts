// Content collections. Each Markdown file = one page. The admin editor (/admin, Sveltia CMS)
// edits these same files, so field names here must match public/admin/config.yml.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const faq = z.object({ q: z.string(), a: z.string() });
const step = z.object({ title: z.string(), text: z.string() });
const formVariant = z.enum(['quote', 'survey', 'station', 'demo', 'b2b', 'brand', 'technician', 'ask']);

/** Service, charger, battery, audience and one-off landing pages share one shape. */
const landing = z.object({
  title: z.string().max(60, 'SEO title must be 60 characters or fewer'),
  description: z.string().min(70).max(170),
  label: z.string(),                 // short name for menus, cards and breadcrumbs
  h1: z.string(),
  eyebrow: z.string().optional(),
  intro: z.string(),                 // first two sentences: answer the search directly
  keyword: z.string(),               // the one main search phrase
  summary: z.string(),               // one line for hub cards
  icon: z.string().default('bolt'),
  order: z.number().default(100),
  image: z.string().optional(),      // photo key from src/data/images.json
  highlights: z.array(z.string()).max(4).default([]),
  costFactors: z.array(z.string()).default([]),
  steps: z.array(step).optional(),
  showProcess: z.boolean().default(true),
  faqs: z.array(faq).default([]),
  related: z.array(z.string()).default([]),
  form: formVariant.default('quote'),
  need: z.string().optional(),
  serviceType: z.string().optional(), // adds Service schema when set
  guide: z.boolean().default(false),  // long guide: shows author box + BlogPosting schema
  updated: z.coerce.date(),
  draft: z.boolean().default(false),
});

const make = (dir: string) => defineCollection({ loader: glob({ pattern: '**/*.md', base: `./src/content/${dir}` }), schema: landing });

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(60, 'SEO title must be 60 characters or fewer'),
    description: z.string().min(70).max(170),
    h1: z.string().optional(),
    keyword: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().default('Vineet Saini'),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    faqs: z.array(faq).default([]),
    related: z.array(z.string()).default([]),
    lang: z.enum(['en', 'hi']).default('en'),
    translationOf: z.string().optional(), // id of the English post this Hindi post translates
    draft: z.boolean().default(false),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    group: z.enum(['Home owners', 'Businesses and investors', 'Operators, brands and EV makers', 'Site survey and installation', 'Chargers, batteries and solar', 'Proline CMS', 'About Proline']),
    order: z.number().default(100),
    lang: z.enum(['en', 'hi']).default('en'),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  services: make('services'),
  chargers: make('chargers'),
  batteries: make('batteries'),
  audiences: make('audiences'),
  pages: make('pages'),
  blog,
  faqs,
};
