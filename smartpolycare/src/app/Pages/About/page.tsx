'use client';
import React from "react";
import { motion } from "framer-motion";

// Simple icon components to replace Lucide React
const Pill = () => <span className="text-2xl">💊</span>;
const Brain = () => <span className="text-2xl">🧠</span>;
const Apple = () => <span className="text-2xl">🍎</span>;
const HeartPulse = () => <span className="text-2xl">❤️</span>;
const Sparkles = () => <span className="text-2xl">✨</span>;
const ShieldCheck = () => <span className="text-2xl">🛡️</span>;
const BarChart3 = () => <span className="text-2xl">📊</span>;
const Bot = () => <span className="text-2xl">🤖</span>;
const Activity = () => <span className="text-2xl">📈</span>;
const Users = () => <span className="text-2xl">👥</span>;
const BookOpen = () => <span className="text-2xl">📚</span>;
const Mail = () => <span className="text-2xl">✉️</span>;

// Simple Card and Button components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const Button = ({ children, className = "", variant = "default" }: { children: React.ReactNode; className?: string; variant?: string }) => (
  <button className={`
    px-6 py-3 rounded-lg font-semibold transition-all duration-200
    ${variant === "default" 
      ? "bg-teal-600 hover:bg-teal-700 text-white" 
      : "border-2 border-gray-300 text-gray-700 hover:border-teal-500 hover:text-teal-600"
    } ${className}
  `}>
    {children}
  </button>
);

const features = [
  {
    title: "Polypharmacy Risk Scoring",
    icon: Pill,
    desc: "Dynamic, ML-powered risk scoring that factors drug–drug interaction severity, high‑risk medications, age, and comorbidities to guide safer prescribing.",
    badge: "EB‑PRS + ML"
  },
  {
    title: "Early Vitamin Deficiency Warning",
    icon: HeartPulse,
    desc: "AI-driven detection of B12, D, folate and other deficits using symptoms, medication history, and lifestyle indicators for proactive care.",
    badge: "Proactive Alerts"
  },
  {
    title: "Personalized Meal Planning",
    icon: Apple,
    desc: "Hybrid rule + ML engine that recommends culturally appropriate meals while avoiding drug–nutrient conflicts and aligning to BMI & clinical goals.",
    badge: "Safe Nutrition"
  },
  {
    title: "Lifestyle & Mental Wellness Advisor",
    icon: Brain,
    desc: "Drug‑free guidance with mindfulness, sleep hygiene, journaling, and emotion-aware nudges—integrated with polypharmacy risk to keep users on track.",
    badge: "Compassionate AI"
  }
];

const pillars = [
  {
    title: "Safety by Design",
    icon: ShieldCheck,
    desc: "We prioritize clinical safety: role-based access, encrypted data, and clear AI boundaries that support—not replace—medical decisions."
  },
  {
    title: "Intelligence Everywhere",
    icon: Bot,
    desc: "From risk prediction to adaptive recommendations, intelligence is woven across modules to enable timely, personalized interventions."
  },
  {
    title: "Outcomes that Matter",
    icon: BarChart3,
    desc: "Fewer adverse events, improved nutrient status, better adherence, and higher quality of life for older adults on complex regimens."
  }
];

