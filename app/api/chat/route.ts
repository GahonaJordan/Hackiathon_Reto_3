import { OpenAI } from "openai";
import hospitals from "@/data/hospitals.json";
import insurance from "@/data/insurance.json";

type Specialty = "Cardiologia" | "Dermatologia" | "Psicologia" | "Neurologia";

type Hospital = {
  name: string;
  specialty: Specialty;
  price: number;
};

type InsuranceBenefit = {
  coverage: number;
  minimumCopay: number;
};

type InsurancePlan = {
  name: string;
  plan: string;
  networkHospitals: string[];
  benefits: Partial<Record<Specialty, InsuranceBenefit>>;
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function normalizeSpecialty(raw: string | undefined) {
  if (!raw) return undefined;

  const normalized = raw.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const map: Record<string, Specialty> = {
    cardiologia: "Cardiologia",
    cardio: "Cardiologia",
    cardiology: "Cardiologia",
    dermatologia: "Dermatologia",
    derma: "Dermatologia",
    dermatology: "Dermatologia",
    psicologia: "Psicologia",
    psychology: "Psicologia",
    neurologia: "Neurologia",
    neuro: "Neurologia",
    neurology: "Neurologia",
    migrana: "Neurologia",
    migraña: "Neurologia",
    cefalea: "Neurologia",
  };

  for (const key of Object.keys(map)) {
    if (normalized.includes(key)) return map[key];
  }

  return undefined;
}

function detectSpecialtyFromText(text: string) {
  const normalized = text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const keywords: Array<[string[], Specialty]> = [
    [["pecho", "dolor en el pecho", "opresion", "angina", "chest", "cardio", "palpitaciones"], "Cardiologia"],
    [["erupcion", "roncha", "rash", "piel", "prurito", "derma", "eczema", "urticaria"], "Dermatologia"],
    [["ansiedad", "depresi", "miedo", "stress", "estres", "ansioso", "angustia", "panico"], "Psicologia"],
    [["cabeza", "migra", "cefalea", "vomito", "nausea", "mareo", "vertigo", "convulsion", "desmayo"], "Neurologia"],
  ];

  for (const [keys, specialty] of keywords) {
    for (const keyword of keys) {
      if (normalized.includes(keyword)) return specialty;
    }
  }

  return undefined;
}

function estimateCopay(hospitalPrice: number, benefit: InsuranceBenefit, inNetwork: boolean) {
  const baseCopay = Math.max(benefit.minimumCopay, Math.round((hospitalPrice * (100 - benefit.coverage)) / 100));
  return inNetwork ? baseCopay : Math.round(baseCopay * 1.35);
}

async function detectSpecialty(message: string) {
  if (!openai) {
    console.log("⚠️ OpenAI no configurado (sin OPENAI_API_KEY)");
    return detectSpecialtyFromText(message);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a medical triage assistant. Return only one exact word from this list: Cardiologia, Dermatologia, Psicologia, Neurologia. Do not add punctuation or extra text.",
        },
        {
          role: "user",
          content: `Symptoms: ${message}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    const specialty = response.choices[0]?.message?.content?.trim();
    console.log("✅ Respuesta ChatGPT:", specialty);
    const normalized = normalizeSpecialty(specialty);
    if (normalized) return normalized;

    return detectSpecialtyFromText(message);
  } catch (error) {
    console.error("❌ Error ChatGPT:", error instanceof Error ? error.message : String(error));
    return detectSpecialtyFromText(message);
  }
}

async function generateConversationalSummary(params: {
  symptom: string;
  specialty: Specialty;
  bestHospital: {
    name: string;
    estimatedCopay: number;
    inNetwork: boolean;
  };
  coverage: number;
  minimumCopay: number;
}) {
  const fallback = `Síntoma interpretado como ${params.specialty}. El hospital más conveniente es ${params.bestHospital.name} con copago estimado de $${params.bestHospital.estimatedCopay}.`;

  if (!openai) return fallback;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un asesor de beneficios de salud. Responde en español de forma clara y breve (2 a 4 oraciones), usando solo los datos entregados.",
        },
        {
          role: "user",
          content: `Sintoma: ${params.symptom}\nEspecialidad: ${params.specialty}\nHospital recomendado: ${params.bestHospital.name}\nCopago estimado: $${params.bestHospital.estimatedCopay}\nCobertura del plan: ${params.coverage}%\nCopago minimo: $${params.minimumCopay}\nHospital en red: ${params.bestHospital.inNetwork ? "si" : "no"}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 120,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    return summary || fallback;
  } catch (error) {
    console.error("❌ Error ChatGPT resumen:", error instanceof Error ? error.message : String(error));
    return fallback;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return Response.json({
        error: true,
        message: "Describe el síntoma para estimar especialidad y copago.",
      });
    }

    const specialty = await detectSpecialty(message);

    if (!specialty) {
      return Response.json({
        error: true,
        message: "No pude inferir la especialidad. Prueba con más detalle del síntoma.",
      });
    }

    const patient = insurance[0] as InsurancePlan;
    const benefit = patient.benefits[specialty] ?? { coverage: 0, minimumCopay: 0 };

    const availableHospitals = (hospitals as Hospital[]).filter((hospital) => hospital.specialty === specialty);

    if (availableHospitals.length === 0) {
      return Response.json({
        error: true,
        message: `No encontré hospitales para ${specialty}.`,
      });
    }

    const hospitalOptions = availableHospitals
      .map((hospital) => {
        const inNetwork = patient.networkHospitals.includes(hospital.name);
        const estimatedCopay = estimateCopay(hospital.price, benefit, inNetwork);

        return {
          name: hospital.name,
          specialty: hospital.specialty,
          price: hospital.price,
          inNetwork,
          estimatedCopay,
        };
      })
      .sort((left, right) => {
        if (left.inNetwork !== right.inNetwork) return left.inNetwork ? -1 : 1;
        return left.estimatedCopay - right.estimatedCopay;
      });

    const bestHospital = hospitalOptions[0];

    const summary = await generateConversationalSummary({
      symptom: message,
      specialty,
      bestHospital,
      coverage: benefit.coverage,
      minimumCopay: benefit.minimumCopay,
    });

    return Response.json({
      error: false,
      specialty,
      patient: {
        name: patient.name,
        plan: patient.plan,
      },
      benefit: {
        coverage: benefit.coverage,
        minimumCopay: benefit.minimumCopay,
      },
      hospitalOptions,
      bestHospital,
      summary,
    });
  } catch (error) {
    console.log(error);

    return Response.json({
      error: true,
      message: "Error processing request",
    });
  }
}