const stack = [
  "React/Next.js",
  "Node.js + FastAPI",
  "Python (TensorFlow / PyTorch)",
  "Firebase / PostgreSQL",
  "Tailwind CSS",
  "Framer Motion",
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-blue-50 to-white text-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent" />
        <div className="container mx-auto px-6 pt-24 pb-16 lg:pt-28 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-2 border border-teal-200">
              <Sparkles />
              <span className="text-sm tracking-wider text-teal-700 font-medium">
                SMART POLYPHARMACY & VITAMIN SYSTEM
              </span>
            </div>
            <h1 className="mt-6 text-3xl leading-tight font-bold sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-teal-700">
              About Us
            </h1>
            <p className="mt-5 text-gray-600 max-w-3xl mx-auto text-lg md:text-xl leading-relaxed">
              We are a research‑driven team building an AI‑powered, integrated platform that
              keeps older adults safe, nourished, and supported while living with
              multiple medications. Our system unites risk prediction, nutrition, and
              mental wellness into one compassionate experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-6 pb-8 lg:pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map(({ title, icon: Icon, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Card className="bg-white border-teal-100 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-teal-100 p-3 border border-teal-200">
                      <Icon />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What we build */}
      <section className="container mx-auto px-6 py-8 lg:py-12">
        <div className="max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">What We Build</h2>
          <p className="mt-3 text-gray-600 md:text-lg leading-relaxed">
            An end‑to‑end, modular platform tailored for geriatric care. It connects
            clinicians, caregivers, and patients through explainable AI, real‑time
            feedback, and accessible design.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, icon: Icon, desc, badge }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <Card className="h-full bg-white border-teal-100 hover:border-teal-300 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl bg-teal-50 p-3 border border-teal-200">
                      <Icon />
                    </div>
                    <span className="text-xs uppercase tracking-wider bg-teal-100 text-teal-700 px-2 py-1 rounded-md border border-teal-200 font-medium">
                      {badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* System Snapshot */}
      <section className="container mx-auto px-6 py-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <Card className="bg-white border-teal-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Activity />
                <h3 className="text-lg font-bold text-gray-900">How It Works</h3>
              </div>
              <ol className="mt-4 space-y-3 text-sm text-gray-600">
                <li><span className="font-bold text-gray-900">1) Ingest:</span> Patient profile, medications, symptoms, lifestyle, labs.</li>
                <li><span className="font-bold text-gray-900">2) Predict:</span> ML models compute polypharmacy risk & deficiency risk.</li>
                <li><span className="font-bold text-gray-900">3) Recommend:</span> Safe meals, vitamin guidance, and lifestyle support.</li>
                <li><span className="font-bold text-gray-900">4) Adapt:</span> Wearables & feedback loops fine‑tune plans in real time.</li>
                <li><span className="font-bold text-gray-900">5) Report:</span> Clear dashboards for clinicians, caregivers, and patients.</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-white border-teal-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users />
                <h3 className="text-lg font-bold text-gray-900">Who We Serve</h3>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-teal-50 p-4 border border-teal-200">
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-900">Patients & Caregivers:</span> Elder‑friendly UI, reminders, insights, and peace of mind.</p>
                </div>
                <div className="rounded-xl bg-teal-50 p-4 border border-teal-200">
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-900">Clinicians:</span> Risk dashboards, explainability, and safe recommendation context.</p>
                </div>
                <div className="rounded-xl bg-teal-50 p-4 border border-teal-200 md:col-span-2">
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-900">Health Systems:</span> Scalable cloud architecture, security by default, and simple integration pathways.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech & Methods */}
      <section className="container mx-auto px-6 py-8 lg:py-12">
        <Card className="bg-white border-teal-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen />
              <h3 className="text-lg font-bold text-gray-900">Technology & Methods</h3>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">AI/ML</h4>
                <p className="mt-1 text-sm text-gray-600">Risk prediction (XGBoost/Random Forest), rule‑based clinical guards, emotion recognition, reinforcement loops.</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Architecture</h4>
                <p className="mt-1 text-sm text-gray-600">Microservices with Node.js + FastAPI, real‑time sync, secure APIs, cloud‑native CI/CD.</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Data</h4>
                <p className="mt-1 text-sm text-gray-600">Drug–drug & drug–nutrient knowledge bases, EHR‑compatible models, structured logs for audits and learning.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {stack.map((s) => (
                <span key={s} className="text-xs bg-teal-100 border border-teal-200 px-3 py-1 rounded-full text-teal-700 font-medium">
                  {s}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 pt-2 pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-emerald-500/10 border border-teal-200 p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-[1.2fr_.8fr] md:items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Partner with Us</h3>
              <p className="mt-2 text-gray-600 text-sm md:text-base leading-relaxed">
                We collaborate with clinicians, health systems, and researchers to validate
                and scale safe, explainable AI for geriatric care. Let's co‑design the
                future of preventive medicine.
              </p>
            </div>
            <div className="flex md:justify-end gap-3">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Mail /> Contact Team
              </Button>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:border-teal-500">
                <BarChart3 /> View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}